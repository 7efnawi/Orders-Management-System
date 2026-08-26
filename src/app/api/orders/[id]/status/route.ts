import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiRole, isResponse, wrapApi } from "@/lib/api";
import { transitionOrderStatus } from "@/services/orders";
import { OrderStatus, CancelReason } from "@prisma/client";

export const transitionSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  cancelReason: z.nativeEnum(CancelReason).optional().nullable(),
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
    const { status, cancelReason } = transitionSchema.parse(body);

    const updated = await transitionOrderStatus(user.id, id, status, cancelReason);
    return NextResponse.json(updated);
  });
}
