import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { updateDeliveryZone } from "@/services/delivery";

export const updateZoneSchema = z.object({
  name: z.string().min(1).optional(),
  fee: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const body = updateZoneSchema.parse(await request.json());
    const updated = await updateDeliveryZone(user.id, id, body);
    return NextResponse.json(updated);
  });
}
