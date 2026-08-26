import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { createCategory, getMenuTree } from "@/services/menu";

const querySchema = z.object({ brandId: z.string().uuid() });

export async function GET(request: Request) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { brandId } = querySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    return NextResponse.json({ categories: await getMenuTree(brandId) });
  });
}

const createSchema = z.object({
  brandId: z.string().uuid(),
  name: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const body = createSchema.parse(await request.json());
    const category = await createCategory(user.id, body);
    return NextResponse.json(category, { status: 201 });
  });
}
