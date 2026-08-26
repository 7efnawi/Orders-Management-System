import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DriverType } from "@prisma/client";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { updateDeliveryDriver } from "@/services/delivery";

export const updateDriverSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.nativeEnum(DriverType).optional(),
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
    const body = updateDriverSchema.parse(await request.json());
    const updated = await updateDeliveryDriver(user.id, id, body);
    return NextResponse.json(updated);
  });
}
