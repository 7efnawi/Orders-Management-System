import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

// طبقة خدمات المصروفات (أنواع المصروفات وتسجيل وحصر وتعديل المصروفات) — Directives §2, §3, §4
// Single source of truth لكافة عمليات إدارة المصروفات مع تسجيل الـ AuditLog ذرّيًا

export const DEFAULT_EXPENSE_TYPES = [
  "ديلفري خارجي",
  "أدوات كهربائية",
  "أدوات نظافة",
  "بدل شفت",
  "إيجار",
  "مياة",
  "كهرباء",
  "أصول",
  "صيانات",
  "سلف",
  "غاز",
  "أدوات كتابية",
  "دعايا الفيس",
  "تليفون ونت",
  "إصابات",
  "نقل",
  "إكراميات",
  "غذائية",
  "باكنج",
  "مشروبات",
] as const;

export interface CreateExpenseInput {
  expenseTypeId: string;
  description: string;
  quantity?: number;
  value: number;
  date?: string | Date;
}

export interface UpdateExpenseInput {
  expenseTypeId?: string;
  description?: string;
  quantity?: number;
  value?: number;
  date?: string | Date;
}

export interface ExpenseListFilters {
  startDate?: string;
  endDate?: string;
  date?: string;
  expenseTypeId?: string;
  createdBy?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

function normalizeExpenseDate(d?: string | Date): Date {
  if (!d) return new Date();
  const parsed = typeof d === "string" ? new Date(d) : d;
  if (isNaN(parsed.getTime())) {
    throw new Error("INVALID_DATE: Invalid expense date provided");
  }
  return parsed;
}

/**
 * بذر الأنواع الافتراضية العشرين في حال عدم وجودها
 */
export async function seedDefaultExpenseTypes(): Promise<number> {
  const result = await prisma.expenseType.createMany({
    data: DEFAULT_EXPENSE_TYPES.map((name) => ({
      name,
      isDefault: true,
    })),
    skipDuplicates: true,
  });
  return result.count;
}

/**
 * جلب جميع أنواع المصروفات مع ضمان وجود الأنواع الافتراضية
 * مرتبة حسب الافتراضي أولاً ثم الاسم أبجديًا
 */
export async function listExpenseTypes() {
  await seedDefaultExpenseTypes();
  return prisma.expenseType.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    include: {
      user: {
        select: { id: true, name: true, role: true },
      },
    },
  });
}

/**
 * إنشاء نوع مصروف مخصص جديد مع تسجيل الـ Audit ذرّيًا
 */
export async function createExpenseType(userId: string, name: string) {
  const trimmedName = name?.trim();
  if (!trimmedName) {
    throw new Error("INVALID_NAME: Expense type name is required");
  }
  if (!userId?.trim()) {
    throw new Error("INVALID_USER_ID: User ID is required");
  }

  const existing = await prisma.expenseType.findUnique({
    where: { name: trimmedName },
  });
  if (existing) {
    throw new Error("DUPLICATE_NAME: Expense type with this name already exists");
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.expenseType.create({
      data: {
        name: trimmedName,
        isDefault: false,
        createdBy: userId,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    await audit(tx, {
      userId,
      action: "CREATE",
      entityType: "ExpenseType",
      entityId: created.id,
      newValue: {
        name: created.name,
        isDefault: false,
        createdBy: userId,
      },
    });

    return created;
  });
}

/**
 * تعديل اسم نوع المصروف مع التحقق وتسجيل الـ Audit ذرّيًا
 */
export async function updateExpenseType(userId: string, typeId: string, name: string) {
  const trimmedName = name?.trim();
  if (!trimmedName) {
    throw new Error("INVALID_NAME: Expense type name is required");
  }
  if (!typeId?.trim()) {
    throw new Error("INVALID_TYPE_ID: Expense type ID is required");
  }

  const existing = await prisma.expenseType.findUnique({
    where: { id: typeId },
  });
  if (!existing) {
    throw new Error("NOT_FOUND: Expense type not found");
  }

  const duplicate = await prisma.expenseType.findFirst({
    where: {
      name: trimmedName,
      NOT: { id: typeId },
    },
  });
  if (duplicate) {
    throw new Error("DUPLICATE_NAME: An expense type with this name already exists");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.expenseType.update({
      where: { id: typeId },
      data: { name: trimmedName },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    await audit(tx, {
      userId,
      action: "UPDATE",
      entityType: "ExpenseType",
      entityId: typeId,
      oldValue: { name: existing.name },
      newValue: { name: trimmedName },
    });

    return updated;
  });
}

/**
 * حذف نوع المصروف مع التحقق من عدم وجود مصروفات مرتبطة وتسجيل الـ Audit ذرّيًا
 */
export async function deleteExpenseType(userId: string, typeId: string) {
  if (!typeId?.trim()) {
    throw new Error("INVALID_TYPE_ID: Expense type ID is required");
  }

  const existing = await prisma.expenseType.findUnique({
    where: { id: typeId },
    include: {
      _count: {
        select: { expenses: true },
      },
    },
  });
  if (!existing) {
    throw new Error("NOT_FOUND: Expense type not found");
  }

  if (existing._count.expenses > 0) {
    throw new Error(
      `CANNOT_DELETE_EXPENSE_TYPE_IN_USE: Cannot delete expense type with ${existing._count.expenses} associated expenses.`
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.expenseType.delete({
      where: { id: typeId },
    });

    await audit(tx, {
      userId,
      action: "CANCEL",
      entityType: "ExpenseType",
      entityId: typeId,
      oldValue: {
        name: existing.name,
        isDefault: existing.isDefault,
      },
    });

    return { success: true, deletedId: typeId, name: existing.name };
  });
}

/**
 * تسجيل مصروف جديد مع التحقق وتسجيل الـ Audit ذرّيًا
 */
export async function createExpense(userId: string, input: CreateExpenseInput) {
  if (!userId?.trim()) {
    throw new Error("INVALID_USER_ID: User ID is required");
  }
  if (!input.expenseTypeId?.trim()) {
    throw new Error("INVALID_EXPENSE_TYPE_ID: Expense type is required");
  }
  const trimmedDesc = input.description?.trim();
  if (!trimmedDesc) {
    throw new Error("INVALID_DESCRIPTION: Expense description is required");
  }
  if (input.value === undefined || input.value === null || input.value <= 0 || isNaN(input.value)) {
    throw new Error("INVALID_VALUE: Expense value must be greater than zero");
  }
  const quantity = input.quantity ?? 1;
  if (quantity < 1 || !Number.isInteger(quantity)) {
    throw new Error("INVALID_QUANTITY: Expense quantity must be an integer greater than or equal to 1");
  }

  const dateObj = normalizeExpenseDate(input.date);

  return prisma.$transaction(async (tx) => {
    const expenseType = await tx.expenseType.findUnique({
      where: { id: input.expenseTypeId },
    });
    if (!expenseType) {
      throw new Error("NOT_FOUND: Expense type not found");
    }

    const created = await tx.expense.create({
      data: {
        expenseTypeId: input.expenseTypeId,
        description: trimmedDesc,
        quantity,
        value: new Prisma.Decimal(input.value),
        date: dateObj,
        createdBy: userId,
      },
      include: {
        expenseType: true,
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    await audit(tx, {
      userId,
      action: "CREATE",
      entityType: "Expense",
      entityId: created.id,
      newValue: {
        expenseTypeId: created.expenseTypeId,
        expenseTypeName: created.expenseType.name,
        description: created.description,
        quantity: created.quantity,
        value: Number(created.value),
        date: created.date.toISOString().split("T")[0],
        createdBy: userId,
      },
    });

    return created;
  });
}

/**
 * تعديل مصروف موجود مع التحقق وتسجيل الـ Audit ذرّيًا
 */
export async function updateExpense(
  userId: string,
  expenseId: string,
  data: UpdateExpenseInput
) {
  if (!userId?.trim()) {
    throw new Error("INVALID_USER_ID: User ID is required");
  }
  if (!expenseId?.trim()) {
    throw new Error("INVALID_EXPENSE_ID: Expense ID is required");
  }
  if (data.description !== undefined && !data.description.trim()) {
    throw new Error("INVALID_DESCRIPTION: Expense description cannot be empty");
  }
  if (data.value !== undefined && (data.value <= 0 || isNaN(data.value))) {
    throw new Error("INVALID_VALUE: Expense value must be greater than zero");
  }
  if (data.quantity !== undefined && (data.quantity < 1 || !Number.isInteger(data.quantity))) {
    throw new Error("INVALID_QUANTITY: Expense quantity must be an integer greater than or equal to 1");
  }
  if (data.expenseTypeId !== undefined && !data.expenseTypeId.trim()) {
    throw new Error("INVALID_EXPENSE_TYPE_ID: Expense type ID cannot be empty");
  }

  return prisma.$transaction(async (tx) => {
    const before = await tx.expense.findUnique({
      where: { id: expenseId },
      include: { expenseType: true },
    });
    if (!before) {
      throw new Error("NOT_FOUND: Expense not found");
    }

    if (data.expenseTypeId && data.expenseTypeId !== before.expenseTypeId) {
      const typeExists = await tx.expenseType.findUnique({
        where: { id: data.expenseTypeId },
      });
      if (!typeExists) {
        throw new Error("NOT_FOUND: New expense type not found");
      }
    }

    const patch: Prisma.ExpenseUpdateInput = {};
    if (data.description !== undefined) patch.description = data.description.trim();
    if (data.value !== undefined) patch.value = new Prisma.Decimal(data.value);
    if (data.quantity !== undefined) patch.quantity = data.quantity;
    if (data.date !== undefined) patch.date = normalizeExpenseDate(data.date);
    if (data.expenseTypeId !== undefined) {
      patch.expenseType = { connect: { id: data.expenseTypeId } };
    }

    const after = await tx.expense.update({
      where: { id: expenseId },
      data: patch,
      include: {
        expenseType: true,
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    await audit(tx, {
      userId,
      action: "UPDATE",
      entityType: "Expense",
      entityId: expenseId,
      oldValue: {
        expenseTypeId: before.expenseTypeId,
        expenseTypeName: before.expenseType.name,
        description: before.description,
        quantity: before.quantity,
        value: Number(before.value),
        date: before.date.toISOString().split("T")[0],
      },
      newValue: {
        expenseTypeId: after.expenseTypeId,
        expenseTypeName: after.expenseType.name,
        description: after.description,
        quantity: after.quantity,
        value: Number(after.value),
        date: after.date.toISOString().split("T")[0],
      },
    });

    return after;
  });
}

/**
 * حذف مصروف مع تسجيل الـ Audit ذرّيًا
 */
export async function deleteExpense(userId: string, expenseId: string) {
  if (!userId?.trim()) {
    throw new Error("INVALID_USER_ID: User ID is required");
  }
  if (!expenseId?.trim()) {
    throw new Error("INVALID_EXPENSE_ID: Expense ID is required");
  }

  return prisma.$transaction(async (tx) => {
    const before = await tx.expense.findUnique({
      where: { id: expenseId },
      include: { expenseType: true },
    });
    if (!before) {
      throw new Error("NOT_FOUND: Expense not found");
    }

    await tx.expense.delete({
      where: { id: expenseId },
    });

    await audit(tx, {
      userId,
      action: "CANCEL",
      entityType: "Expense",
      entityId: expenseId,
      oldValue: {
        expenseTypeId: before.expenseTypeId,
        expenseTypeName: before.expenseType.name,
        description: before.description,
        quantity: before.quantity,
        value: Number(before.value),
        date: before.date.toISOString().split("T")[0],
        createdBy: before.createdBy,
      },
      newValue: { deleted: true },
    });

    return { success: true, id: expenseId };
  });
}

/**
 * جلب وتصفية المصروفات مع حساب الإجمالي والعدد الكلي
 */
export async function listExpenses(filters: ExpenseListFilters = {}) {
  let dateRangeWhere: Prisma.DateTimeFilter | undefined = undefined;

  if (filters.date) {
    const dStr = typeof filters.date === "string" ? filters.date.split("T")[0] : "";
    if (dStr) {
      dateRangeWhere = {
        gte: new Date(`${dStr}T00:00:00.000Z`),
        lte: new Date(`${dStr}T23:59:59.999Z`),
      };
    }
  } else if (filters.startDate || filters.endDate) {
    dateRangeWhere = {};
    if (filters.startDate) {
      const s = filters.startDate.split("T")[0];
      dateRangeWhere.gte = new Date(`${s}T00:00:00.000Z`);
    }
    if (filters.endDate) {
      const e = filters.endDate.split("T")[0];
      dateRangeWhere.lte = new Date(`${e}T23:59:59.999Z`);
    }
  }

  const where: Prisma.ExpenseWhereInput = {
    ...(dateRangeWhere ? { date: dateRangeWhere } : {}),
    ...(filters.expenseTypeId ? { expenseTypeId: filters.expenseTypeId } : {}),
    ...(filters.createdBy ? { createdBy: filters.createdBy } : {}),
    ...(filters.search?.trim()
      ? { description: { contains: filters.search.trim(), mode: "insensitive" } }
      : {}),
  };

  const [expenses, totalAgg, totalCount] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        expenseType: true,
        user: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: filters.limit,
      skip: filters.offset,
    }),
    prisma.expense.aggregate({
      where,
      _sum: { value: true },
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    expenses,
    totalAmount: Number(totalAgg._sum.value ?? 0),
    totalCount,
  };
}

/**
 * جلب تفاصيل مصروف محدد بالـ ID
 */
export async function getExpenseById(id: string) {
  if (!id?.trim()) return null;
  return prisma.expense.findUnique({
    where: { id },
    include: {
      expenseType: true,
      user: {
        select: { id: true, name: true, role: true },
      },
    },
  });
}
