import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiRole, isResponse, wrapApi } from "@/lib/api";
import { requestDiscount } from "@/services/orders";

export const discountSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(1),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const body = await req.json();
    const { amount, reason } = discountSchema.parse(body);

    const updated = await requestDiscount(
      { id: user.id, role: user.role },
      id,
      amount,
      reason
    );
    return NextResponse.json(updated);
  });
}
