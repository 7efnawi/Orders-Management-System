import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { updateCategory } from "@/services/menu";

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const body = patchSchema.parse(await request.json());
    const category = await updateCategory(user.id, id, body);
    return NextResponse.json(category);
  });
}
