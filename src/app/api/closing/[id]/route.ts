import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { getDailyClosingById, updateDailyClosing } from "@/services/closing";

const updateClosingSchema = z.object({
  notes: z.string().nullable().optional(),
});

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateClosingSchema.parse(body);

    const updated = await updateDailyClosing(user.id, id, { notes: parsed.notes });
    return NextResponse.json({ closing: updated });
  });
}
