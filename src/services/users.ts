import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

// طبقة الخدمات للمستخدمين — أي كتابة على User تمر من هنا (Directives §2)

export type EnsureUserResult =
  | { ok: true; userId: string; name: string; role: "OWNER" | "MANAGER" | "CASHIER" }
  | { ok: false; reason: "NOT_AUTHORIZED" | "INACTIVE" };

/**
 * يُستدعى بعد نجاح تسجيل الدخول من Supabase.
 * Bootstrap آمن: أول حساب يدخل (بشرط مطابقته OWNER_EMAIL لو متاحة) بيتسجل Owner،
 * وأي إيميل مش موجود في جدول User مرفوض — المستخدمين بيضافوا من UI الأونر (Phase 10).
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
