import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { listBrands } from "@/services/menu";

export async function GET() {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;
    return NextResponse.json({ brands: await listBrands() });
  });
}

const createBrandSchema = z.object({ name: z.string().min(1).max(100) });

export async function POST(request: Request) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const body = createBrandSchema.parse(await request.json());
    const { prisma } = await import("@/lib/prisma");
    const { audit } = await import("@/lib/audit");

    const brand = await prisma.$transaction(async (tx) => {
      const created = await tx.brand.create({ data: { name: body.name.trim() } });
      await audit(tx, {
        userId: user.id,
        action: "CREATE",
        entityType: "Brand",
        entityId: created.id,
        newValue: { name: created.name },
      });
      return created;
    });

    return NextResponse.json({ id: brand.id, name: brand.name }, { status: 201 });
  });
}
