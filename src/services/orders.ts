import {
  Prisma,
  Role,
  OrderStatus,
  PaymentMethod,
  CancelReason,
  DiscountStatus,
  DriverType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import {
  assertTransition,
  calculateOrderTotals,
  getStatusTimestampField,
} from "@/lib/orderStateMachine";
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

export interface OrderListFilters {
  status?: OrderStatus;
  brandId?: string;
  platformId?: string;
  date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/** Generates clean auto-increment daily order number ORD-YYYYMMDD-XXXX */
async function generateOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;
  const todayStart = new Date(year, now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const countToday = await tx.order.count({
    where: { createdAt: { gte: todayStart } },
  });

  const seq = String(countToday + 1).padStart(4, "0");
  return `ORD-${dateStr}-${seq}`;
}

/**
 * Creates an order atomically within a single transaction, taking snapshot prices,
 * calculating financial totals, updating customer stats, handling discount rules,
 * and creating an audit log.
 */
export async function createOrder(
  actorUser: { id: string; role: Role },
  input: CreateOrderInput
) {
  if (!input.items || input.items.length === 0) {
    throw new Error("EMPTY_ORDER: Order must have at least one product");
  }

  for (const item of input.items) {
    if (!item.quantity || item.quantity <= 0) {
      throw new Error("INVALID_QUANTITY: Item quantity must be greater than zero");
    }
  }

  return prisma.$transaction(async (tx) => {
    // 1. Fetch products to get snapshot prices
    const productIds = input.items.map((i) => i.productId);
    const uniqueProductIds = Array.from(new Set(productIds));
    const products = await tx.product.findMany({
      where: { id: { in: uniqueProductIds }, isActive: true },
    });

    if (products.length !== uniqueProductIds.length) {
      throw new Error("INVALID_PRODUCTS: Some selected products are inactive or not found");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 2. Fetch driver and zone for delivery fee calculations
    let driverType: DriverType | null = null;
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

    const { subtotal, netDeliveryFee, total } = calculateOrderTotals({
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
      if (!input.discountReason || !input.discountReason.trim()) {
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
        discountReason: requestedDiscount > 0 ? input.discountReason?.trim() || null : null,
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
      include: {
        items: { include: { product: true } },
        customer: true,
        brand: true,
        platform: true,
        zone: true,
        driver: true,
      },
    });

    // 7. Atomic Audit Log
    await audit(tx, {
      userId: actorUser.id,
      action: "CREATE",
      entityType: "Order",
      entityId: order.id,
      newValue: {
        orderNumber: order.orderNumber,
        total,
        status: order.status,
        discountStatus,
      },
    });

    return order;
  });
}

/**
 * Transitions an order status according to the State Machine, updating timestamp
 * and cancel reason if applicable, accompanied by an atomic audit log entry.
 */
export async function transitionOrderStatus(
  userId: string,
  orderId: string,
  toStatus: OrderStatus,
  cancelReason?: CancelReason | null
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { id: orderId } });
    if (!current) throw new Error("NOT_FOUND: Order not found");

    assertTransition(current.status as OrderStatus, toStatus, cancelReason);

    const timestampField = getStatusTimestampField(toStatus);
    const dataToUpdate: Prisma.OrderUpdateInput = {
      status: toStatus,
      ...(cancelReason ? { cancelReason } : {}),
      ...(timestampField ? { [timestampField]: new Date() } : {}),
    };

    const updated = await tx.order.update({
      where: { id: orderId },
      data: dataToUpdate,
      include: {
        items: { include: { product: true } },
        customer: true,
        brand: true,
        platform: true,
      },
    });

    await audit(tx, {
      userId,
      action: toStatus === OrderStatus.CANCELLED ? "CANCEL" : "STATUS_CHANGE",
      entityType: "Order",
      entityId: orderId,
      oldValue: { status: current.status },
      newValue: { status: toStatus, ...(cancelReason ? { cancelReason } : {}) },
    });

    return updated;
  });
}

/**
 * Decides on a pending discount request (APPROVED or REJECTED) by OWNER or MANAGER.
 */
export async function decideDiscount(
  actorUser: { id: string; role: Role },
  orderId: string,
  decision: "APPROVED" | "REJECTED"
) {
  if (actorUser.role !== Role.OWNER && actorUser.role !== Role.MANAGER) {
    throw new Error("FORBIDDEN: Only manager or owner can decide discounts");
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("NOT_FOUND: Order not found");
    if (order.discountStatus !== DiscountStatus.PENDING) {
      throw new Error("INVALID_STATE: Order discount is not in pending state");
    }

    const newStatus = decision === "APPROVED" ? DiscountStatus.APPROVED : DiscountStatus.REJECTED;

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        discountStatus: newStatus,
        discountApprovedBy: actorUser.id,
      },
      include: {
        customer: true,
        brand: true,
        platform: true,
        items: true,
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

/**
 * Requests or directly applies a discount on an active order.
 */
export async function requestDiscount(
  actorUser: { id: string; role: Role },
  orderId: string,
  amount: number,
  reason: string
) {
  if (!reason || !reason.trim()) {
    throw new Error("DISCOUNT_REASON_REQUIRED: A discount requires a reason");
  }
  if (amount <= 0) {
    throw new Error("INVALID_DISCOUNT: Discount amount must be greater than 0");
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("NOT_FOUND: Order not found");
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
      throw new Error("TERMINAL_STATUS: Cannot request discount on completed or cancelled order");
    }

    const isDirectApproval = actorUser.role === Role.OWNER || actorUser.role === Role.MANAGER;
    const discountStatus = isDirectApproval ? DiscountStatus.APPROVED : DiscountStatus.PENDING;
    const discountApprovedBy = isDirectApproval ? actorUser.id : null;
    const discountRequestedBy = isDirectApproval ? null : actorUser.id;

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        discount: new Prisma.Decimal(amount),
        discountReason: reason.trim(),
        discountStatus,
        discountRequestedBy,
        discountApprovedBy,
      },
      include: {
        customer: true,
        brand: true,
        platform: true,
        items: true,
      },
    });

    await audit(tx, {
      userId: actorUser.id,
      action: isDirectApproval ? "DISCOUNT_APPROVE" : "DISCOUNT_REQUEST",
      entityType: "Order",
      entityId: orderId,
      oldValue: { discount: Number(order.discount), discountStatus: order.discountStatus },
      newValue: { discount: amount, discountStatus, discountReason: reason.trim() },
    });

    return updated;
  });
}

/**
 * Lists orders with flexible filtering and pagination.
 */
export async function listOrders(filters: OrderListFilters = {}) {
  const where: Prisma.OrderWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.platformId) where.platformId = filters.platformId;
  
  if (filters.date) {
    const parts = filters.date.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const [year, month, day] = parts;
      const start = new Date(year, month - 1, day, 0, 0, 0, 0);
      const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
      where.createdAt = { gte: start, lt: end };
    } else {
      const d = new Date(filters.date);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
      where.createdAt = { gte: start, lt: end };
    }
  }

  if (filters.search) {
    const term = filters.search.trim();
    if (term.length > 0) {
      where.OR = [
        { orderNumber: { contains: term, mode: "insensitive" } },
        { externalId: { contains: term, mode: "insensitive" } },
        { customer: { phone: { contains: term } } },
        { customer: { name: { contains: term, mode: "insensitive" } } },
      ];
    }
  }

  return prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 50,
    skip: filters.offset ?? 0,
    include: {
      brand: { select: { id: true, name: true } },
      platform: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true, phone: true, address: true } },
      driver: { select: { id: true, name: true, type: true } },
      zone: { select: { id: true, name: true, fee: true } },
      items: {
        include: { product: { select: { id: true, name: true } } },
      },
    },
  });
}

/**
 * Fetches complete order details including all relational metadata.
 */
export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      brand: true,
      platform: true,
      customer: true,
      zone: true,
      driver: true,
      cashier: { select: { id: true, name: true, email: true, role: true } },
      requester: { select: { id: true, name: true, email: true } },
      approver: { select: { id: true, name: true, email: true } },
      items: { include: { product: true } },
    },
  });
}
