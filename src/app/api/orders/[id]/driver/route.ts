import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { assignDriverToOrder } from "@/services/delivery";

export const assignDriverSchema = z.object({
  driverId: z.string().uuid(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const body = assignDriverSchema.parse(await request.json());
    const updated = await assignDriverToOrder(user.id, id, body.driverId);
    return NextResponse.json(updated);
  });
}
