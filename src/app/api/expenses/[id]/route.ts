import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { deleteExpense, getExpenseById, updateExpense } from "@/services/expenses";

export const updateExpenseSchema = z.object({
  expenseTypeId: z.string().uuid("Invalid expense type ID").optional(),
  description: z.string().min(1, "Description cannot be empty").optional(),
  quantity: z.number().int().positive("Quantity must be a positive integer").optional(),
  value: z.number().positive("Value must be greater than zero").optional(),
  date: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const expense = await getExpenseById(id);
    if (!expense) {
      return apiError("NOT_FOUND", "Expense not found", 404);
    }

    return NextResponse.json(expense);
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const body = updateExpenseSchema.parse(await request.json());
    const updated = await updateExpense(user.id, id, body);
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const result = await deleteExpense(user.id, id);
    return NextResponse.json(result);
  });
}
