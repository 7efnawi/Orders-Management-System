import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError, type SessionUser } from "@/lib/auth";
import type { Role } from "@prisma/client";

// توحيد ردود أخطاء الـ API: { code, message } — حسب المواصفة §8

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

/** يرجع المستخدم أو NextResponse جاهزة بالخطأ — الاستخدام:
 *   const user = await requireApiRole("OWNER", "MANAGER");
 *   if (user instanceof NextResponse) return user;
 */
export async function requireApiRole(
  ...allowed: Role[]
): Promise<SessionUser | NextResponse> {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in required", 401);
  if (!allowed.includes(user.role)) {
    return apiError("FORBIDDEN", "Insufficient role", 403);
  }
  return user;
}

export function isResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}

/** يلف معالج الراوت ويوحّد الأخطاء غير المتوقعة */
export function wrapApi(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  return handler().catch((err) => {
    if (err instanceof ZodError) {
      return apiError("VALIDATION_ERROR", "Invalid request body", 400);
    }
    if (err instanceof AuthError) {
      return apiError(err.code, err.code, err.code === "FORBIDDEN" ? 403 : 401);
    }
    if (err instanceof Error) {
      if (err.message === "NOT_FOUND" || err.message.startsWith("NOT_FOUND") || err.message.includes("NOT_FOUND")) {
        const colonIdx = err.message.indexOf(":");
        const code = colonIdx > -1 ? err.message.slice(0, colonIdx).trim() : (err.message.startsWith("NOT_FOUND") ? "NOT_FOUND" : err.message);
        const message = colonIdx > -1 ? err.message.slice(colonIdx + 1).trim() : "Entity not found";
        return apiError(code, message, 404);
      }
      if (err.message.startsWith("FORBIDDEN")) {
        return apiError("FORBIDDEN", err.message.replace(/^FORBIDDEN:?\s*/, "") || "Insufficient role", 403);
      }
      if (
        err.message.startsWith("INVALID_") ||
        err.message.startsWith("CANCEL_REASON_REQUIRED") ||
        err.message.startsWith("TERMINAL_STATUS") ||
        err.message.startsWith("EMPTY_ORDER") ||
        err.message.startsWith("DRIVER_INACTIVE") ||
        err.message.startsWith("DISCOUNT_REASON_REQUIRED") ||
        err.message.startsWith("DUPLICATE_") ||
        err.message.startsWith("SHIFT_")
      ) {
        const colonIdx = err.message.indexOf(":");
        const code = colonIdx > -1 ? err.message.slice(0, colonIdx).trim() : err.message;
        const message = colonIdx > -1 ? err.message.slice(colonIdx + 1).trim() : err.message;
        return apiError(code, message, 400);
      }
    }
    console.error("[api]", err);
    return apiError("INTERNAL", "Unexpected error", 500);
  });
}
