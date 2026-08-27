import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { updateExpenseType, deleteExpenseType } from "@/services/expenses";

export const updateExpenseTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const body = updateExpenseTypeSchema.parse(await request.json());
    const updated = await updateExpenseType(user.id, id, body.name);

    return NextResponse.json({ type: updated });
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
    try {
      const result = await deleteExpenseType(user.id, id);
      return NextResponse.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("CANNOT_DELETE_EXPENSE_TYPE_IN_USE")) {
        return NextResponse.json(
          {
            code: "EXPENSE_TYPE_IN_USE",
            message: "لا يمكن حذف هذا النوع لوجود مصروفات مسجلة به بالفعل.",
          },
          { status: 400 }
        );
      }
      throw err;
    }
  });
}
