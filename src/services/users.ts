import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";

// طبقة الخدمات للمستخدمين — أي كتابة على User تمر من هنا (Directives §2)

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

export interface UserFilter {
  role?: Role;
  isActive?: boolean;
  search?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role: Role;
  tempPassword?: string;
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  isActive?: boolean;
  tempPassword?: string;
}

export class UserError extends Error {
  constructor(
    public code:
      | "USER_NOT_FOUND"
      | "EMAIL_EXISTS"
      | "INVALID_INPUT"
      | "CANNOT_DEACTIVATE_SELF"
      | "CANNOT_DEMOTE_SELF"
      | "CANNOT_DELETE_SELF"
      | "FORBIDDEN_DELETE"
      | "FORBIDDEN"
      | "AUTH_PROVISIONING_FAILED"
  ) {
    super(code);
  }
}

/**
 * جلب قائمة المستخدمين مع دعم الفلترة والبحث
 */
export async function listUsers(filters?: UserFilter): Promise<ManagedUser[]> {
  const where: {
    role?: Role;
    isActive?: boolean;
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      email?: { contains: string; mode: "insensitive" };
    }>;
  } = {};

  if (filters?.role) {
    where.role = filters.role;
  }

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters?.search && filters.search.trim().length > 0) {
    const term = filters.search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * إنشاء مستخدم جديد في النظام مع التحقق من عدم تكرار البريد،
 * وإنشاء حساب Supabase Auth المرتبط به والتدقيق الذري.
 */
export async function createUser(
  actorUserId: string,
  input: CreateUserInput,
  actorRole?: Role
): Promise<ManagedUser> {
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  const role = input.role;
  const tempPassword = input.tempPassword;

  if (!name || !email || !role) {
    throw new UserError("INVALID_INPUT");
  }

  // المدير لا يمكنه إنشاء سوى كاشير
  if (actorRole === "MANAGER" && role !== "CASHIER") {
    throw new UserError("FORBIDDEN");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new UserError("INVALID_INPUT");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.isActive) {
    throw new UserError("EMAIL_EXISTS");
  }

  // إنشاء حساب Supabase Auth إن وُجد Admin Client وكلمة المرور المؤقتة
  if (tempPassword) {
    const admin = createAdminClient();
    if (admin) {
      try {
        const { data: userList } = await admin.auth.admin.listUsers();
        const existingAuthUser = userList?.users.find(
          (u) => u.email?.toLowerCase() === email
        );

        if (existingAuthUser) {
          const { error: updateErr } = await admin.auth.admin.updateUserById(
            existingAuthUser.id,
            {
              password: tempPassword,
              email_confirm: true,
              user_metadata: { name },
            }
          );
          if (updateErr) {
            console.error("[createUser] Failed to update existing Supabase auth user:", updateErr);
          }
        } else {
          const { error: createErr } = await admin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { name },
          });
          if (createErr) {
            console.error("[createUser] Failed to create Supabase auth user:", createErr);
            throw new UserError("AUTH_PROVISIONING_FAILED");
          }
        }
      } catch (err) {
        if (err instanceof UserError) throw err;
        console.error("[createUser] Supabase admin error:", err);
      }
    }
  }

  // إذا كان المستخدم موجوداً سابقاً كـ inactive، يُعاد تفعيله وتحديث بياناته
  if (existing) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: existing.id },
        data: {
          name,
          role,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      await audit(tx, {
        userId: actorUserId,
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        oldValue: {
          name: existing.name,
          role: existing.role,
          isActive: existing.isActive,
        },
        newValue: {
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        },
      });

      return user;
    });
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await audit(tx, {
      userId: actorUserId,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      newValue: {
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });

    return user;
  });
}

/**
 * تعديل بيانات المستخدم (الاسم، الدور، حالة التفعيل) مع حماية المالك الذاتية والتدقيق الذري
 */
export async function updateUser(
  actorUserId: string,
  targetUserId: string,
  data: UpdateUserInput,
  actorRole?: Role
): Promise<ManagedUser> {
  const existing = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!existing) {
    throw new UserError("USER_NOT_FOUND");
  }

  // المدير لا يمكنه تعديل سوى حسابات الكاشير ولا يمكنه ترقيتهم
  if (actorRole === "MANAGER") {
    if (existing.role !== "CASHIER") {
      throw new UserError("FORBIDDEN");
    }
    if (data.role && data.role !== "CASHIER") {
      throw new UserError("FORBIDDEN");
    }
  }

  // حماية المالك من تعطيل نفسه أو سحب صلاحية المالك من حسابه
  if (actorUserId === targetUserId) {
    if (data.isActive === false) {
      throw new UserError("CANNOT_DEACTIVATE_SELF");
    }
    if (data.role && data.role !== "OWNER") {
      throw new UserError("CANNOT_DEMOTE_SELF");
    }
  }

  const updateData: { name?: string; role?: Role; isActive?: boolean } = {};

  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) throw new UserError("INVALID_INPUT");
    updateData.name = trimmed;
  }

  if (data.role !== undefined) {
    updateData.role = data.role;
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  // إذا كان الحساب معطلاً ويُعاد تفعيله، يتم إعادة إنشاء أو تحديث حساب Supabase Auth بكلمة المرور المؤقتة
  if (existing.isActive === false && data.isActive === true && data.tempPassword) {
    const admin = createAdminClient();
    if (admin) {
      try {
        const { data: userList } = await admin.auth.admin.listUsers();
        const existingAuthUser = userList?.users.find(
          (u) => u.email?.toLowerCase() === existing.email.toLowerCase()
        );

        if (existingAuthUser) {
          const { error: updateErr } = await admin.auth.admin.updateUserById(
            existingAuthUser.id,
            {
              password: data.tempPassword,
              email_confirm: true,
              user_metadata: { name: data.name || existing.name },
            }
          );
          if (updateErr) {
            console.error("[updateUser] Failed to update Supabase auth user on reactivate:", updateErr);
          }
        } else {
          const { error: createErr } = await admin.auth.admin.createUser({
            email: existing.email,
            password: data.tempPassword,
            email_confirm: true,
            user_metadata: { name: data.name || existing.name },
          });
          if (createErr) {
            console.error("[updateUser] Failed to create Supabase auth user on reactivate:", createErr);
            throw new UserError("AUTH_PROVISIONING_FAILED");
          }
        }
      } catch (err) {
        if (err instanceof UserError) throw err;
        console.error("[updateUser] Supabase admin error on reactivate:", err);
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await audit(tx, {
      userId: actorUserId,
      action: "UPDATE",
      entityType: "User",
      entityId: updated.id,
      oldValue: {
        name: existing.name,
        role: existing.role,
        isActive: existing.isActive,
      },
      newValue: {
        name: updated.name,
        role: updated.role,
        isActive: updated.isActive,
      },
    });

    return updated;
  });
}

/**
 * حذف المستخدم (إلغاء حساب Supabase Auth وتعطيل الحساب محلياً مع التدقيق)
 * المالك يمكنه حذف أي مستخدم غير نفسه، المدير يمكنه حذف الكاشير فقط.
 */
export async function deleteUser(
  actorUserId: string,
  actorRole: Role,
  targetUserId: string
): Promise<ManagedUser> {
  const existing = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!existing) {
    throw new UserError("USER_NOT_FOUND");
  }

  if (actorUserId === targetUserId) {
    throw new UserError("CANNOT_DELETE_SELF");
  }

  // المدير لا يمكنه حذف سوى كاشير
  if (actorRole === "MANAGER" && existing.role !== "CASHIER") {
    throw new UserError("FORBIDDEN_DELETE");
  }

  // حذف الحساب من Supabase Auth إن وجد Admin Client
  const admin = createAdminClient();
  if (admin) {
    try {
      const { data: userList } = await admin.auth.admin.listUsers();
      const authUser = userList?.users.find(
        (u) => u.email?.toLowerCase() === existing.email.toLowerCase()
      );
      if (authUser) {
        await admin.auth.admin.deleteUser(authUser.id);
      }
    } catch (err) {
      console.error("[deleteUser] Failed to delete user from Supabase Auth:", err);
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: targetUserId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await audit(tx, {
      userId: actorUserId,
      action: "UPDATE",
      entityType: "User",
      entityId: targetUserId,
      oldValue: {
        name: existing.name,
        role: existing.role,
        isActive: existing.isActive,
      },
      newValue: {
        isActive: false,
        deleted: true,
      },
    });

    return updated;
  });
}

export type EnsureUserResult =
  | { ok: true; userId: string; name: string; role: Role }
  | { ok: false; reason: "NOT_AUTHORIZED" | "INACTIVE" };

/**
 * يُستدعى بعد نجاح تسجيل الدخول من Supabase.
 * Bootstrap آمن: أول حساب يدخل (بشرط مطابقته OWNER_EMAIL لو متاحة) بيتسجل Owner،
 * وأي إيميل مش موجود في جدول User مرفوض — المستخدمين بيضافوا من UI الأونر (Phase 9/10).
 */
export async function ensureLocalUser(authEmail: string): Promise<EnsureUserResult> {
  const email = authEmail.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.isActive) return { ok: false, reason: "INACTIVE" };
    return { ok: true, userId: existing.id, name: existing.name, role: existing.role };
  }

  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const userCount = await prisma.user.count();
  const isFirst = userCount === 0;

  // رفض صريح لأي حساب غير معروف — Fail-Safe Defaults (Directives §4)
  if (!isFirst && (!ownerEmail || email !== ownerEmail)) {
    return { ok: false, reason: "NOT_AUTHORIZED" };
  }

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: email.split("@")[0],
        role: isFirst ? "OWNER" : "CASHIER",
      },
    });
    await audit(tx, {
      userId: user.id,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      newValue: { email: user.email, role: user.role },
    });
    return user;
  });

  return { ok: true, userId: created.id, name: created.name, role: created.role };
}


