import { NextResponse, type NextRequest } from "next/server";
import { requireApiRole, isResponse, wrapApi, apiError } from "@/lib/api";
import { getOrderById } from "@/services/orders";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return apiError("NOT_FOUND", "Order not found", 404);
    }

    return NextResponse.json(order);
  });
}
