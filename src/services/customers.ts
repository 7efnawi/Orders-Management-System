import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import {
  determineLoyaltyTier,
  calculateCustomerStats,
  identifyProblemOrders,
  determineCustomerSegment,
  calculateCustomerFavorites,
  determinePreferredPlatform,
  determineUsualDeliveryZone,
  type CustomerLoyaltyTier,
  type LoyaltyTierInfo,
  type CustomerMetrics,
  type ProblemOrderSummary,
  type CustomerSegment,
  type CustomerSegmentInfo,
} from "@/lib/customers";

type Tx = Prisma.TransactionClient | typeof prisma;

export interface CustomerInput {
  name: string;
  phone: string;
  address?: string | null;
  notes?: string | null;
}

export interface ListCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
  segment?: CustomerSegment;
  hasProblems?: boolean;
}

export interface CustomerListStats {
  totalCustomers: number;
  newThisMonth: number;
  vipCount: number;
  atRiskCount: number;
  avgSpent: number;
}

export interface CustomerListItem {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  totalOrders: number;
  lastOrderAt: Date | null;
  createdAt: Date;
  isActive: boolean;
  tier: CustomerLoyaltyTier;
  tierInfo: LoyaltyTierInfo;
  totalSpent: number;
  spent: number;
  segment: CustomerSegment;
  segmentInfo: CustomerSegmentInfo;
  problemCount: number;
}

export interface CustomerListResult {
  customers: CustomerListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: CustomerListStats;
}

export interface CustomerProfileResult {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  totalOrders: number;
  lastOrderAt: Date | null;
  createdAt: Date;
  isActive: boolean;
  orders: any[];
  metrics: CustomerMetrics;
  problemSummary: ProblemOrderSummary;
  loyaltyTier: LoyaltyTierInfo;
  segment: CustomerSegment;
  segmentInfo: CustomerSegmentInfo;
  favoriteProducts: { productId: string; productName: string; quantity: number; price: number }[];
  preferredPlatform: string;
  usualDeliveryZone: string | null;
}

/**
 * Finds existing customer by unique phone or creates a new one.
 * If customer exists and new address/name/notes are supplied, updates them.
 */
export async function findOrCreateCustomer(tx: Tx, input: CustomerInput) {
  const cleanPhone = input.phone.trim();
  const cleanName = input.name.trim();

  const existing = await tx.customer.findUnique({
    where: { phone: cleanPhone },
  });

  if (existing) {
    const shouldUpdateAddress =
      input.address !== undefined &&
      input.address !== null &&
      input.address.trim() !== (existing.address ?? "");
    const shouldUpdateNotes =
      input.notes !== undefined &&
      input.notes !== null &&
      input.notes.trim() !== (existing.notes ?? "");
    const shouldUpdateName =
      cleanName.length > 0 && cleanName !== existing.name;

    if (shouldUpdateAddress || shouldUpdateNotes || shouldUpdateName) {
      return tx.customer.update({
        where: { id: existing.id },
        data: {
          ...(shouldUpdateName ? { name: cleanName } : {}),
          ...(shouldUpdateAddress ? { address: input.address?.trim() || null } : {}),
          ...(shouldUpdateNotes ? { notes: input.notes?.trim() || null } : {}),
          lastOrderAt: new Date(),
        },
      });
    }
    return existing;
  }

  return tx.customer.create({
    data: {
      name: cleanName,
      phone: cleanPhone,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      lastOrderAt: new Date(),
    },
  });
}

/**
 * Searches customers by phone prefix (returns up to 10 recent matching records)
 * enriched with POS CRM customer insights (segment, favorite products, lifetime spent).
 */
export async function searchCustomersByPhone(prefix: string) {
  if (!prefix || prefix.trim().length < 3) return [];
  const customers = await prisma.customer.findMany({
    where: { phone: { startsWith: prefix.trim() } },
    take: 10,
    orderBy: { lastOrderAt: "desc" },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, price: true } },
            },
          },
        },
      },
    },
  });

  return customers.map((cust) => {
    let customerSpent = 0;
    for (const ord of cust.orders || []) {
      if (ord.status !== "CANCELLED") {
        const subtotal = Number(ord.subtotal ?? 0);
        const discount = Number(ord.discount ?? 0);
        const fee = Number(ord.deliveryFee ?? 0);
        customerSpent += Math.max(0, subtotal - discount + fee);
      }
    }
    const roundedSpent = Math.round(customerSpent * 100) / 100;
    const segmentInfo = determineCustomerSegment(
      cust.totalOrders,
      roundedSpent,
      cust.lastOrderAt
    );
    const favoriteProducts = calculateCustomerFavorites(cust.orders || []);

    return {
      id: cust.id,
      name: cust.name,
      phone: cust.phone,
      address: cust.address,
      notes: cust.notes,
      segment: segmentInfo.segment,
      segmentInfo,
      favoriteProducts,
      totalOrders: cust.totalOrders,
      lifetimeSpent: roundedSpent,
    };
  });
}

/**
 * Queries customers with filters and pagination, calculates stats/tiers/segments,
 * and returns customer directory list with executive KPIs.
 */
export async function listCustomers(
  params: ListCustomersParams = {}
): Promise<CustomerListResult> {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(10000, Math.max(1, Number(params.limit) || 25));
  const skip = (page - 1) * limit;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const where: Prisma.CustomerWhereInput = {
    isActive: true,
  };

  if (params.search && params.search.trim()) {
    const term = params.search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { phone: { contains: term } },
    ];
  }

  if (params.tier) {
    const upperTier = params.tier.toUpperCase();
    if (upperTier === "BRONZE") {
      where.totalOrders = { lte: 4 };
    } else if (upperTier === "SILVER") {
      where.totalOrders = { gte: 5, lte: 14 };
    } else if (upperTier === "GOLD") {
      where.totalOrders = { gte: 15, lte: 29 };
    } else if (upperTier === "PLATINUM") {
      where.totalOrders = { gte: 30 };
    } else if (upperTier === "NEW" || upperTier === "FIRST_TIME") {
      where.totalOrders = { lte: 1 };
    } else if (upperTier === "RETURNING") {
      where.totalOrders = { gt: 1 };
    }
  }

  if (params.segment) {
    const seg = params.segment.toUpperCase();
    if (seg === "VIP") {
      where.totalOrders = { gte: 15 };
    } else if (seg === "REGULAR") {
      where.totalOrders = { gte: 3, lt: 15 };
      where.lastOrderAt = { gte: thirtyDaysAgo };
    } else if (seg === "NEW") {
      where.totalOrders = { lte: 2 };
      where.lastOrderAt = { gte: thirtyDaysAgo };
    } else if (seg === "AT_RISK") {
      where.totalOrders = { gte: 3, lt: 15 };
      where.lastOrderAt = { gte: sixtyDaysAgo, lt: thirtyDaysAgo };
    } else if (seg === "INACTIVE") {
      where.OR = [
        { totalOrders: 0 },
        { lastOrderAt: null },
        { lastOrderAt: { lt: sixtyDaysAgo } },
        { totalOrders: { lte: 2 }, lastOrderAt: { lt: thirtyDaysAgo } },
      ];
    }
  }

  if (params.hasProblems) {
    where.orders = {
      some: {
        OR: [{ status: "CANCELLED" }, { cancelReason: { not: null } }],
      },
    };
  }

  const [
    customers,
    total,
    totalCustomers,
    newThisMonth,
    vipCount,
    atRiskCount,
    orderAggregates,
  ] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { lastOrderAt: "desc" },
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            cancelReason: true,
            subtotal: true,
            discount: true,
            deliveryFee: true,
          },
        },
      },
    }),
    prisma.customer.count({ where }),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.customer.count({
      where: { isActive: true, createdAt: { gte: startOfMonth } },
    }),
    prisma.customer.count({
      where: { isActive: true, totalOrders: { gte: 5 } },
    }),
    prisma.customer.count({
      where: {
        isActive: true,
        totalOrders: { gte: 3, lt: 15 },
        lastOrderAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    }),
    prisma.order.aggregate({
      _sum: {
        subtotal: true,
        discount: true,
        deliveryFee: true,
      },
      where: {
        status: { not: "CANCELLED" },
      },
    }),
  ]);

  const grossSales = Number(orderAggregates._sum.subtotal ?? 0);
  const totalDiscounts = Number(orderAggregates._sum.discount ?? 0);
  const totalDeliveryFees = Number(orderAggregates._sum.deliveryFee ?? 0);
  const totalNetSales = Math.max(0, grossSales - totalDiscounts + totalDeliveryFees);
  const avgSpent =
    totalCustomers > 0
      ? Math.round((totalNetSales / totalCustomers) * 100) / 100
      : 0;

  const totalPages = Math.ceil(total / limit) || 1;

  const formattedCustomers: CustomerListItem[] = [];

  for (const cust of customers) {
    let customerSpent = 0;
    let problemCount = 0;

    for (const ord of cust.orders || []) {
      const isCancelled = ord.status === "CANCELLED";
      if (isCancelled || ord.cancelReason !== null) {
        problemCount++;
      }
      if (!isCancelled) {
        const subtotal = Number(ord.subtotal ?? 0);
        const discount = Number(ord.discount ?? 0);
        const fee = Number(ord.deliveryFee ?? 0);
        customerSpent += Math.max(0, subtotal - discount + fee);
      }
    }

    const roundedSpent = Math.round(customerSpent * 100) / 100;
    const tierInfo = determineLoyaltyTier(cust.totalOrders, roundedSpent);
    const segmentInfo = determineCustomerSegment(
      cust.totalOrders,
      roundedSpent,
      cust.lastOrderAt
    );

    // If segment filter is explicitly provided, enforce post-filter as well
    if (params.segment && segmentInfo.segment !== params.segment.toUpperCase()) {
      continue;
    }

    formattedCustomers.push({
      id: cust.id,
      name: cust.name,
      phone: cust.phone,
      address: cust.address,
      notes: cust.notes,
      totalOrders: cust.totalOrders,
      lastOrderAt: cust.lastOrderAt,
      createdAt: cust.createdAt,
      isActive: cust.isActive,
      tier: tierInfo.tier,
      tierInfo,
      totalSpent: roundedSpent,
      spent: roundedSpent,
      segment: segmentInfo.segment,
      segmentInfo,
      problemCount,
    });
  }

  return {
    customers: formattedCustomers,
    total,
    page,
    limit,
    totalPages,
    stats: {
      totalCustomers,
      newThisMonth,
      vipCount,
      atRiskCount: Number(atRiskCount ?? 0),
      avgSpent,
    },
  };
}

/**
 * Retrieves full customer profile including order history, products,
 * problem orders summary, loyalty metrics, segment, and favorite products.
 */
export async function getCustomerProfile(
  id: string
): Promise<CustomerProfileResult | null> {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          brand: { select: { id: true, name: true } },
          platform: { select: { id: true, name: true } },
          zone: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, price: true } },
            },
          },
        },
      },
    },
  });

  if (!customer) return null;

  const metrics = calculateCustomerStats(customer.orders);
  const problemSummary = identifyProblemOrders(customer.orders);
  const loyaltyTier = determineLoyaltyTier(
    customer.totalOrders,
    metrics.lifetimeSpent
  );
  const segmentInfo = determineCustomerSegment(
    customer.totalOrders,
    metrics.lifetimeSpent,
    customer.lastOrderAt
  );
  const favoriteProducts = calculateCustomerFavorites(customer.orders);
  const preferredPlatform = determinePreferredPlatform(customer.orders);
  const usualDeliveryZone = determineUsualDeliveryZone(customer.orders);

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    notes: customer.notes,
    totalOrders: customer.totalOrders,
    lastOrderAt: customer.lastOrderAt,
    createdAt: customer.createdAt,
    isActive: customer.isActive,
    orders: customer.orders,
    metrics,
    problemSummary,
    loyaltyTier,
    segment: segmentInfo.segment,
    segmentInfo,
    favoriteProducts,
    preferredPlatform,
    usualDeliveryZone,
  };
}

/**
 * Updates customer details (notes, address, name) in transaction
 * and records an entry in the immutable AuditLog.
 */
export async function updateCustomer(
  id: string,
  input: { name?: string; address?: string | null; notes?: string | null },
  actorId: string
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.customer.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error("NOT_FOUND: Customer not found");
    }

    const data: Prisma.CustomerUpdateInput = {};
    if (input.name !== undefined && input.name.trim().length > 0) {
      data.name = input.name.trim();
    }
    if (input.address !== undefined) {
      data.address = input.address?.trim() || null;
    }
    if (input.notes !== undefined) {
      data.notes = input.notes?.trim() || null;
    }

    const updated = await tx.customer.update({
      where: { id },
      data,
    });

    await audit(tx, {
      userId: actorId,
      action: "UPDATE",
      entityType: "Customer",
      entityId: id,
      oldValue: {
        name: existing.name,
        address: existing.address,
        notes: existing.notes,
      },
      newValue: {
        name: updated.name,
        address: updated.address,
        notes: updated.notes,
      },
    });

    return updated;
  });
}

/**
 * Updates customer notes specifically in transaction with audit logging.
 */
export async function updateCustomerNotes(
  id: string,
  notes: string,
  actorId: string
) {
  return updateCustomer(id, { notes }, actorId);
}
