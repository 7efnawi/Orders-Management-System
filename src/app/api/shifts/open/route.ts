import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { openShift } from "@/services/closing";

export const openShiftSchema = z
  .object({
    cashierId: z.string().uuid("Invalid cashier ID").optional(),
  })
  .optional();

export async function POST(request: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    let targetCashierId = user.id;
    const text = await request.text();
    if (text && text.trim().length > 0) {
      const parsed = openShiftSchema.parse(JSON.parse(text));
      if (parsed?.cashierId) {
        targetCashierId = parsed.cashierId;
      }
    }

    const shift = await openShift(targetCashierId);
    return NextResponse.json({ shift }, { status: 201 });
  });
}
