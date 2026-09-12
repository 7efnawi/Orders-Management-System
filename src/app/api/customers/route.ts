import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { listCustomers } from "@/services/customers";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 11: Customer CRM API Route (Task 11.2 — FR-CUST-01..08)
// ═══════════════════════════════════════════════════════════════════════════
// Invariant (FR-CUST-07): Searchable & filterable customer directory
// Invariant: Customer deletion is strictly prohibited (Immutability)
// ═══════════════════════════════════════════════════════════════════════════

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().optional(),
  tier: z.string().trim().optional(),
  hasProblems: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string") return val.toLowerCase() === "true" || val === "1";
      return undefined;
    }),
});

export async function GET(request: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      if (value !== "") {
        rawParams[key] = value;
      }
    }

    const query = customerQuerySchema.parse(rawParams);
    const result = await listCustomers(query);

    return NextResponse.json(result);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Immutability Enforcement: Reject mutations on the collection root
// Customer deletion is strictly prohibited across the dark kitchen platform
// ─────────────────────────────────────────────────────────────────────────────

const METHOD_NOT_ALLOWED = () =>
  NextResponse.json(
    {
      code: "METHOD_NOT_ALLOWED",
      message:
        "Customer deletion is strictly prohibited. Modifying collection directly via root endpoint is not supported.",
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
