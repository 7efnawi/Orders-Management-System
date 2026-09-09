import { prisma } from "@/lib/prisma";

export * from "@/lib/auditDiff";
import {
  type AuditLogFilter,
  type AuditLogWithUser,
  type AuditSummaryStats,
  buildAuditWhereClause,
} from "@/lib/auditDiff";

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
