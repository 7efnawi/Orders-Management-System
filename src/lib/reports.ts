import { OrderStatus, PaymentMethod } from "@prisma/client";
import { type DecimalLike, toNumber, roundCurrency } from "./closing";

// محرك حسابات التقارير والتحليلات (Phase 8 — FR-RPT) — Directives §2, §3
// دوال pure فقط: مفيش أي وصول للداتابيز من هنا — الـ service بيغذيها والـ UI بيعرض نتايجها
// اتفاقية الإيراد: الملغي (CANCELLED) مستبعد من كل الأرقام المالية (زي calculateShiftSummary)،
// والخصم المرفوض (discountStatus = REJECTED) لا يُحسب (زي getDashboardOverview)

export interface ReportOrderItemInput {
  productId: string;
  productName?: string | null;
  quantity: number;
  totalPrice: DecimalLike;
}

export interface ReportOrderInput {
  id: string;
  status: OrderStatus | string;
  paymentMethod: PaymentMethod | string;
  subtotal: DecimalLike;
  discount?: DecimalLike | null;
  discountStatus?: string | null;
  deliveryFee?: DecimalLike | null;
  createdAt: Date | string;
  brandName?: string | null;
  platformName?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  driverType?: string | null;
  items?: ReportOrderItemInput[];
}

export interface ReportExpenseInput {
  value: DecimalLike;
  quantity?: number | null;
  date: Date | string;
}

export interface SalesSummary {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  activeOrders: number;
  grossSales: number;
  totalDiscounts: number;
  totalDeliveryFees: number;
  netRevenue: number;
  totalExpenses: number;
  netProfit: number;
  aov: number;
  cashTotal: number;
  visaTotal: number;
  onlineTotal: number;
}

export const STANDARD_PLATFORM_NAMES = [
  "Talabat",
  "InstaShop",
  "Harry App",
  "Elmenus",
  "Facebook",
  "Phone",
] as const;

export type StandardPlatformName = (typeof STANDARD_PLATFORM_NAMES)[number];

export const STANDARD_BRAND_NAMES = [
  "Flower",
  "Mastery",
  "Niwa",
  "Tobiko",
] as const;

export type StandardBrandName = (typeof STANDARD_BRAND_NAMES)[number];

export function normalizePlatformName(name?: string | null): string {
  if (!name) return "—";
  const trimmed = name.trim();
  const matched = STANDARD_PLATFORM_NAMES.find(
    (p) => p.toLowerCase() === trimmed.toLowerCase()
  );
  return matched ?? trimmed;
}

export function normalizeBrandName(name?: string | null): string {
  if (!name) return "—";
  const trimmed = name.trim();
  const matched = STANDARD_BRAND_NAMES.find(
    (b) => b.toLowerCase() === trimmed.toLowerCase()
  );
  return matched ?? trimmed;
}

export interface PlatformBrandRow {
  platformName: string;
  brandName: string;
  orders: number;
  sales: number;
}

export interface DailyBreakdownRow {
  date: string; // YYYY-MM-DD
  orders: number;
  delivered: number;
  cancelled: number;
  sales: number;
  deliveryFees: number;
  expenses: number;
  net: number;
}

export interface DriverCashRow {
  driverId: string | null;
  driverName: string | null;
  driverType: string | null;
  totalOrders: number;
  cashOrders: number;
  cashCollected: number;
}

export interface TopProductRow {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  ordersCount: number;
}

export interface HourlyRow {
  hour: number;
  orders: number;
  revenue: number;
}

export interface DayHourCell {
  day: number;
  hour: number;
  orders: number;
}

export interface ReportOrderInputExtended extends ReportOrderInput {
  cashierId?: string | null;
  cashierName?: string | null;
  approverName?: string | null;
  orderNumber?: string | null;
  discountReason?: string | null;
}

export interface EmployeeReportRow {
  cashierId: string;
  cashierName: string;
  totalOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  discountsApproved: number;
  discountsApprovedValue: number;
}

export interface DiscountRow {
  orderId: string;
  orderNumber: string;
  cashierName: string;
  approverName: string | null;
  discountValue: number;
  discountReason: string | null;
  discountStatus: string;
  orderDate: string;
}

export interface SalesComparison {
  netRevenueDeltaPct: number;
  ordersDeltaPct: number;
  aovDeltaPct: number;
  netProfitDeltaPct: number;
}

/** الخصم الفعلي المحسوب على الأوردر — المرفوض يعتبر صفر */
function effectiveDiscount(order: ReportOrderInput): number {
  if (
    order.discountStatus != null &&
    String(order.discountStatus).toUpperCase() === "REJECTED"
  ) {
    return 0;
  }
  return Math.max(0, toNumber(order.discount));
}

/** صافي إجمالي الأوردر (subtotal − discount + deliveryFee) — غير سالب أبدًا */
export function orderNetTotal(order: ReportOrderInput): number {
  const subtotal = toNumber(order.subtotal);
  const discount = effectiveDiscount(order);
  const deliveryFee = Math.max(0, toNumber(order.deliveryFee));
  return Math.max(0, subtotal - discount + deliveryFee);
}

function isCancelled(order: ReportOrderInput): boolean {
  return (
    order.status === OrderStatus.CANCELLED ||
    String(order.status).toUpperCase() === "CANCELLED"
  );
}

/** مفتاح اليوم المحلي للأوردرات (نفس اتفاقية listOrders — حدود منتصف الليل المحلي) */
function orderDateKey(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** مفتاح يوم عمود date للمصروفات (عمود @db.Date مخزن UTC منتصف الليل) */
function expenseDateKey(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString().split("T")[0];
}

/**
 * ملخص المبيعات الكامل لنطاق زمني:
 * الأوردرات الملغاة لا تدخل في أي رقم مالي، والمصروفات = مجموع (الكمية × القيمة)
 */
export function calculateSalesSummary(
  orders: ReportOrderInput[] = [],
  expenses: ReportExpenseInput[] = []
): SalesSummary {
  let deliveredOrders = 0;
  let cancelledOrders = 0;
  let grossSales = 0;
  let totalDiscounts = 0;
  let totalDeliveryFees = 0;
  let netRevenue = 0;
  let cashTotal = 0;
  let visaTotal = 0;
  let onlineTotal = 0;

  for (const order of orders) {
    if (isCancelled(order)) {
      cancelledOrders += 1;
      continue;
    }
    if (
      order.status === OrderStatus.DELIVERED ||
      String(order.status).toUpperCase() === "DELIVERED"
    ) {
      deliveredOrders += 1;
    }

    grossSales += toNumber(order.subtotal);
    totalDiscounts += effectiveDiscount(order);
    totalDeliveryFees += Math.max(0, toNumber(order.deliveryFee));
    netRevenue += orderNetTotal(order);

    const method = String(order.paymentMethod).toUpperCase();
    const total = orderNetTotal(order);
    if (method === PaymentMethod.CASH || method === "CASH") {
      cashTotal += total;
    } else if (method === PaymentMethod.VISA || method === "VISA") {
      visaTotal += total;
    } else if (method === PaymentMethod.ONLINE || method === "ONLINE") {
      onlineTotal += total;
    }
  }

  let totalExpenses = 0;
  for (const expense of expenses) {
    const qty = expense.quantity != null && expense.quantity > 0 ? expense.quantity : 1;
    totalExpenses += qty * toNumber(expense.value);
  }

  const totalOrders = orders.length;
  const activeOrders = totalOrders - cancelledOrders;
  const roundedNetRevenue = roundCurrency(netRevenue);
  const roundedExpenses = roundCurrency(totalExpenses);

  return {
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    activeOrders,
    grossSales: roundCurrency(grossSales),
    totalDiscounts: roundCurrency(totalDiscounts),
    totalDeliveryFees: roundCurrency(totalDeliveryFees),
    netRevenue: roundedNetRevenue,
    totalExpenses: roundedExpenses,
    netProfit: roundCurrency(roundedNetRevenue - roundedExpenses),
    aov: activeOrders > 0 ? roundCurrency(roundedNetRevenue / activeOrders) : 0,
    cashTotal: roundCurrency(cashTotal),
    visaTotal: roundCurrency(visaTotal),
    onlineTotal: roundCurrency(onlineTotal),
  };
}

/**
 * المبيعات مجمعة حسب منصة × براند (بدون الملغي) — مرتبة تنازليًا بالمبيعات
 * عند تفعيل standardOnly (الافتراضي true) يتم استبعاد منصات وبراندات التيست
 */
export function groupSalesByPlatformBrand(
  orders: ReportOrderInput[] = [],
  standardOnly = true
): PlatformBrandRow[] {
  const map = new Map<string, PlatformBrandRow>();

  for (const order of orders) {
    if (isCancelled(order)) continue;
    const platformName = normalizePlatformName(order.platformName);
    const brandName = normalizeBrandName(order.brandName);

    if (standardOnly) {
      const isStandardPlatform = (STANDARD_PLATFORM_NAMES as readonly string[]).includes(platformName);
      const isStandardBrand = (STANDARD_BRAND_NAMES as readonly string[]).includes(brandName);
      if (!isStandardPlatform || !isStandardBrand) {
        continue;
      }
    }

    const key = `${platformName}||${brandName}`;
    const row = map.get(key) ?? {
      platformName,
      brandName,
      orders: 0,
      sales: 0,
    };
    row.orders += 1;
    row.sales += orderNetTotal(order);
    map.set(key, row);
  }

  return Array.from(map.values())
    .map((row) => ({ ...row, sales: roundCurrency(row.sales) }))
    .sort(
      (a, b) =>
        b.sales - a.sales ||
        b.orders - a.orders ||
        a.platformName.localeCompare(b.platformName) ||
        a.brandName.localeCompare(b.brandName)
    );
}

/**
 * التحليل اليومي: صف لكل يوم في النطاق (بما فيها الأيام الفارغة) من startDate إلى endDate
 * startDate/endDate بصيغة YYYY-MM-DD — نطاق غير صالح يرمي INVALID_RANGE
 */
export function buildDailyBreakdown(
  orders: ReportOrderInput[] = [],
  expenses: ReportExpenseInput[] = [],
  startDate: string,
  endDate: string
): DailyBreakdownRow[] {
  const parseDay = (value: string): Date => {
    const parts = value.split("-").map(Number);
    if (parts.length !== 3 || parts.some((p) => isNaN(p))) {
      throw new Error(`INVALID_RANGE: Invalid date "${value}" (expected YYYY-MM-DD)`);
    }
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const start = parseDay(startDate);
  const end = parseDay(endDate);
  if (start > end) {
    throw new Error("INVALID_RANGE: startDate must be on or before endDate");
  }
  const spanDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (spanDays > 731) {
    throw new Error("INVALID_RANGE: Date range cannot exceed two years");
  }

  const orderAgg = new Map<string, { orders: number; delivered: number; cancelled: number; sales: number; deliveryFees: number }>();
  for (const order of orders) {
    const key = orderDateKey(order.createdAt);
    const row = orderAgg.get(key) ?? { orders: 0, delivered: 0, cancelled: 0, sales: 0, deliveryFees: 0 };
    row.orders += 1;
    if (isCancelled(order)) {
      row.cancelled += 1;
    } else {
      if (
        order.status === OrderStatus.DELIVERED ||
        String(order.status).toUpperCase() === "DELIVERED"
      ) {
        row.delivered += 1;
      }
      row.sales += orderNetTotal(order);
      row.deliveryFees += Math.max(0, toNumber(order.deliveryFee));
    }
    orderAgg.set(key, row);
  }

  const expenseAgg = new Map<string, number>();
  for (const expense of expenses) {
    const qty = expense.quantity != null && expense.quantity > 0 ? expense.quantity : 1;
    const key = expenseDateKey(expense.date);
    expenseAgg.set(key, (expenseAgg.get(key) ?? 0) + qty * toNumber(expense.value));
  }

  const rows: DailyBreakdownRow[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = orderDateKey(cursor);
    const o = orderAgg.get(key);
    const expensesTotal = roundCurrency(expenseAgg.get(key) ?? 0);
    const sales = roundCurrency(o?.sales ?? 0);
    rows.push({
      date: key,
      orders: o?.orders ?? 0,
      delivered: o?.delivered ?? 0,
      cancelled: o?.cancelled ?? 0,
      sales,
      deliveryFees: roundCurrency(o?.deliveryFees ?? 0),
      expenses: expensesTotal,
      net: roundCurrency(sales - expensesTotal),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return rows;
}

/**
 * تحصيل الكاش لكل مندوب: أوردراته الكلية (غير الملغاة)، أوردراته الكاش، والمبلغ المحصّل
 * الأوردرات بدون مندوب تتجمع في صف أخير (driverId = null)
 */
export function calculateDriverCashCollection(
  orders: ReportOrderInput[] = []
): DriverCashRow[] {
  const map = new Map<string, DriverCashRow>();

  for (const order of orders) {
    if (isCancelled(order)) continue;
    const key = order.driverId ?? "__none__";
    const row = map.get(key) ?? {
      driverId: order.driverId ?? null,
      driverName: order.driverName ?? null,
      driverType: order.driverType ?? null,
      totalOrders: 0,
      cashOrders: 0,
      cashCollected: 0,
    };
    row.totalOrders += 1;

    const method = String(order.paymentMethod).toUpperCase();
    if (method === PaymentMethod.CASH || method === "CASH") {
      row.cashOrders += 1;
      row.cashCollected += orderNetTotal(order);
    }
    map.set(key, row);
  }

  return Array.from(map.values())
    .map((row) => ({ ...row, cashCollected: roundCurrency(row.cashCollected) }))
    .sort(
      (a, b) =>
        // صف "بدون مندوب" آخرًا دايمًا، وبعدها الأعلى تحصيلًا
        (a.driverId === null ? 1 : 0) - (b.driverId === null ? 1 : 0) ||
        b.cashCollected - a.cashCollected ||
        b.totalOrders - a.totalOrders ||
        (a.driverName ?? "").localeCompare(b.driverName ?? "")
    );
}

/**
 * أعلى المنتجات مبيعًا من بنود الأوردرات غير الملغاة — مرتبة بالكمية ثم الإيراد
 */
export function calculateTopProducts(
  orders: ReportOrderInput[] = [],
  limit = 10
): TopProductRow[] {
  const map = new Map<string, TopProductRow & { orderIds: Set<string> }>();

  for (const order of orders) {
    if (isCancelled(order) || !order.items) continue;
    for (const item of order.items) {
      const row = map.get(item.productId) ?? {
        productId: item.productId,
        productName: item.productName || "—",
        quantity: 0,
        revenue: 0,
        ordersCount: 0,
        orderIds: new Set<string>(),
      };
      row.quantity += item.quantity;
      row.revenue += toNumber(item.totalPrice);
      row.orderIds.add(order.id);
      map.set(item.productId, row);
    }
  }

  return Array.from(map.values())
    .map(({ orderIds, ...row }) => ({
      ...row,
      revenue: roundCurrency(row.revenue),
      ordersCount: orderIds.size,
    }))
    .sort(
      (a, b) =>
        b.quantity - a.quantity ||
        b.revenue - a.revenue ||
        a.productName.localeCompare(b.productName)
    )
    .slice(0, Math.max(1, limit));
}

// ───────────── Peak Hours Engine ─────────────

/**
 * توزيع الطلبات على 24 ساعة — دائمًا 24 صف (الساعات الفارغة = 0)
 * الأوردرات الملغاة مستبعدة
 */
export function buildHourlyBreakdown(
  orders: ReportOrderInput[] = []
): HourlyRow[] {
  const agg = Array.from({ length: 24 }, () => ({ orders: 0, revenue: 0 }));

  for (const order of orders) {
    if (isCancelled(order)) continue;
    const d = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
    const h = d.getHours();
    agg[h].orders += 1;
    agg[h].revenue += orderNetTotal(order);
  }

  return agg.map((cell, hour) => ({
    hour,
    orders: cell.orders,
    revenue: roundCurrency(cell.revenue),
  }));
}

/**
 * مصفوفة 7 أيام × 24 ساعة = 168 خلية للـ Heatmap (day: 0=Sun … 6=Sat)
 * الأوردرات الملغاة مستبعدة
 */
export function buildDayHourHeatmap(
  orders: ReportOrderInput[] = []
): DayHourCell[] {
  const map = new Map<string, number>();

  for (const order of orders) {
    if (isCancelled(order)) continue;
    const d = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
    const key = `${d.getDay()}_${d.getHours()}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const cells: DayHourCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      cells.push({ day, hour, orders: map.get(`${day}_${hour}`) ?? 0 });
    }
  }
  return cells;
}

// ───────────── Employee Engine ─────────────

/**
 * إحصائيات كل كاشير: أوردراته، إلغاءاته، إيراداته، وخصوماته المعتمدة
 */
export function calculateEmployeeReport(
  orders: ReportOrderInputExtended[] = []
): EmployeeReportRow[] {
  const map = new Map<string, EmployeeReportRow & { _revenue: number }>();

  for (const order of orders) {
    const key = order.cashierId ?? "__unknown__";
    const row = map.get(key) ?? {
      cashierId: order.cashierId ?? "",
      cashierName: order.cashierName ?? "—",
      totalOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      discountsApproved: 0,
      discountsApprovedValue: 0,
      _revenue: 0,
    };
    row.totalOrders += 1;
    if (isCancelled(order)) {
      row.cancelledOrders += 1;
    } else {
      row._revenue += orderNetTotal(order);
      const ds = String(order.discountStatus ?? "").toUpperCase();
      if (ds === "APPROVED") {
        row.discountsApproved += 1;
        row.discountsApprovedValue += Math.max(0, toNumber(order.discount));
      }
    }
    map.set(key, row);
  }

  return Array.from(map.values())
    .map(({ _revenue, ...row }) => {
      const active = row.totalOrders - row.cancelledOrders;
      const rev = roundCurrency(_revenue);
      return {
        ...row,
        totalRevenue: rev,
        avgOrderValue: active > 0 ? roundCurrency(rev / active) : 0,
        discountsApprovedValue: roundCurrency(row.discountsApprovedValue),
      };
    })
    .sort((a, b) => b.totalOrders - a.totalOrders || b.totalRevenue - a.totalRevenue);
}

/**
 * استخراج صفوف الخصومات (APPROVED أو REJECTED) للتقرير المالي
 */
export function extractDiscountRows(
  orders: ReportOrderInputExtended[] = []
): DiscountRow[] {
  const rows: DiscountRow[] = [];

  for (const order of orders) {
    const ds = String(order.discountStatus ?? "").toUpperCase();
    if (!ds || ds === "NONE" || ds === "PENDING") continue;
    rows.push({
      orderId: order.id,
      orderNumber: order.orderNumber ?? order.id.slice(-6),
      cashierName: order.cashierName ?? "—",
      approverName: order.approverName ?? null,
      discountValue: Math.max(0, toNumber(order.discount)),
      discountReason: order.discountReason ?? null,
      discountStatus: ds,
      orderDate: orderDateKey(order.createdAt),
    });
  }

  return rows.sort((a, b) => b.orderDate.localeCompare(a.orderDate));
}

// ───────────── KPI Comparison Engine ─────────────

function calcPctChange(curr: number, prev: number): number {
  if (prev === 0) {
    return curr > 0 ? 100 : 0;
  }
  return roundCurrency(((curr - prev) / prev) * 100);
}

/**
 * حساب نسب التغير بين فترتين لبطاقات الـ KPI
 */
export function calculateSalesComparison(
  current: { netRevenue: number; totalOrders: number; aov: number; netProfit: number },
  previous: { netRevenue: number; totalOrders: number; aov: number; netProfit: number }
): SalesComparison {
  return {
    netRevenueDeltaPct: calcPctChange(current.netRevenue, previous.netRevenue),
    ordersDeltaPct: calcPctChange(current.totalOrders, previous.totalOrders),
    aovDeltaPct: calcPctChange(current.aov, previous.aov),
    netProfitDeltaPct: calcPctChange(current.netProfit, previous.netProfit),
  };
}

