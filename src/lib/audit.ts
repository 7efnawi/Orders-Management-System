// Single Source of Truth لتسجيل الـ Audit (Directives §3 — FR-AUD-05)
// يُستدعى حصريًا من src/services/ داخل نفس transaction العملية —
// ممنوع استدعاؤه مباشرة من صفحات أو API routes، وممنوع الكتابة على Order
// بدون المرور من طبقة الخدمات.

import { Prisma } from "@prisma/client";
import type { AuditAction } from "@prisma/client";
import type { prisma } from "./prisma";

type Tx = Prisma.TransactionClient | typeof prisma;

export interface AuditEntry {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
}

/** يُستدعى داخل prisma.$transaction من طبقة الخدمات فقط — فشله يفشل العملية كلها */
export function audit(tx: Tx, entry: AuditEntry): Promise<unknown> {
  // Phase 4 implementation — signature ثابتة من الآن
  return (tx as Tx).auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      oldValue: entry.oldValue ?? Prisma.JsonNull,
      newValue: entry.newValue ?? Prisma.JsonNull,
    },
  });
}
