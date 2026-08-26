import { NextResponse, type NextRequest } from "next/server";
import { requireApiRole, isResponse, wrapApi } from "@/lib/api";
import { searchCustomersByPhone } from "@/services/customers";

export async function GET(req: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const results = await searchCustomersByPhone(q);
    return NextResponse.json(results);
  });
}
