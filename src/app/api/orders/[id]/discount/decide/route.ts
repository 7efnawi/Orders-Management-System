import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiRole, isResponse, wrapApi } from "@/lib/api";
import { decideDiscount } from "@/services/orders";

export const decideSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    // Only Manager or Owner can approve/reject discounts
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const body = await req.json();
    const { decision } = decideSchema.parse(body);

    const updated = await decideDiscount({ id: user.id, role: user.role }, id, decision);
    return NextResponse.json(updated);
  });
}
