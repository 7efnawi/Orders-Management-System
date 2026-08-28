import { NextResponse, type NextRequest } from "next/server";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { getReportsData } from "@/services/reports";

export async function GET(request: NextRequest) {
  return wrapApi(async () => {
    // Only OWNER and MANAGER are authorized to access reports
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const brandId = searchParams.get("brandId") || undefined;
    const platformId = searchParams.get("platformId") || undefined;

    const report = await getReportsData({
      startDate,
      endDate,
      brandId,
      platformId,
    });

    return NextResponse.json(report);
  });
}
