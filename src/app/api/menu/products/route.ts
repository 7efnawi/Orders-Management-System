import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { createProduct } from "@/services/menu";

const createSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(150),
  price: z.number().positive(),
  description: z.string().max(500).nullable().optional(),
});

export async function POST(request: Request) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const body = createSchema.parse(await request.json());
    const product = await createProduct(user.id, body);
    return NextResponse.json(product, { status: 201 });
  });
}
