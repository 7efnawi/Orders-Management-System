import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { reopenShift } from "@/services/closing";

const reopenShiftSchema = z.object({
  reason: z.string().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const { id } = await params;
    let reason: string | null | undefined;

    try {
      const body = await request.json();
      const parsed = reopenShiftSchema.parse(body);
      reason = parsed.reason;
    } catch {
      // Body is optional
    }

    const shift = await reopenShift(user.id, id, reason);
    return NextResponse.json({ shift });
  });
}
