// Customer CRM Domain Calculations & Logic (Phase 11 — FR-CUST-01..08)
// Pure functions only — zero database access or side effects.

export type CustomerLoyaltyTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface LoyaltyTierInfo {
  tier: CustomerLoyaltyTier;
  labelAr: string;
  labelEn: string;
  isFirstTime: boolean;
  isReturning: boolean;
  customerType: "FIRST_TIME" | "RETURNING";
  badgeClass: string;
  minOrders: number;
}

export interface CustomerMetrics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  lifetimeSpent: number;
  aov: number; // Average Order Value
  lastOrderDate: Date | null;
  preferredBrand: string | null;
  preferredBrandId?: string | null;
  brandBreakdown?: Record<string, number>;
}

export interface ProblemOrderSummary {
  problemOrders: any[];
  totalProblems: number;
  hasProblems: boolean;
  cancelledCount: number;
  deliveryIssueCount: number;
  qualityIssueCount: number;
  otherIssueCount: number;
}

/**
 * Determines customer loyalty tier and classifies first-time vs returning.
 * Tiers:
 * - Bronze: 1-4 orders (or 0)
 * - Silver: 5-14 orders
 * - Gold: 15-29 orders
 * - Platinum: 30+ orders
 *
 * Classification:
 * - First-time: totalOrders <= 1
 * - Returning: totalOrders > 1
 */
export function determineLoyaltyTier(
  totalOrders: number = 0,
  _totalSpent: number = 0
): LoyaltyTierInfo {
  const count = Math.max(0, Math.floor(Number(totalOrders) || 0));
  const isFirstTime = count <= 1;
  const isReturning = !isFirstTime;

  if (count >= 30) {
    return {
      tier: "PLATINUM",
      labelAr: "بلاتيني",
      labelEn: "Platinum",
      isFirstTime,
      isReturning,
      customerType: isFirstTime ? "FIRST_TIME" : "RETURNING",
      badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800",
      minOrders: 30,
    };
  }

  if (count >= 15) {
    return {
      tier: "GOLD",
      labelAr: "ذهبي",
      labelEn: "Gold",
      isFirstTime,
      isReturning,
      customerType: isFirstTime ? "FIRST_TIME" : "RETURNING",
      badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800",
      minOrders: 15,
    };
  }

  if (count >= 5) {
    return {
      tier: "SILVER",
      labelAr: "فضي",
      labelEn: "Silver",
      isFirstTime,
      isReturning,
      customerType: isFirstTime ? "FIRST_TIME" : "RETURNING",
      badgeClass: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700",
      minOrders: 5,
    };
  }

  return {
    tier: "BRONZE",
    labelAr: "برونزي",
    labelEn: "Bronze",
    isFirstTime,
    isReturning,
    customerType: isFirstTime ? "FIRST_TIME" : "RETURNING",
    badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-800",
    minOrders: 1,
  };
}

/**
 * Computes customer statistics:
 * - lifetime spent (excluding cancelled orders)
 * - average order value (AOV)
 * - last order date
 * - preferred brand
 */
export function calculateCustomerStats(orders: any[] = []): CustomerMetrics {
  if (!orders || orders.length === 0) {
    return {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      lifetimeSpent: 0,
      aov: 0,
      lastOrderDate: null,
      preferredBrand: null,
      brandBreakdown: {},
    };
  }

  let completedOrders = 0;
  let cancelledOrders = 0;
  let lifetimeSpent = 0;
  let latestDate: Date | null = null;
  const brandCounts: Record<string, { count: number; id?: string }> = {};

  for (const order of orders) {
    const isCancelled = order.status === "CANCELLED";
    if (isCancelled) {
      cancelledOrders++;
    } else {
      completedOrders++;
      const subtotal = Number(order.subtotal ?? 0);
      const discount = Number(order.discount ?? 0);
      const deliveryFee = Number(order.deliveryFee ?? 0);
      const orderTotal = Math.max(0, subtotal - discount + deliveryFee);
      lifetimeSpent += orderTotal;
    }

    // Check order timestamp for latest date
    const orderDate = order.createdAt ? new Date(order.createdAt) : null;
    if (orderDate && !isNaN(orderDate.getTime())) {
      if (!latestDate || orderDate.getTime() > latestDate.getTime()) {
        latestDate = orderDate;
      }
    }

    // Brand aggregation
    const brandName =
      (typeof order.brand === "object" ? order.brand?.name : null) ??
      order.brandName ??
      (typeof order.brand === "string" ? order.brand : null);

    const brandId =
      typeof order.brand === "object" ? order.brand?.id : order.brandId ?? null;

    if (brandName) {
      if (!brandCounts[brandName]) {
        brandCounts[brandName] = { count: 0, id: brandId };
      }
      brandCounts[brandName].count++;
    }
  }

  // Find preferred brand
  let preferredBrand: string | null = null;
  let preferredBrandId: string | null = null;
  let maxBrandCount = 0;
  const brandBreakdown: Record<string, number> = {};

  for (const [name, info] of Object.entries(brandCounts)) {
    brandBreakdown[name] = info.count;
    if (info.count > maxBrandCount) {
      maxBrandCount = info.count;
      preferredBrand = name;
      preferredBrandId = info.id ?? null;
    }
  }

  const roundedSpent = Math.round(lifetimeSpent * 100) / 100;
  const aov =
    completedOrders > 0
      ? Math.round((roundedSpent / completedOrders) * 100) / 100
      : 0;

  return {
    totalOrders: orders.length,
    completedOrders,
    cancelledOrders,
    lifetimeSpent: roundedSpent,
    aov,
    lastOrderDate: latestDate,
    preferredBrand,
    preferredBrandId,
    brandBreakdown,
  };
}

/**
 * Identifies problem orders (cancelled, delivery issues, quality issues).
 */
export function identifyProblemOrders(orders: any[] = []): ProblemOrderSummary {
  if (!orders || orders.length === 0) {
    return {
      problemOrders: [],
      totalProblems: 0,
      hasProblems: false,
      cancelledCount: 0,
      deliveryIssueCount: 0,
      qualityIssueCount: 0,
      otherIssueCount: 0,
    };
  }

  const problemOrders: any[] = [];
  let cancelledCount = 0;
  let deliveryIssueCount = 0;
  let qualityIssueCount = 0;
  let otherIssueCount = 0;

  for (const order of orders) {
    const isCancelled = order.status === "CANCELLED";
    const cancelReason = order.cancelReason;
    const isDeliveryIssue = cancelReason === "DELIVERY_ISSUE";
    const isQualityIssue = cancelReason === "QUALITY_ISSUE";

    const isProblem = isCancelled || isDeliveryIssue || isQualityIssue;

    if (isProblem) {
      problemOrders.push(order);
      if (isCancelled) cancelledCount++;
      if (isDeliveryIssue) deliveryIssueCount++;
      if (isQualityIssue) qualityIssueCount++;
      if (isCancelled && !isDeliveryIssue && !isQualityIssue) {
        otherIssueCount++;
      }
    }
  }

  return {
    problemOrders,
    totalProblems: problemOrders.length,
    hasProblems: problemOrders.length > 0,
    cancelledCount,
    deliveryIssueCount,
    qualityIssueCount,
    otherIssueCount,
  };
}

/**
 * Normalizes Egyptian phone numbers and ensures direction-safe LTR output.
 */
export function formatCustomerPhone(phone: string): { display: string; raw: string } {
  if (!phone) return { display: "", raw: "" };

  const trimmed = phone.trim();
  let cleaned = trimmed.replace(/[^\d+]/g, "");

  // Normalize Egyptian country code (+20 or 0020 or 20)
  if (cleaned.startsWith("+20")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("0020")) {
    cleaned = "0" + cleaned.slice(4);
  } else if (cleaned.startsWith("20") && cleaned.length === 12) {
    cleaned = "0" + cleaned.slice(2);
  } else if (!cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }

  const raw = cleaned.replace(/\D/g, "");

  let formatted = raw;
  if (raw.length === 11) {
    formatted = `${raw.slice(0, 3)} ${raw.slice(3, 7)} ${raw.slice(7)}`;
  }

  // \u202A (Left-to-Right Embedding) + formatted + \u202C (Pop Directional Format)
  const display = `\u202A${formatted}\u202C`;

  return { display, raw };
}
