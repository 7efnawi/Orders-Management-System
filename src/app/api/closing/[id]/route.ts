import { NextResponse, type NextRequest } from "next/server";
import { apiError, isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { getDailyClosingById } from "@/services/closing";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const closing = await getDailyClosingById(id);
    if (!closing) {
      return apiError("NOT_FOUND", "Daily closing not found", 404);
    }

    return NextResponse.json({ closing });
  });
}
