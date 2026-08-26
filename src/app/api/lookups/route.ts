import { NextResponse } from "next/server";
import { requireApiRole, isResponse, wrapApi } from "@/lib/api";
import { listPlatforms, listDeliveryZones, listDeliveryDrivers } from "@/services/lookups";
import { listBrands } from "@/services/menu";

export async function GET() {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const [platforms, zones, drivers, brands] = await Promise.all([
      listPlatforms(),
      listDeliveryZones(),
      listDeliveryDrivers(),
      listBrands(),
    ]);

    return NextResponse.json({
      platforms,
      zones,
      drivers,
      brands,
    });
  });
}
