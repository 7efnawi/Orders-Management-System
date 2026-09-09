import { AuditAction, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 10: Audit Service Layer & Semantic Diff Engine (FR-AUD-01..05)
// ═══════════════════════════════════════════════════════════════════════════
// Invariant (FR-AUD-02): Absolute Immutability — Audit logs are strictly append-only.
// No delete, update, or clear functions are exported.
// Writing is handled exclusively via src/lib/audit.ts inside database transactions.
// ═══════════════════════════════════════════════════════════════════════════

export interface AuditLogFilter {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogWithUser {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface FieldDiff {
  field: string;
  labelAr: string;
  labelEn: string;
  oldValue: any;
  newValue: any;
  type: "text" | "currency" | "status" | "boolean" | "role" | "json";
}

export interface AuditSummaryStats {
  totalLogs: number;
  todayCount: number;
  statusChangeCount: number;
  criticalCount: number;
}

interface FieldMeta {
  labelAr: string;
  labelEn: string;
  type: "text" | "currency" | "status" | "boolean" | "role" | "json";
}

/**
 * قاموس حقول النطاق لترجمة الفوارق إلى لغة واضحة للمستخدم
 */
export const AUDIT_FIELD_DICTIONARY: Record<string, FieldMeta> = {
  status: { labelAr: "الحالة", labelEn: "Status", type: "status" },
  role: { labelAr: "الصلاحية / الدور", labelEn: "Role", type: "role" },
  discountAmount: { labelAr: "قيمة الخصم", labelEn: "Discount Amount", type: "currency" },
  discountReason: { labelAr: "سبب الخصم", labelEn: "Discount Reason", type: "text" },
  discountApprovedBy: { labelAr: "معتمد الخصم", labelEn: "Discount Approved By", type: "text" },
  cancelReason: { labelAr: "سبب الإلغاء", labelEn: "Cancel Reason", type: "text" },
  cancelNotes: { labelAr: "ملاحظات الإلغاء", labelEn: "Cancel Notes", type: "text" },
  subtotal: { labelAr: "المجموع الفرعي", labelEn: "Subtotal", type: "currency" },
  total: { labelAr: "الإجمالي", labelEn: "Total", type: "currency" },
  deliveryFee: { labelAr: "رسوم التوصيل", labelEn: "Delivery Fee", type: "currency" },
  tax: { labelAr: "الضريبة", labelEn: "Tax", type: "currency" },
  isActive: { labelAr: "الحالة النشطة", labelEn: "Active Status", type: "boolean" },
  name: { labelAr: "الاسم", labelEn: "Name", type: "text" },
  email: { labelAr: "البريد الإلكتروني", labelEn: "Email", type: "text" },
  notes: { labelAr: "الملاحظات", labelEn: "Notes", type: "text" },
  category: { labelAr: "التصنيف", labelEn: "Category", type: "text" },
  brand: { labelAr: "البراند", labelEn: "Brand", type: "text" },
  brandId: { labelAr: "معرّف البراند", labelEn: "Brand ID", type: "text" },
  platform: { labelAr: "المنصة", labelEn: "Platform", type: "text" },
  platformId: { labelAr: "معرّف المنصة", labelEn: "Platform ID", type: "text" },
  driverId: { labelAr: "معرّف السائق", labelEn: "Driver ID", type: "text" },
  driver: { labelAr: "السائق", labelEn: "Driver", type: "text" },
  paymentMethod: { labelAr: "طريقة الدفع", labelEn: "Payment Method", type: "text" },
  paymentStatus: { labelAr: "حالة الدفع", labelEn: "Payment Status", type: "status" },
  price: { labelAr: "السعر", labelEn: "Price", type: "currency" },
  amount: { labelAr: "المبلغ", labelEn: "Amount", type: "currency" },
  description: { labelAr: "الوصف", labelEn: "Description", type: "text" },
  phone: { labelAr: "الهاتف", labelEn: "Phone", type: "text" },
  address: { labelAr: "العنوان", labelEn: "Address", type: "text" },
  items: { labelAr: "الأصناف", labelEn: "Items", type: "json" },
  orderType: { labelAr: "نوع الطلب", labelEn: "Order Type", type: "text" },
  source: { labelAr: "المصدر", labelEn: "Source", type: "text" },
};

/**
 * تحليل ومقارنة كائني JSON لحساب الفوارق الدلالية (Semantic Diff Engine)
 */
export function computeAuditDiff(oldValue: any, newValue: any): FieldDiff[] {
  if (!oldValue && !newValue) {
    return [];
  }

  const parseObj = (val: any) => {
    if (val == null) return null;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (parsed && typeof parsed === "object") return parsed;
      } catch {
        return { value: val };
      }
    }
    if (typeof val === "object") return val;
    return { value: val };
  };

  const oldObj = parseObj(oldValue);
  const newObj = parseObj(newValue);

  if (!oldObj && !newObj) {
    return [];
  }

  if (oldObj && newObj && JSON.stringify(oldObj) === JSON.stringify(newObj)) {
    return [];
  }

  const oldRecord = oldObj ?? {};
  const newRecord = newObj ?? {};

  const allKeys = Array.from(new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]));
  const diffs: FieldDiff[] = [];

  for (const key of allKeys) {
    const valOld = Object.prototype.hasOwnProperty.call(oldRecord, key) ? oldRecord[key] : null;
    const valNew = Object.prototype.hasOwnProperty.call(newRecord, key) ? newRecord[key] : null;

    if (JSON.stringify(valOld) === JSON.stringify(valNew)) {
      continue;
    }

    const meta = AUDIT_FIELD_DICTIONARY[key] || {
      labelAr: key,
      labelEn: key,
      type:
        typeof valNew === "number" || typeof valOld === "number"
          ? "currency"
          : typeof valNew === "boolean" || typeof valOld === "boolean"
          ? "boolean"
          : typeof valNew === "object" || typeof valOld === "object"
          ? "json"
          : "text",
    };

    diffs.push({
      field: key,
      labelAr: meta.labelAr,
      labelEn: meta.labelEn,
      oldValue: valOld,
      newValue: valNew,
      type: meta.type,
    });
  }

  return diffs;
}

/**
 * حساب مؤشرات وإحصائيات سجل التدقيق التجميعية في الذاكرة (للاختبارات والـ Mock)
 */
export function calculateMockAuditStats(
  logs: { action: string; timestamp: Date | string }[]
): AuditSummaryStats {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 86400000;

  let totalLogs = logs.length;
  let todayCount = 0;
  let statusChangeCount = 0;
  let criticalCount = 0;

  for (const log of logs) {
    const time = new Date(log.timestamp).getTime();
    if (time >= startOfToday && time < endOfToday) {
      todayCount++;
    }
    if (log.action === "STATUS_CHANGE") {
      statusChangeCount++;
    }
    if (
      log.action === "CANCEL" ||
      log.action === "DISCOUNT_APPROVE" ||
      log.action === "DISCOUNT_REJECT"
    ) {
      criticalCount++;
    }
  }

  return {
    totalLogs,
    todayCount,
    statusChangeCount,
    criticalCount,
  };
}

/**
 * بناء جملة where للفلترة والبحث في سجل التدقيق
 */
export function buildAuditWhereClause(filters?: AuditLogFilter): any {
  const where: any = {};

  if (!filters) {
    return where;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.search && filters.search.trim().length > 0) {
    where.entityId = {
      contains: filters.search.trim(),
      mode: "insensitive",
    };
  } else if (filters.entityId) {
    where.entityId = filters.entityId;
  }

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      if (/^\d{4}-\d{2}-\d{2}$/.test(filters.startDate)) {
        start.setUTCHours(0, 0, 0, 0);
      }
      where.timestamp.gte = start;
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      if (/^\d{4}-\d{2}-\d{2}$/.test(filters.endDate)) {
        end.setUTCHours(23, 59, 59, 999);
      }
      where.timestamp.lte = end;
    }
  }

  return where;
}

/**
 * جلب قائمة سجلات التدقيق مع دعم الفلترة والترقيم والتضمين
 */
export async function listAuditLogs(filters?: AuditLogFilter): Promise<{
  logs: AuditLogWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.max(1, Math.min(100, filters?.limit ?? 25));
  const skip = (page - 1) * limit;

  const where = buildAuditWhereClause(filters);

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timestamp: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  return {
    logs: logs as AuditLogWithUser[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * حساب إحصائيات التدقيق التجميعية الحية من قاعدة البيانات
 */
export async function getAuditStats(dateRange?: {
  startDate?: string;
  endDate?: string;
}): Promise<AuditSummaryStats> {
  const where = buildAuditWhereClause(dateRange);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalLogs, todayCount, statusChangeCount, criticalCount] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({
      where: {
        ...where,
        timestamp: {
          gte: startOfToday,
        },
      },
    }),
    prisma.auditLog.count({
      where: {
        ...where,
        action: "STATUS_CHANGE",
      },
    }),
    prisma.auditLog.count({
      where: {
        ...where,
        action: {
          in: ["CANCEL", "DISCOUNT_APPROVE", "DISCOUNT_REJECT"],
        },
      },
    }),
  ]);

  return {
    totalLogs,
    todayCount,
    statusChangeCount,
    criticalCount,
  };
}

/**
 * استرجاع سجل تدقيق فردي بالمعرّف مع بيانات المستخدم
 */
export async function getAuditLogById(id: string): Promise<AuditLogWithUser | null> {
  const log = await prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return log as AuditLogWithUser | null;
}
