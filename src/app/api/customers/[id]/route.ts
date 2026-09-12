import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { getCustomerProfile, updateCustomer } from "@/services/customers";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 11: Individual Customer Profile & Updates API Route (Task 11.2)
// ═══════════════════════════════════════════════════════════════════════════
// Invariant (FR-CUST-04, FR-CUST-08): Profile retrieval & notes update
// Invariant: Customer deletion is strictly prohibited (405 on DELETE)
// ═══════════════════════════════════════════════════════════════════════════

export const updateCustomerBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  address: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const customer = await getCustomerProfile(id);
    if (!customer) {
      return apiError("NOT_FOUND", "Customer not found", 404);
    }

    return NextResponse.json(customer);
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const body = updateCustomerBodySchema.parse(await request.json());

    const updatedCustomer = await updateCustomer(id, body, user.id);
    return NextResponse.json({ customer: updatedCustomer });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Immutability Enforcement: Reject Customer Deletion (405)
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE() {
  return NextResponse.json(
    {
      code: "METHOD_NOT_ALLOWED",
      message:
        "Customer deletion is strictly prohibited (immutability of customer records).",
    },
    { status: 405 }
  );
}
