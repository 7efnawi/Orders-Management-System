import { NextResponse, type NextRequest } from "next/server";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { getCurrentOpenShift } from "@/services/closing";

export async function GET(request: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { searchParams } = new URL(request.url);
    const cashierId = searchParams.get("cashierId") || user.id;

    const shift = await getCurrentOpenShift(cashierId);
    return NextResponse.json({ shift });
  });
}
