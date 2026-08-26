import { NextResponse, type NextRequest } from "next/server";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { listDailyClosings } from "@/services/closing";

export async function GET(request: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const date = searchParams.get("date") || undefined;
    const cashierId = searchParams.get("cashierId") || undefined;
    const limitStr = searchParams.get("limit");
    const offsetStr = searchParams.get("offset");

    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    const offset = offsetStr ? parseInt(offsetStr, 10) : undefined;

    const result = await listDailyClosings({
      startDate,
      endDate,
      date,
      cashierId,
      limit: Number.isFinite(limit) ? limit : undefined,
      offset: Number.isFinite(offset) ? offset : undefined,
    });

    return NextResponse.json(result);
  });
}
