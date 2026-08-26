import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { createExpenseType, listExpenseTypes } from "@/services/expenses";

export const createExpenseTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export async function GET() {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const types = await listExpenseTypes();
    return NextResponse.json({ types });
  });
}

export async function POST(request: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const body = createExpenseTypeSchema.parse(await request.json());
    const type = await createExpenseType(user.id, body.name);
    return NextResponse.json(type, { status: 201 });
  });
}
