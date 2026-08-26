import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { listDeliveryZones, createDeliveryZone } from "@/services/delivery";

export const createZoneSchema = z.object({
  name: z.string().min(1),
  fee: z.number().nonnegative(),
});

export async function GET(request: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const zones = await listDeliveryZones(includeInactive);
    return NextResponse.json({ zones });
  });
}

export async function POST(request: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const body = createZoneSchema.parse(await request.json());
    const zone = await createDeliveryZone(user.id, body);
    return NextResponse.json(zone, { status: 201 });
  });
}
