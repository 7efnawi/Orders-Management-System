import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DriverType } from "@prisma/client";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { listDeliveryDrivers, createDeliveryDriver } from "@/services/delivery";

export const createDriverSchema = z.object({
  name: z.string().trim().optional(),
  type: z.nativeEnum(DriverType),
});

export async function GET(request: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const rawType = searchParams.get("type");
    const type = rawType && Object.values(DriverType).includes(rawType as DriverType)
      ? (rawType as DriverType)
      : undefined;

    const drivers = await listDeliveryDrivers(includeInactive, type);
    return NextResponse.json({ drivers });
  });
}

export async function POST(request: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const body = createDriverSchema.parse(await request.json());
    const driver = await createDeliveryDriver(user.id, body);
    return NextResponse.json(driver, { status: 201 });
  });
}
