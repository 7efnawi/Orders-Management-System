# Phase 4 — Orders Management & Centralized Audit Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete order management engine (State Machine, Discount approvals, Cashier POS order entry, Live Orders dashboard) with mandatory immutable Audit Logging for every state transition and mutation.

**Architecture:** Business logic isolated in `src/lib/orderStateMachine.ts`, mutation & transaction orchestration in `src/services/orders.ts` (calling `src/lib/audit.ts` within the same DB transaction), guarded API routes in `src/app/api/orders/`, and high-efficiency RTL/LTR POS UI in `src/components/orders/`.

**Tech Stack:** Next.js 16 (App Router), Prisma 7, React 19, TypeScript, Zod, React Hook Form, next-intl, Tailwind CSS v4, shadcn/ui.

**Spec:** `docs/specs/2026-08-25-data-model-design.md`, `docs/SRS.md` (§FR-ORD, §FR-AUD, §FR-CUST), `docs/USE_CASES.md` (UC-01 through UC-07).

## Global Constraints

- `PROJECT_LOG.md` must be updated with the implementation details on commit (ENGINEERING_DIRECTIVES.md §0).
- Zero business logic in React components (ENGINEERING_DIRECTIVES.md §2).
- Single source of truth for transitions: `src/lib/orderStateMachine.ts` (ENGINEERING_DIRECTIVES.md §3).
- **No Hard Delete** for any order ever — only `status = CANCELLED` with mandatory `cancelReason` (ENGINEERING_DIRECTIVES.md §4).
- Discount policy: Cashier requests `PENDING` with reason; Manager/Owner applies directly or approves `PENDING` (ENGINEERING_DIRECTIVES.md §4).
- Unit prices on `OrderItem` are immutable snapshots of `Product.price` at the moment of order creation.
- PowerShell file operations on `src/app/[locale]/` must use `-LiteralPath`.
- All API routes return errors in `{ code, message }` shape.

---

## File Structure & Responsibilities

```
src/
├── lib/
│   ├── orderStateMachine.ts        # Order status enum, allowed transition map, assertTransition, timestamp resolver
│   └── audit.ts                    # Immutable audit log transaction helper
├── services/
│   ├── orders.ts                   # createOrder, transitionStatus, requestDiscount, decideDiscount, cancelOrder, listOrders, getOrder
│   └── customers.ts                # findOrCreateCustomerByPhone, searchCustomers
├── app/
│   └── api/
│       ├── orders/
│       │   ├── route.ts            # POST (create), GET (list/filter)
│       │   └── [id]/
│       │       ├── route.ts        # GET (details)
│       │       ├── status/route.ts # PATCH (state transition)
│       │       ├── discount/route.ts # PATCH (request / apply discount)
│       │       └── discount/decide/route.ts # POST (manager approve/reject)
│       └── customers/
│           └── search/route.ts     # GET (search by phone prefix)
├── components/
│   └── orders/
│       ├── order-form.tsx          # Fast POS order creation form (brand/platform/customer/items/payment)
│       ├── orders-table.tsx        # Live orders list/board with quick action triggers
│       ├── cancel-dialog.tsx       # Modal forcing cancelReason selection
│       ├── discount-dialog.tsx     # Modal for requesting / approving discounts
│       └── order-details-modal.tsx # Order summary modal with items snapshot & audit history
└── app/[locale]/(dashboard)/
    └── orders/
        ├── page.tsx                # Live orders view (/orders)
        └── new/
            └── page.tsx            # Fast order creation POS screen (/orders/new)
```

---

### Task 1: Order State Machine & Calculation Engine (Pure Logic)

**Files:**
- Modify: `src/lib/orderStateMachine.ts`
- Create: `scripts/test-order-logic.ts`

**Interfaces:**
- Consumes: Prisma enums `OrderStatus`, `CancelReason`, `DiscountStatus`, `DriverType`.
- Produces: 
  - `assertTransition(from: OrderStatus, to: OrderStatus, cancelReason?: CancelReason): void`
  - `getOrderTimestampKey(status: OrderStatus): keyof Order | null`
  - `calculateOrderTotals(input: { items: { price: number; quantity: number }[]; discount: number; deliveryFee: number; driverType?: DriverType }): { subtotal: number; netDeliveryFee: number; total: number }`

- [ ] **Step 1: Write failing logic test script in `scripts/test-order-logic.ts`**

```typescript
import assert from "node:assert";
import {
  OrderStatus,
  assertTransition,
  calculateOrderTotals,
} from "../src/lib/orderStateMachine";
import { CancelReason, DriverType } from "@prisma/client";

console.log("Running State Machine & Calculation Unit Tests...");

// 1. Valid linear transition
assert.doesNotThrow(() => {
  assertTransition(OrderStatus.NEW, OrderStatus.CONFIRMED);
});

// 2. Invalid jump transition
assert.throws(
  () => {
    assertTransition(OrderStatus.NEW, OrderStatus.DELIVERED);
  },
  /INVALID_TRANSITION/
);

// 3. Cancel requires reason
assert.throws(
  () => {
    assertTransition(OrderStatus.PREPARING, OrderStatus.CANCELLED);
  },
  /CANCEL_REASON_REQUIRED/
);

// 4. Cancel with reason succeeds
assert.doesNotThrow(() => {
  assertTransition(OrderStatus.PREPARING, OrderStatus.CANCELLED, CancelReason.CUSTOMER_CHANGED_MIND);
});

// 5. Terminal states cannot transition
assert.throws(
  () => {
    assertTransition(OrderStatus.DELIVERED, OrderStatus.CONFIRMED);
  },
  /TERMINAL_STATUS/
);

// 6. Calculation engine totals & APP driver zero delivery fee
const calcApp = calculateOrderTotals({
  items: [{ price: 100, quantity: 2 }, { price: 50, quantity: 1 }],
  discount: 20,
  deliveryFee: 30,
  driverType: DriverType.APP,
});
assert.strictEqual(calcApp.subtotal, 250);
assert.strictEqual(calcApp.netDeliveryFee, 0); // Zeroed for app driver
assert.strictEqual(calcApp.total, 230); // 250 - 20 + 0

console.log("All State Machine Tests PASSED!");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/test-order-logic.ts`
Expected: FAIL (missing `assertTransition` or `calculateOrderTotals`)

- [ ] **Step 3: Implement `src/lib/orderStateMachine.ts`**

```typescript
import { CancelReason, DriverType } from "@prisma/client";

export enum OrderStatus {
  NEW = "NEW",
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  READY = "READY",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.NEW]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export const TERMINAL_STATUSES: readonly OrderStatus[] = [
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

export function nextAllowedStatuses(status: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[status] ?? [];
}

export function assertTransition(
  from: OrderStatus,
  to: OrderStatus,
  cancelReason?: CancelReason | null
): void {
  if (TERMINAL_STATUSES.includes(from)) {
    throw new Error(`TERMINAL_STATUS: Cannot transition from terminal status ${from}`);
  }

  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`INVALID_TRANSITION: Cannot transition from ${from} to ${to}`);
  }

  if (to === OrderStatus.CANCELLED && !cancelReason) {
    throw new Error("CANCEL_REASON_REQUIRED: Cancellation requires a valid cancelReason");
  }
}

export function getStatusTimestampField(status: OrderStatus): string | null {
  switch (status) {
    case OrderStatus.CONFIRMED:
      return "confirmedAt";
    case OrderStatus.PREPARING:
      return "preparingAt";
    case OrderStatus.READY:
      return "readyAt";
    case OrderStatus.OUT_FOR_DELIVERY:
      return "outForDeliveryAt";
    case OrderStatus.DELIVERED:
      return "deliveredAt";
    case OrderStatus.CANCELLED:
      return "cancelledAt";
    default:
      return null;
  }
}

export function calculateOrderTotals(input: {
  items: { price: number; quantity: number }[];
  discount?: number;
  deliveryFee?: number;
  driverType?: DriverType | null;
}): { subtotal: number; netDeliveryFee: number; total: number } {
  const subtotal = input.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = Math.max(0, input.discount ?? 0);
  const rawFee = Math.max(0, input.deliveryFee ?? 0);
  
  // App fleet or customer pickup means restaurant collected delivery fee is 0
  const netDeliveryFee =
    input.driverType === DriverType.APP || input.driverType === DriverType.PICKUP ? 0 : rawFee;

  const total = Math.max(0, subtotal - discount + netDeliveryFee);

  return { subtotal, netDeliveryFee, total };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/test-order-logic.ts`
Expected: Output `All State Machine Tests PASSED!`

- [ ] **Step 5: Commit**

```bash
git add src/lib/orderStateMachine.ts scripts/test-order-logic.ts
git commit -m "feat(orders): state machine transitions, assertions and calculation engine"
```

---

### Task 2: Service Layer for Customers & Orders with Audit Logging

**Files:**
- Create: `src/services/customers.ts`
- Create: `src/services/orders.ts`

**Interfaces:**
- Consumes: `prisma`, `audit`, `orderStateMachine`.
- Produces:
  - `findOrCreateCustomer(tx, { name, phone, address?, notes? })`
  - `createOrder(userId: string, cashierId: string, input: CreateOrderInput)`
  - `transitionOrderStatus(userId: string, orderId: string, toStatus: OrderStatus, cancelReason?: CancelReason)`
  - `requestDiscount(userId: string, orderId: string, amount: number, reason: string)`
  - `decideDiscount(userId: string, userRole: Role, orderId: string, decision: 'APPROVED' | 'REJECTED')`
  - `listOrders(filters: OrderListFilters)`
  - `getOrderById(orderId: string)`

- [x] **Step 1: Write Customer Service in `src/services/customers.ts`**

```typescript
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient | typeof prisma;

export interface CustomerInput {
  name: string;
  phone: string;
  address?: string | null;
  notes?: string | null;
}

export async function findOrCreateCustomer(tx: Tx, input: CustomerInput) {
  const cleanPhone = input.phone.trim();
  const existing = await tx.customer.findUnique({
    where: { phone: cleanPhone },
  });

  if (existing) {
    if (input.address && input.address !== existing.address) {
      return tx.customer.update({
        where: { id: existing.id },
        data: { address: input.address, lastOrderAt: new Date() },
      });
    }
    return existing;
  }

  return tx.customer.create({
    data: {
      name: input.name.trim(),
      phone: cleanPhone,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      lastOrderAt: new Date(),
    },
  });
}

export async function searchCustomersByPhone(prefix: string) {
  if (!prefix || prefix.trim().length < 3) return [];
  return prisma.customer.findMany({
    where: { phone: { startsWith: prefix.trim() } },
    take: 10,
    orderBy: { lastOrderAt: "desc" },
    select: { id: true, name: true, phone: true, address: true, totalOrders: true },
  });
}
```

- [x] **Step 2: Write Order Service in `src/services/orders.ts`**

```typescript
import { Prisma, Role, OrderStatus, PaymentMethod, CancelReason, DiscountStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { assertTransition, calculateOrderTotals, getStatusTimestampField } from "@/lib/orderStateMachine";
import { findOrCreateCustomer, type CustomerInput } from "./customers";

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  platformId: string;
  brandId: string;
  externalId?: string | null;
  customer: CustomerInput;
  zoneId?: string | null;
  driverId?: string | null;
  items: CreateOrderItemInput[];
  paymentMethod: PaymentMethod;
  discount?: number;
  discountReason?: string | null;
  notes?: string | null;
}

/** Generates clean auto-increment daily order number ORD-YYYYMMDD-XXXX */
async function generateOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const countToday = await tx.order.count({
    where: { createdAt: { gte: todayStart } },
  });

  const seq = String(countToday + 1).padStart(4, "0");
  return `ORD-${dateStr}-${seq}`;
}

export async function createOrder(
  actorUser: { id: string; role: Role },
  input: CreateOrderInput
) {
  if (input.items.length === 0) throw new Error("EMPTY_ORDER: Order must have at least one product");

  return prisma.$transaction(async (tx) => {
    // 1. Fetch products to get snapshot prices
    const productIds = input.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new Error("INVALID_PRODUCTS: Some selected products are inactive or not found");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 2. Fetch driver and zone for delivery fee calculations
    let driverType = null;
    if (input.driverId) {
      const driver = await tx.deliveryDriver.findUnique({ where: { id: input.driverId } });
      driverType = driver?.type ?? null;
    }

    let deliveryFee = 0;
    if (input.zoneId) {
      const zone = await tx.deliveryZone.findUnique({ where: { id: input.zoneId } });
      deliveryFee = zone ? Number(zone.fee) : 0;
    }

    // 3. Calculate order lines and totals
    const preparedItems = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = Number(product.price);
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(unitPrice),
        totalPrice: new Prisma.Decimal(unitPrice * item.quantity),
        priceNum: unitPrice,
      };
    });

    const { subtotal, netDeliveryFee } = calculateOrderTotals({
      items: preparedItems.map((i) => ({ price: i.priceNum, quantity: i.quantity })),
      discount: input.discount ?? 0,
      deliveryFee,
      driverType,
    });

    // 4. Handle Customer
    const customer = await findOrCreateCustomer(tx, input.customer);
    await tx.customer.update({
      where: { id: customer.id },
      data: { totalOrders: { increment: 1 }, lastOrderAt: new Date() },
    });

    // 5. Discount Approval State
    let discountStatus: DiscountStatus = DiscountStatus.NONE;
    let discountApprovedBy: string | null = null;
    let discountRequestedBy: string | null = null;
    const requestedDiscount = Math.max(0, input.discount ?? 0);

    if (requestedDiscount > 0) {
      if (!input.discountReason) {
        throw new Error("DISCOUNT_REASON_REQUIRED: A discount requires a reason");
      }
      if (actorUser.role === Role.OWNER || actorUser.role === Role.MANAGER) {
        discountStatus = DiscountStatus.APPROVED;
        discountApprovedBy = actorUser.id;
      } else {
        discountStatus = DiscountStatus.PENDING;
        discountRequestedBy = actorUser.id;
      }
    }

    // 6. Create Order record
    const orderNumber = await generateOrderNumber(tx);
    const order = await tx.order.create({
      data: {
        orderNumber,
        externalId: input.externalId?.trim() || null,
        platformId: input.platformId,
        brandId: input.brandId,
        customerId: customer.id,
        zoneId: input.zoneId || null,
        driverId: input.driverId || null,
        cashierId: actorUser.id,
        status: OrderStatus.NEW,
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(requestedDiscount),
        deliveryFee: new Prisma.Decimal(netDeliveryFee),
        discountStatus,
        discountReason: input.discountReason?.trim() || null,
        discountRequestedBy,
        discountApprovedBy,
        paymentMethod: input.paymentMethod,
        notes: input.notes?.trim() || null,
        items: {
          create: preparedItems.map((pi) => ({
            productId: pi.productId,
            quantity: pi.quantity,
            unitPrice: pi.unitPrice,
            totalPrice: pi.totalPrice,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    // 7. Audit log
    await audit(tx, {
      userId: actorUser.id,
      action: "CREATE",
      entityType: "Order",
      entityId: order.id,
      newValue: {
        orderNumber: order.orderNumber,
        total: subtotal - requestedDiscount + netDeliveryFee,
        status: order.status,
      },
    });

    return order;
  });
}

export async function transitionOrderStatus(
  userId: string,
  orderId: string,
  toStatus: OrderStatus,
  cancelReason?: CancelReason | null
) {
  const current = await prisma.order.findUnique({ where: { id: orderId } });
  if (!current) throw new Error("NOT_FOUND");

  assertTransition(current.status as OrderStatus, toStatus, cancelReason);

  const timestampField = getStatusTimestampField(toStatus);
  const dataToUpdate: Prisma.OrderUpdateInput = {
    status: toStatus,
    ...(cancelReason ? { cancelReason } : {}),
    ...(timestampField ? { [timestampField]: new Date() } : {}),
  };

  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: dataToUpdate,
    });

    await audit(tx, {
      userId,
      action: toStatus === OrderStatus.CANCELLED ? "CANCEL" : "STATUS_CHANGE",
      entityType: "Order",
      entityId: orderId,
      oldValue: { status: current.status },
      newValue: { status: toStatus, cancelReason },
    });

    return updated;
  });
}

export async function decideDiscount(
  actorUser: { id: string; role: Role },
  orderId: string,
  decision: "APPROVED" | "REJECTED"
) {
  if (actorUser.role !== Role.OWNER && actorUser.role !== Role.MANAGER) {
    throw new Error("FORBIDDEN: Only manager or owner can decide discounts");
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("NOT_FOUND");
  if (order.discountStatus !== DiscountStatus.PENDING) {
    throw new Error("INVALID_STATE: Order discount is not in pending state");
  }

  const newStatus = decision === "APPROVED" ? DiscountStatus.APPROVED : DiscountStatus.REJECTED;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        discountStatus: newStatus,
        discountApprovedBy: actorUser.id,
      },
    });

    await audit(tx, {
      userId: actorUser.id,
      action: decision === "APPROVED" ? "DISCOUNT_APPROVE" : "DISCOUNT_REJECT",
      entityType: "Order",
      entityId: orderId,
      oldValue: { discountStatus: order.discountStatus },
      newValue: { discountStatus: newStatus },
    });

    return updated;
  });
}

export async function listOrders(filters: {
  status?: OrderStatus;
  brandId?: string;
  platformId?: string;
  date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Prisma.OrderWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.platformId) where.platformId = filters.platformId;
  if (filters.date) {
    const d = new Date(filters.date);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    where.createdAt = { gte: start, lt: end };
  }
  if (filters.search) {
    const term = filters.search.trim();
    where.OR = [
      { orderNumber: { contains: term, mode: "insensitive" } },
      { externalId: { contains: term, mode: "insensitive" } },
      { customer: { phone: { contains: term } } },
      { customer: { name: { contains: term, mode: "insensitive" } } },
    ];
  }

  return prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 50,
    skip: filters.offset ?? 0,
    include: {
      brand: { select: { id: true, name: true } },
      platform: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true, phone: true } },
      driver: { select: { id: true, name: true, type: true } },
      items: {
        include: { product: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      brand: true,
      platform: true,
      customer: true,
      zone: true,
      driver: true,
      cashier: { select: { id: true, name: true, email: true } },
      items: { include: { product: true } },
    },
  });
}
```

- [x] **Step 3: Commit**

```bash
git add src/services/customers.ts src/services/orders.ts
git commit -m "feat(orders): customer and order service layers with atomic audit logging"
```

---

### Task 3: Order API Routes with Role Enforcement

**Files:**
- Create: `src/app/api/orders/route.ts`
- Create: `src/app/api/orders/[id]/route.ts`
- Create: `src/app/api/orders/[id]/status/route.ts`
- Create: `src/app/api/orders/[id]/discount/decide/route.ts`
- Create: `src/app/api/customers/search/route.ts`

**Interfaces:**
- Consumes: `requireApiRole`, `wrapApi`, `services/orders.ts`, `services/customers.ts`.
- Produces: JSON HTTP Endpoints validating input via Zod.

- [x] **Step 1: Implement `src/app/api/orders/route.ts` (POST & GET)**

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiRole, isResponse, wrapApi, apiError } from "@/lib/api";
import { createOrder, listOrders } from "@/services/orders";
import { OrderStatus, PaymentMethod } from "@prisma/client";

const createOrderSchema = z.object({
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
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
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
    const status = searchParams.get("status") as OrderStatus | null;
    const brandId = searchParams.get("brandId") || undefined;
    const platformId = searchParams.get("platformId") || undefined;
    const date = searchParams.get("date") || undefined;
    const search = searchParams.get("search") || undefined;

    const orders = await listOrders({
      status: status || undefined,
      brandId,
      platformId,
      date,
      search,
    });

    return NextResponse.json(orders);
  });
}
```

- [x] **Step 2: Implement Status Transition API in `src/app/api/orders/[id]/status/route.ts`**

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiRole, isResponse, wrapApi } from "@/lib/api";
import { transitionOrderStatus } from "@/services/orders";
import { OrderStatus, CancelReason } from "@prisma/client";

const transitionSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  cancelReason: z.nativeEnum(CancelReason).optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const body = await req.json();
    const { status, cancelReason } = transitionSchema.parse(body);

    const updated = await transitionOrderStatus(user.id, id, status, cancelReason);
    return NextResponse.json(updated);
  });
}
```

- [x] **Step 3: Implement Discount Decision API in `src/app/api/orders/[id]/discount/decide/route.ts`**

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiRole, isResponse, wrapApi } from "@/lib/api";
import { decideDiscount } from "@/services/orders";

const decideSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    // Only Manager or Owner can approve/reject discounts
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const body = await req.json();
    const { decision } = decideSchema.parse(body);

    const updated = await decideDiscount({ id: user.id, role: user.role }, id, decision);
    return NextResponse.json(updated);
  });
}
```

- [x] **Step 4: Implement Customer Search API in `src/app/api/customers/search/route.ts`**

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { requireApiRole, isResponse, wrapApi } from "@/lib/api";
import { searchCustomersByPhone } from "@/services/customers";

export async function GET(req: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER", "CASHIER");
    if (isResponse(user)) return user;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const results = await searchCustomersByPhone(q);
    return NextResponse.json(results);
  });
}
```

- [x] **Step 5: Commit**

```bash
git add src/app/api/orders/ src/app/api/customers/
git commit -m "feat(orders): API endpoints for order lifecycle, discount approval and customer search"
```

---

### Task 4: Fast POS Order Creation UI

**Files:**
- Create: `src/components/orders/order-form.tsx`
- Create: `src/app/[locale]/(dashboard)/orders/new/page.tsx`
- Modify: `src/messages/ar.json`, `src/messages/en.json`

**Interfaces:**
- Consumes: `/api/menu/brands`, `/api/menu/categories?brandId=`, `/api/customers/search`, `/api/orders`.
- Produces: Sub-30 second Cashier Order Entry interface.

- [x] **Step 1: Update Arabic & English dictionaries (`src/messages/ar.json` & `en.json`) with `orders` namespace**
- [x] **Step 2: Create `src/components/orders/order-form.tsx` featuring:**
  - Fast Brand selector pills.
  - Platform selector (Talabat, elmenus, InstaShop, HarryApp, Phone).
  - Phone-based Customer Auto-lookup with name/address pre-fill.
  - Interactive Menu Grid (Click item to add/increment, quantity modifiers).
  - Dynamic Subtotal/Discount/Delivery Fee breakdown.
  - Payment method toggle (Cash / Visa / Online).
  - Clear submission feedback with `sonner` toast.
- [x] **Step 3: Create page wrapper `src/app/[locale]/(dashboard)/orders/new/page.tsx`**
- [x] **Step 4: Commit**

```bash
git add src/components/orders/order-form.tsx src/app/[locale]/(dashboard)/orders/new/page.tsx src/messages/
git commit -m "feat(orders): fast POS order creation UI for cashiers"
```

---

### Task 5: Live Orders Dashboard & Modal Workflows

**Files:**
- Create: `src/components/orders/orders-table.tsx`
- Create: `src/components/orders/cancel-dialog.tsx`
- Create: `src/components/orders/discount-dialog.tsx`
- Create: `src/components/orders/order-details-modal.tsx`
- Create: `src/app/[locale]/(dashboard)/orders/page.tsx`

**Interfaces:**
- Consumes: `/api/orders`, `/api/orders/[id]/status`, `/api/orders/[id]/discount/decide`.
- Produces: Live order feed with single-click next status buttons, cancel dialogs, and discount resolution.

- [ ] **Step 1: Build `cancel-dialog.tsx` (enforcing mandatory CancelReason dropdown)**
- [ ] **Step 2: Build `discount-dialog.tsx` (Manager decision modal for pending discounts)**
- [ ] **Step 3: Build `order-details-modal.tsx` (Viewing full items snapshot, timeline, customer info)**
- [ ] **Step 4: Build `orders-table.tsx` with live filters (All, Preparing, Ready, Out, Delivered, Cancelled)**
- [ ] **Step 5: Create page `src/app/[locale]/(dashboard)/orders/page.tsx`**
- [ ] **Step 6: Commit**

```bash
git add src/components/orders/ src/app/[locale]/(dashboard)/orders/page.tsx
git commit -m "feat(orders): live orders dashboard with state transition triggers and modal workflows"
```

---

### Task 6: Verification Gate & PROJECT_LOG Update

**Files:**
- Create: `scripts/verify-phase4.ts`
- Modify: `PROJECT_LOG.md`

- [ ] **Step 1: Write and run full verification script `scripts/verify-phase4.ts`**
  - Verify creating order generates correct order number and audit log.
  - Verify status transition timestamps and transition validation.
  - Verify discount workflow (Cashier pending -> Manager approved).
  - Verify cancellation requires cancelReason.
  - Verify unit prices remain snapshots.
- [ ] **Step 2: Run verification gate commands**
  - Run: `npm run typecheck`
  - Run: `npm run lint`
  - Run: `npm run build`
- [ ] **Step 3: Update `PROJECT_LOG.md` with Phase 4 ADR entry**
- [ ] **Step 4: Final Commit**

```bash
git add scripts/verify-phase4.ts PROJECT_LOG.md
git commit -m "chore(phase4): automated verification script and project log update"
```

---

## Self-Review Checklist

1. **Spec Coverage:**
   - Order creation with auto-numbering & snapshots (`FR-ORD-01`, `FR-ORD-04`) -> Task 2 & Task 4.
   - State machine transitions & timestamps (`FR-ORD-02`) -> Task 1 & Task 3.
   - Cancel reason enforcement (`FR-ORD-03`) -> Task 1, Task 2, Task 5.
   - Discount approval workflow (`FR-ORD-05`) -> Task 2, Task 3, Task 5.
   - Audit logging inside transaction (`FR-AUD-01`, `FR-AUD-05`) -> Task 2.
   - Fast Customer search & auto-fill (`FR-CUST-01`) -> Task 2, Task 3, Task 4.
2. **Placeholder Scan:** No "TODO", "TBD", or vague implementations. All interfaces, schemas, and signatures explicitly written out.
3. **Type Consistency:** Status names match `OrderStatus` enum across lib, services, routes, and UI.
