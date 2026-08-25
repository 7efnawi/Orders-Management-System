// Single Source of Truth لصلاحيات الأدوار (Directives §3 — FR-AUTH-02)
// requireRole(...) يُستدعى في أول سطر من كل API route — الراوت هو خط الدفاع.

import type { Role } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/** يرمي FORBIDDEN لو الـ session مش موجود أو الدور غير مسموح — Phase 2 implementation */
export async function requireRole(...allowed: Role[]): Promise<SessionUser> {
  void allowed;
  throw new Error("NOT_IMPLEMENTED — Phase 2 (Authentication & Roles)");
}
