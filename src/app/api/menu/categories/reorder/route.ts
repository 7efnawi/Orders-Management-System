import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { reorderCategories } from "@/services/menu";

const reorderSchema = z.object({
  brandId: z.string().uuid(),
  orderedIds: z.array(z.string().uuid()).min(1),
});

export async function POST(request: Request) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const body = reorderSchema.parse(await request.json());
    await reorderCategories(user.id, body.brandId, body.orderedIds);
    return NextResponse.json({ ok: true });
  });
}
