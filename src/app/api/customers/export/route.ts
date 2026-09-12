import { NextResponse, type NextRequest } from "next/server";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { listCustomers } from "@/services/customers";
import { generateCustomersCsv, type CustomerSegment } from "@/lib/customers";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 11 / CRM 2.0: Customer Export API Route (Task 2)
// Exports customer directory as UTF-8 BOM CSV with Arabic headers
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || undefined;
    const rawSegment = searchParams.get("segment")?.trim().toUpperCase();
    const segment = (
      ["VIP", "REGULAR", "NEW", "AT_RISK", "INACTIVE"].includes(rawSegment || "")
        ? rawSegment
        : undefined
    ) as CustomerSegment | undefined;

    const hasProblemsParam = searchParams.get("hasProblems")?.trim().toLowerCase();
    const hasProblems =
      hasProblemsParam === "true" || hasProblemsParam === "1" ? true : undefined;

    const result = await listCustomers({
      page: 1,
      limit: 5000,
      search,
      segment,
      hasProblems,
    });

    const csv = generateCustomersCsv(result.customers);
    const today = new Date().toISOString().split("T")[0];
    const filename = `customers-${today}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Immutability Enforcement: Reject mutations on the export endpoint
// ─────────────────────────────────────────────────────────────────────────────

const METHOD_NOT_ALLOWED = () =>
  NextResponse.json(
    {
      code: "METHOD_NOT_ALLOWED",
      message: "Customer export endpoint only supports GET requests.",
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
