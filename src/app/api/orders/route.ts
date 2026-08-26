import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiRole, isResponse, wrapApi } from "@/lib/api";
import { createOrder, listOrders } from "@/services/orders";
import { OrderStatus, PaymentMethod } from "@prisma/client";

export const createOrderSchema = z.object({
  platformId: z.string().uuid(),
  brandId: z.string().uuid(),
  externalId: z.string().optional().nullable(),
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().min(5),
    address: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
  zoneId: z.string().uuid().optional().nullable(),
  driverId: z.string().uuid().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  paymentMethod: z.nativeEnum(PaymentMethod),
  discount: z.number().nonnegative().optional(),
  discountReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const body = await req.json();
    const parsed = createOrderSchema.parse(body);

    const order = await createOrder({ id: user.id, role: user.role }, parsed);
    return NextResponse.json(order, { status: 201 });
  });
}

export async function GET(req: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get("status");
    const status =
      rawStatus && Object.values(OrderStatus).includes(rawStatus as OrderStatus)
        ? (rawStatus as OrderStatus)
        : undefined;

    const brandId = searchParams.get("brandId") || undefined;
    const platformId = searchParams.get("platformId") || undefined;
    const date = searchParams.get("date") || undefined;
    const search = searchParams.get("search") || undefined;
    const limitStr = searchParams.get("limit");
    const offsetStr = searchParams.get("offset");

    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    const offset = offsetStr ? parseInt(offsetStr, 10) : undefined;

    const orders = await listOrders({
      status,
      brandId,
      platformId,
      date,
      search,
      limit: Number.isFinite(limit) ? limit : undefined,
      offset: Number.isFinite(offset) ? offset : undefined,
    });

    return NextResponse.json(orders);
  });
}
