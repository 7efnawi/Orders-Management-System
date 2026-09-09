import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { AuditAction } from "@prisma/client";
import { requireRole, AuthError } from "@/lib/auth";
import { listAuditLogs, getAuditStats } from "@/services/audit";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 10: Audit Log Protected API Route (Task 10.2 — FR-AUD-02 & FR-AUD-03)
// ═══════════════════════════════════════════════════════════════════════════
// Invariant (FR-AUD-03): Strict Owner-Only Access
// Invariant (FR-AUD-02): Absolute Immutability (GET only, 405 on mutations)
// ═══════════════════════════════════════════════════════════════════════════

export const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  userId: z.string().uuid().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  entityType: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid startDate").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid endDate").optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireRole("OWNER");
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        {
          code: err.code,
          message:
            err.code === "UNAUTHENTICATED"
              ? "Unauthorized"
              : "Forbidden: Owner role required",
        },
        { status: err.code === "UNAUTHENTICATED" ? 401 : 403 }
      );
    }
    throw err;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      if (value !== "") {
        queryParams[key] = value;
      }
    }

    const validation = auditQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const query = validation.data;
    const [{ logs, total, page, limit, totalPages }, stats] = await Promise.all([
      listAuditLogs(query),
      getAuditStats({
        startDate: query.startDate,
        endDate: query.endDate,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total,
        page,
        limit,
        totalPages,
        stats,
      },
    });
  } catch (error) {
    console.error("[api/audit]", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Immutability Enforcement (FR-AUD-02): Reject all mutations via API
// ─────────────────────────────────────────────────────────────────────────────

const METHOD_NOT_ALLOWED = () =>
  NextResponse.json(
    {
      code: "METHOD_NOT_ALLOWED",
      message: "Audit logs are strictly immutable. No modifications or creations allowed via API.",
    },
    { status: 405 }
  );

export async function POST() {
  return METHOD_NOT_ALLOWED();
}

export async function PUT() {
  return METHOD_NOT_ALLOWED();
}

export async function PATCH() {
  return METHOD_NOT_ALLOWED();
}

export async function DELETE() {
  return METHOD_NOT_ALLOWED();
}
