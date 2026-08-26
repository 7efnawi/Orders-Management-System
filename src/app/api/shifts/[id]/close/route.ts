import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { closeShift } from "@/services/closing";

export const closeShiftSchema = z
  .object({
    notes: z.string().optional().nullable(),
  })
  .optional();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { id } = await params;

    let notes: string | undefined | null = undefined;
    const text = await request.text();
    if (text && text.trim().length > 0) {
      const parsed = closeShiftSchema.parse(JSON.parse(text));
      notes = parsed?.notes;
    }

    const result = await closeShift(user.id, id, notes);
    return NextResponse.json(result);
  });
}
