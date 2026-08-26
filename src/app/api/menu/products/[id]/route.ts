import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { updateProduct } from "@/services/menu";

const patchSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  price: z.number().positive().optional(),
  description: z.string().max(500).nullable().optional(),
  categoryId: z.string().uuid().optional(),
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
    const product = await updateProduct(user.id, id, body);
    return NextResponse.json(product);
  });
}
