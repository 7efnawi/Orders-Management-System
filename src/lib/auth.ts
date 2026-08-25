import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "./prisma";

// Single Source of Truth لصلاحيات الأدوار (Directives §3 — FR-AUTH-02)
// المصدر: جدول User محليًا (المواصفة §4) مع جلسة Supabase Auth

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export class AuthError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "FORBIDDEN" | "INACTIVE") {
    super(code);
  }
}

/** يُخزَّن لكل request — كل استدعاءات نفس الريكويست بتشارك نتيجة واحدة */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const local = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!local || !local.isActive) return null;

  return { id: local.id, email: local.email, name: local.name, role: local.role };
});

/** للـ API routes — بيرمي AuthError والراوت بيحوّلها 401/403 */
export async function requireRole(...allowed: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("UNAUTHENTICATED");
  if (allowed.length > 0 && !allowed.includes(user.role)) throw new AuthError("FORBIDDEN");
  return user;
}

/** للصفحات — بيعمل redirect للـ login بدل exception */
export async function requirePageUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
