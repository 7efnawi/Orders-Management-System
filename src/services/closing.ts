import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { calculateShiftSummary, type ShiftFinancialSummary } from "@/lib/closing";

// طبقة خدمات إدارة الشيفتات والإغلاق اليومي ومطابقة الخزينة — Directives §2, §3, §4
// Single source of truth لعمليات فتح وإغلاق الشيفتات وحسابات الإغلاق مع تسجيل الـ AuditLog ذرّيًا

export interface ClosingListFilters {
  startDate?: string | Date;
  endDate?: string | Date;
  date?: string | Date;
  cashierId?: string;
  limit?: number;
  offset?: number;
}

export interface ShiftPreviewResult {
  shift: {
    id: string;
    cashierId: string;
    openedAt: Date | string;
    closedAt: Date | string | null;
    cashier: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
  ordersCount: number;
  expensesCount: number;
  summary: ShiftFinancialSummary;
  orders: {
    id: string;
    orderNumber: string;
    status: string;
    paymentMethod: string;
    subtotal: Prisma.Decimal | number;
    discount: Prisma.Decimal | number;
    deliveryFee: Prisma.Decimal | number;
    createdAt: Date | string;
  }[];
  expenses: {
    id: string;
    description: string;
    quantity: number;
    value: Prisma.Decimal | number;
    createdAt: Date | string;
    expenseType: {
      id: string;
      name: string;
    };
  }[];
}

/**
 * جلب الشيفت المفتوح حاليًا لكاشير محدد
 */
export async function getCurrentOpenShift(cashierId: string) {
  if (!cashierId?.trim()) {
    throw new Error("INVALID_USER_ID: Cashier ID is required");
  }

  return prisma.shift.findFirst({
    where: {
      cashierId: cashierId.trim(),
      closedAt: null,
    },
    include: {
      cashier: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
}

/**
 * فتح شيفت جديد لكاشير مع التحقق من عدم وجود شيفت مفتوح مسبقًا وتسجيل الـ Audit ذرّيًا
 */
export async function openShift(cashierId: string) {
  const trimmedCashierId = cashierId?.trim();
  if (!trimmedCashierId) {
    throw new Error("INVALID_USER_ID: Cashier ID is required");
  }

  // التحقق من وجود الكاشير
  const cashier = await prisma.user.findUnique({
    where: { id: trimmedCashierId },
  });
  if (!cashier) {
    throw new Error("NOT_FOUND: Cashier user not found");
  }

  // التحقق من عدم وجود شيفت مفتوح حاليًا لنفس الكاشير
  const existingShift = await prisma.shift.findFirst({
    where: {
      cashierId: trimmedCashierId,
      closedAt: null,
    },
  });

  if (existingShift) {
    throw new Error("SHIFT_ALREADY_OPEN: Cashier already has an active open shift");
  }

  return prisma.$transaction(async (tx) => {
    const openedAt = new Date();
    const created = await tx.shift.create({
      data: {
        cashierId: trimmedCashierId,
        openedAt,
      },
      include: {
        cashier: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await audit(tx, {
      userId: trimmedCashierId,
      action: "CREATE",
      entityType: "Shift",
      entityId: created.id,
      newValue: {
        cashierId: created.cashierId,
        openedAt: created.openedAt.toISOString(),
      },
    });

    return created;
  });
}

/**
 * جلب المعاينة المالية الحية للشيفت (أوردرات ومصروفات وصافي الكاش)
 */
export async function getShiftPreview(shiftId: string): Promise<ShiftPreviewResult> {
  const trimmedShiftId = shiftId?.trim();
  if (!trimmedShiftId) {
    throw new Error("INVALID_SHIFT_ID: Shift ID is required");
  }

  const shift = await prisma.shift.findUnique({
    where: { id: trimmedShiftId },
    include: {
      cashier: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (!shift) {
    throw new Error("NOT_FOUND: Shift not found");
  }

  const dateFilter: Prisma.DateTimeFilter = {
    gte: shift.openedAt,
    ...(shift.closedAt ? { lte: shift.closedAt } : {}),
  };

  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: {
        cashierId: shift.cashierId,
        createdAt: dateFilter,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        subtotal: true,
        discount: true,
        deliveryFee: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({
      where: {
        createdAt: dateFilter,
      },
      select: {
        id: true,
        description: true,
        quantity: true,
        value: true,
        createdAt: true,
        expenseType: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const summary = calculateShiftSummary(orders, expenses);

  return {
    shift,
    ordersCount: orders.length,
    expensesCount: expenses.length,
    summary,
    orders,
    expenses,
  };
}

/**
 * إغلاق الشيفت وتسجيل الإغلاق اليومي DailyClosing في معاملة ذرية مع الـ AuditLog
 */
export async function closeShift(userId: string, shiftId: string, notes?: string | null) {
  const trimmedUserId = userId?.trim();
  const trimmedShiftId = shiftId?.trim();

  if (!trimmedUserId) {
    throw new Error("INVALID_USER_ID: User ID is required");
  }
  if (!trimmedShiftId) {
    throw new Error("INVALID_SHIFT_ID: Shift ID is required");
  }

  const shift = await prisma.shift.findUnique({
    where: { id: trimmedShiftId },
    include: {
      cashier: {
        select: { id: true, name: true, email: true, role: true },
      },
      closing: true,
    },
  });

  if (!shift) {
    throw new Error("NOT_FOUND: Shift not found");
  }

  if (shift.closedAt !== null || shift.closing !== null) {
    throw new Error("SHIFT_ALREADY_CLOSED: Shift is already closed");
  }

  const closedAt = new Date();

  // جلب طلبات ومصروفات الشيفت حتى لحظة الإغلاق
  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: {
        cashierId: shift.cashierId,
        createdAt: {
          gte: shift.openedAt,
          lte: closedAt,
        },
      },
      select: {
        status: true,
        paymentMethod: true,
        subtotal: true,
        discount: true,
        deliveryFee: true,
      },
    }),
    prisma.expense.findMany({
      where: {
        createdAt: {
          gte: shift.openedAt,
          lte: closedAt,
        },
      },
      select: {
        quantity: true,
        value: true,
      },
    }),
  ]);

  const summary = calculateShiftSummary(orders, expenses);
  const trimmedNotes = notes?.trim() || null;

  return prisma.$transaction(async (tx) => {
    // 1. تحديث الشيفت بتوقيت الإغلاق
    const updatedShift = await tx.shift.update({
      where: { id: trimmedShiftId },
      data: { closedAt },
      include: {
        cashier: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // 2. إنشاء سجل الإغلاق اليومي
    const closing = await tx.dailyClosing.create({
      data: {
        shiftId: trimmedShiftId,
        date: closedAt,
        totalOrders: summary.totalOrders,
        cancelledOrders: summary.cancelledOrders,
        totalCash: new Prisma.Decimal(summary.totalCash),
        totalVisa: new Prisma.Decimal(summary.totalVisa),
        totalOnline: new Prisma.Decimal(summary.totalOnline),
        totalDeliveryFees: new Prisma.Decimal(summary.totalDeliveryFees),
        totalExpenses: new Prisma.Decimal(summary.totalExpenses),
        netCash: new Prisma.Decimal(summary.netCash),
        notes: trimmedNotes,
        closedAt,
      },
    });

    // 3. توثيق سجل المراقبة ذرّيًا
    await audit(tx, {
      userId: trimmedUserId,
      action: "CREATE",
      entityType: "DailyClosing",
      entityId: closing.id,
      newValue: {
        shiftId: closing.shiftId,
        cashierId: shift.cashierId,
        date: closing.date.toISOString().split("T")[0],
        totalOrders: closing.totalOrders,
        cancelledOrders: closing.cancelledOrders,
        totalCash: Number(closing.totalCash),
        totalVisa: Number(closing.totalVisa),
        totalOnline: Number(closing.totalOnline),
        totalDeliveryFees: Number(closing.totalDeliveryFees),
        totalExpenses: Number(closing.totalExpenses),
        netCash: Number(closing.netCash),
        notes: closing.notes,
        closedAt: closing.closedAt.toISOString(),
      },
    });

    return {
      shift: updatedShift,
      closing,
    };
  });
}

/**
 * جلب وتصفية سجلات الإغلاق اليومي مع الفلترة بالتاريخ والكاشير
 */
export async function listDailyClosings(filters: ClosingListFilters = {}) {
  let dateRangeWhere: Prisma.DateTimeFilter | undefined = undefined;

  if (filters.date) {
    const dStr =
      typeof filters.date === "string"
        ? filters.date.split("T")[0]
        : filters.date.toISOString().split("T")[0];
    if (dStr) {
      dateRangeWhere = {
        gte: new Date(`${dStr}T00:00:00.000Z`),
        lte: new Date(`${dStr}T23:59:59.999Z`),
      };
    }
  } else if (filters.startDate || filters.endDate) {
    dateRangeWhere = {};
    if (filters.startDate) {
      const s =
        typeof filters.startDate === "string"
          ? filters.startDate.split("T")[0]
          : filters.startDate.toISOString().split("T")[0];
      dateRangeWhere.gte = new Date(`${s}T00:00:00.000Z`);
    }
    if (filters.endDate) {
      const e =
        typeof filters.endDate === "string"
          ? filters.endDate.split("T")[0]
          : filters.endDate.toISOString().split("T")[0];
      dateRangeWhere.lte = new Date(`${e}T23:59:59.999Z`);
    }
  }

  const where: Prisma.DailyClosingWhereInput = {
    ...(dateRangeWhere ? { date: dateRangeWhere } : {}),
    ...(filters.cashierId ? { shift: { cashierId: filters.cashierId } } : {}),
  };

  const [closings, totalCount] = await Promise.all([
    prisma.dailyClosing.findMany({
      where,
      include: {
        shift: {
          include: {
            cashier: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
      orderBy: { closedAt: "desc" },
      take: filters.limit,
      skip: filters.offset,
    }),
    prisma.dailyClosing.count({ where }),
  ]);

  return {
    closings,
    totalCount,
  };
}

/**
 * جلب تفاصيل إغلاق محدد بالـ ID
 */
export async function getDailyClosingById(closingId: string) {
  const trimmedId = closingId?.trim();
  if (!trimmedId) return null;

  return prisma.dailyClosing.findUnique({
    where: { id: trimmedId },
    include: {
      shift: {
        include: {
          cashier: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  });
}
