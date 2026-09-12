// Customer CRM Domain Calculations & Logic (Phase 11 — FR-CUST-01..08, CRM 2.0)
// Pure functions only — zero database access or side effects.

export type CustomerSegment = "VIP" | "REGULAR" | "NEW" | "AT_RISK" | "INACTIVE";

export interface CustomerSegmentInfo {
  segment: CustomerSegment;
  labelAr: string;
  labelEn: string;
  badgeClass: string;
  descriptionAr: string;
}

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

/**
 * Classifies customers into 5 operational RFM segments for dark kitchen:
 * - VIP: totalOrders >= 15 OR lifetimeSpent >= 3000
 * - Regular: totalOrders >= 3 and lastOrder within last 30 days
 * - New: totalOrders <= 2 and lastOrder within last 30 days
 * - At Risk: totalOrders >= 3 and lastOrder between 30 and 60 days ago
 * - Inactive: lastOrder > 60 days ago or 0 orders
 */
export function determineCustomerSegment(
  totalOrders: number = 0,
  lifetimeSpent: number = 0,
  lastOrderAt: Date | string | null = null,
  refDate?: Date
): CustomerSegmentInfo {
  const ordersCount = Math.max(0, Math.floor(Number(totalOrders) || 0));
  const spent = Math.max(0, Number(lifetimeSpent) || 0);
  const reference = refDate ? new Date(refDate) : new Date();

  // 1. VIP (Monetary or high Frequency): totalOrders >= 15 OR lifetimeSpent >= 3000
  if (ordersCount >= 15 || spent >= 3000) {
    return {
      segment: "VIP",
      labelAr: "VIP",
      labelEn: "VIP",
      badgeClass:
        "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800",
      descriptionAr: "عميل عالي القيمة (طلبات ≥ 15 أو إنفاق ≥ 3,000 ج.م)",
    };
  }

  // 2. Inactive if 0 orders or no order date recorded
  if (ordersCount === 0 || !lastOrderAt) {
    return {
      segment: "INACTIVE",
      labelAr: "خامل",
      labelEn: "Inactive",
      badgeClass:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700",
      descriptionAr: "لم يطلب منذ أكثر من 60 يوماً أو بدون طلبات",
    };
  }

  const orderDate = new Date(lastOrderAt);
  if (isNaN(orderDate.getTime())) {
    return {
      segment: "INACTIVE",
      labelAr: "خامل",
      labelEn: "Inactive",
      badgeClass:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700",
      descriptionAr: "لم يطلب منذ أكثر من 60 يوماً أو بدون طلبات",
    };
  }

  const diffMs = reference.getTime() - orderDate.getTime();
  const daysAgo = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  // 3. Inactive if last order was > 60 days ago
  if (daysAgo > 60) {
    return {
      segment: "INACTIVE",
      labelAr: "خامل",
      labelEn: "Inactive",
      badgeClass:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700",
      descriptionAr: "لم يطلب منذ أكثر من 60 يوماً أو بدون طلبات",
    };
  }

  // 4. Regular vs At Risk for customers with >= 3 orders
  if (ordersCount >= 3) {
    if (daysAgo <= 30) {
      return {
        segment: "REGULAR",
        labelAr: "دائم",
        labelEn: "Regular",
        badgeClass:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
        descriptionAr: "عميل منتظم (طلبات ≥ 3 وطلب خلال آخر 30 يوماً)",
      };
    } else {
      return {
        segment: "AT_RISK",
        labelAr: "معرّض للفقد",
        labelEn: "At Risk",
        badgeClass:
          "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-800",
        descriptionAr: "عميل منتظم انقطع منذ 30 إلى 60 يوماً",
      };
    }
  }

  // 5. New customer: totalOrders <= 2 and ordered within last 30 days
  if (daysAgo <= 30) {
    return {
      segment: "NEW",
      labelAr: "جديد",
      labelEn: "New",
      badgeClass:
        "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800",
      descriptionAr: "عميل جديد (1-2 طلب خلال آخر 30 يوماً)",
    };
  }

  return {
    segment: "INACTIVE",
    labelAr: "خامل",
    labelEn: "Inactive",
    badgeClass:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700",
    descriptionAr: "لم يطلب منذ أكثر من 60 يوماً أو بدون طلبات",
  };
}

/**
 * Computes customer top favorite products across completed orders,
 * sorted descending by quantity ordered.
 */
export function calculateCustomerFavorites(
  orders: any[] = []
): { productId: string; productName: string; quantity: number; price: number }[] {
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return [];
  }

  const aggregates = new Map<
    string,
    { productId: string; productName: string; quantity: number; price: number }
  >();

  for (const order of orders) {
    if (!order || order.status === "CANCELLED") continue;

    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      if (!item) continue;
      const productId =
        item.productId ||
        (typeof item.product === "object" ? item.product?.id : null) ||
        item.id ||
        "";
      const productName =
        item.productName ||
        (typeof item.product === "object" ? item.product?.name : null) ||
        item.name ||
        "منتج";
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const price = Number(
        item.price ??
          item.unitPrice ??
          (typeof item.product === "object" ? item.product?.price : null) ??
          0
      );

      const key = productId || productName;
      const existing = aggregates.get(key);

      if (existing) {
        existing.quantity += quantity;
        if (price > 0) existing.price = price;
      } else {
        aggregates.set(key, {
          productId,
          productName,
          quantity,
          price,
        });
      }
    }
  }

  return Array.from(aggregates.values()).sort((a, b) => b.quantity - a.quantity);
}

/**
 * Determines the most frequently used delivery platform/channel for a customer.
 */
export function determinePreferredPlatform(orders: any[] = []): string {
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return "Phone";
  }

  const platformCounts: Record<string, number> = {};

  for (const order of orders) {
    if (!order) continue;
    const name =
      (typeof order.platform === "object" ? order.platform?.name : null) ??
      order.platformName ??
      (typeof order.platform === "string" ? order.platform : null);

    if (name && typeof name === "string" && name.trim().length > 0) {
      const trimmed = name.trim();
      platformCounts[trimmed] = (platformCounts[trimmed] || 0) + 1;
    }
  }

  let preferred = "Phone";
  let maxCount = 0;

  for (const [name, count] of Object.entries(platformCounts)) {
    if (count > maxCount) {
      maxCount = count;
      preferred = name;
    }
  }

  return preferred;
}

/**
 * Determines the customer's usual delivery zone from order history (100% delivery).
 */
export function determineUsualDeliveryZone(orders: any[] = []): string | null {
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return null;
  }

  const zoneCounts: Record<string, number> = {};

  for (const order of orders) {
    if (!order) continue;
    const zoneName =
      (typeof order.zone === "object" ? order.zone?.name : null) ??
      (typeof order.zone === "string" ? order.zone : null) ??
      order.zoneName ??
      order.deliveryZone ??
      order.deliveryAddress ??
      order.address ??
      (typeof order.customer === "object" ? order.customer?.address : null);

    if (zoneName && typeof zoneName === "string" && zoneName.trim().length > 0) {
      const trimmed = zoneName.trim();
      zoneCounts[trimmed] = (zoneCounts[trimmed] || 0) + 1;
    }
  }

  let usualZone: string | null = null;
  let maxCount = 0;

  for (const [name, count] of Object.entries(zoneCounts)) {
    if (count > maxCount) {
      maxCount = count;
      usualZone = name;
    }
  }

  return usualZone;
}

const SEGMENT_ARABIC_LABELS: Record<string, string> = {
  VIP: "VIP",
  REGULAR: "دائم",
  NEW: "جديد",
  AT_RISK: "معرّض للفقد",
  INACTIVE: "خامل",
};

/**
 * Generates a UTF-8 BOM CSV string containing customer list data formatted for Excel
 * with Arabic headers and proper quote/comma escaping.
 */
export function generateCustomersCsv(customers: any[] = []): string {
  const BOM = "\uFEFF";
  const headers = [
    "اسم العميل",
    "رقم الهاتف",
    "الشريحة",
    "إجمالي الطلبات",
    "إجمالي الإنفاق (ج.م)",
    "آخر طلب",
    "الملاحظات",
  ];

  const escapeCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headerRow = headers.map(escapeCell).join(",");

  const rows = customers.map((cust) => {
    const name = cust.name ?? "";
    const phone = cust.phone ?? "";
    const segmentRaw = cust.segment ?? "";
    const segment =
      cust.segmentInfo?.labelAr ||
      SEGMENT_ARABIC_LABELS[segmentRaw] ||
      segmentRaw;
    const totalOrders = Number(cust.totalOrders ?? 0);
    const totalSpent = Number(cust.totalSpent ?? cust.spent ?? 0);
    let lastOrderStr = "-";
    if (cust.lastOrderAt) {
      try {
        const d = new Date(cust.lastOrderAt);
        if (!isNaN(d.getTime())) {
          lastOrderStr = d.toISOString().split("T")[0];
        }
      } catch {
        lastOrderStr = "-";
      }
    }
    const notes = cust.notes ?? "";

    return [
      escapeCell(name),
      escapeCell(phone),
      escapeCell(segment),
      escapeCell(totalOrders),
      escapeCell(totalSpent),
      escapeCell(lastOrderStr),
      escapeCell(notes),
    ].join(",");
  });

  return BOM + [headerRow, ...rows].join("\r\n");
}
