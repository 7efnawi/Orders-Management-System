import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { createExpense, listExpenses } from "@/services/expenses";

export const createExpenseSchema = z.object({
  expenseTypeId: z.string().uuid("Invalid expense type ID"),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer").optional(),
  value: z.number().positive("Value must be greater than zero"),
  date: z.string().optional(),
});

export async function GET(request: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const date = searchParams.get("date") || undefined;
    const expenseTypeId = searchParams.get("expenseTypeId") || undefined;
    const createdBy = searchParams.get("createdBy") || undefined;
    const search = searchParams.get("search") || undefined;
    const limitStr = searchParams.get("limit");
    const offsetStr = searchParams.get("offset");

    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    const offset = offsetStr ? parseInt(offsetStr, 10) : undefined;

    const result = await listExpenses({
      startDate,
      endDate,
      date,
      expenseTypeId,
      createdBy,
      search,
      limit: Number.isFinite(limit) ? limit : undefined,
      offset: Number.isFinite(offset) ? offset : undefined,
    });

    return NextResponse.json(result);
  });
}

export async function POST(request: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const body = createExpenseSchema.parse(await request.json());
    const expense = await createExpense(user.id, body);
    return NextResponse.json(expense, { status: 201 });
  });
}
