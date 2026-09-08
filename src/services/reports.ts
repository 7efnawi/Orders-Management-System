import { prisma } from "@/lib/prisma";
import {
  calculateSalesSummary,
  groupSalesByPlatformBrand,
  buildDailyBreakdown,
  calculateDriverCashCollection,
  calculateTopProducts,
  buildHourlyBreakdown,
  buildDayHourHeatmap,
  calculateEmployeeReport,
  extractDiscountRows,
  calculateSalesComparison,
  type ReportOrderInput,
  type ReportExpenseInput,
  type SalesSummary,
  type PlatformBrandRow,
  type DailyBreakdownRow,
  type DriverCashRow,
  type TopProductRow,
  type HourlyRow,
  type DayHourCell,
  type EmployeeReportRow,
  type DiscountRow,
  type SalesComparison,
  type ReportOrderInputExtended,
} from "@/lib/reports";

export interface ReportsFilter {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  brandId?: string;
  platformId?: string;
}

export interface ReportsPayload {
  startDate: string;
  endDate: string;
  summary: SalesSummary;
  previousSummary?: SalesSummary;
  comparison?: SalesComparison;
  platformBrand: PlatformBrandRow[];
  dailyBreakdown: DailyBreakdownRow[];
  driverCash: DriverCashRow[];
  topProducts: TopProductRow[];
}

export interface PeakHoursPayload {
  startDate: string;
  endDate: string;
  hourly: HourlyRow[];
  heatmap: DayHourCell[];
}

export interface EmployeesPayload {
  startDate: string;
  endDate: string;
  employees: EmployeeReportRow[];
  discounts: DiscountRow[];
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function formatIsoDate(d: Date): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: formatIsoDate(startOfMonth),
    endDate: formatIsoDate(now),
  };
}

function validateDateRange(startDate: string, endDate: string): void {
  if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
    throw new Error("INVALID_DATE_FORMAT");
  }

  if (startDate > endDate) {
    throw new Error("INVALID_DATE_RANGE");
  }

  // Guard against extreme queries (cap at 730 days / 2 years)
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
  if (diffDays > 730) {
    throw new Error("DATE_RANGE_TOO_LARGE");
  }
}

function getPreviousDateRange(startDate: string, endDate: string): { prevStart: string; prevEnd: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const prevEndDate = new Date(start);
  prevEndDate.setDate(prevEndDate.getDate() - 1);

  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - diffDays + 1);

  return {
    prevStart: formatIsoDate(prevStartDate),
    prevEnd: formatIsoDate(prevEndDate),
  };
}

/**
 * Service function to retrieve aggregated reports and analytics data.
 * Pure Read-only operation: No audit logs written.
 */
export async function getReportsData(filters: ReportsFilter = {}): Promise<ReportsPayload> {
  const defaults = getDefaultDateRange();
  const startDate = filters.startDate?.trim() || defaults.startDate;
  const endDate = filters.endDate?.trim() || defaults.endDate;

  validateDateRange(startDate, endDate);

  // Previous comparison range
  const { prevStart, prevEnd } = getPreviousDateRange(startDate, endDate);

  // Date boundaries for Prisma queries
  const orderStart = new Date(`${startDate}T00:00:00.000`);
  const orderEnd = new Date(`${endDate}T23:59:59.999`);

  const prevOrderStart = new Date(`${prevStart}T00:00:00.000`);
  const prevOrderEnd = new Date(`${prevEnd}T23:59:59.999`);

  const expenseStart = new Date(startDate);
  const expenseEnd = new Date(`${endDate}T23:59:59.999`);

  const prevExpenseStart = new Date(prevStart);
  const prevExpenseEnd = new Date(`${prevEnd}T23:59:59.999`);

  // Parallel database queries
  const [orders, expenses, prevOrders, prevExpenses] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: {
          gte: orderStart,
          lte: orderEnd,
        },
        ...(filters.brandId ? { brandId: filters.brandId } : {}),
        ...(filters.platformId ? { platformId: filters.platformId } : {}),
      },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        subtotal: true,
        discount: true,
        discountStatus: true,
        deliveryFee: true,
        createdAt: true,
        brand: { select: { name: true } },
        platform: { select: { name: true } },
        driverId: true,
        driver: { select: { name: true, type: true } },
        items: {
          select: {
            productId: true,
            product: { select: { name: true } },
            quantity: true,
            totalPrice: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.expense.findMany({
      where: {
        date: {
          gte: expenseStart,
          lte: expenseEnd,
        },
      },
      select: {
        value: true,
        quantity: true,
        date: true,
      },
      orderBy: { date: "asc" },
    }),
    prisma.order.findMany({
      where: {
        createdAt: {
          gte: prevOrderStart,
          lte: prevOrderEnd,
        },
        ...(filters.brandId ? { brandId: filters.brandId } : {}),
        ...(filters.platformId ? { platformId: filters.platformId } : {}),
      },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        subtotal: true,
        discount: true,
        discountStatus: true,
        deliveryFee: true,
        createdAt: true,
      },
    }),
    prisma.expense.findMany({
      where: {
        date: {
          gte: prevExpenseStart,
          lte: prevExpenseEnd,
        },
      },
      select: {
        value: true,
        quantity: true,
        date: true,
      },
    }),
  ]);

  // Transform Orders to ReportOrderInput
  const reportOrders: ReportOrderInput[] = orders.map((o) => ({
    id: o.id,
    status: o.status,
    paymentMethod: o.paymentMethod,
    subtotal: o.subtotal,
    discount: o.discount,
    discountStatus: o.discountStatus,
    deliveryFee: o.deliveryFee,
    createdAt: o.createdAt,
    brandName: o.brand.name,
    platformName: o.platform.name,
    driverId: o.driverId,
    driverName: o.driver?.name ?? null,
    driverType: o.driver?.type ?? null,
    items: o.items.map((i) => ({
      productId: i.productId,
      productName: i.product.name,
      quantity: i.quantity,
      totalPrice: i.totalPrice,
    })),
  }));

  const reportPrevOrders: ReportOrderInput[] = prevOrders.map((o) => ({
    id: o.id,
    status: o.status,
    paymentMethod: o.paymentMethod,
    subtotal: o.subtotal,
    discount: o.discount,
    discountStatus: o.discountStatus,
    deliveryFee: o.deliveryFee,
    createdAt: o.createdAt,
  }));

  // Transform Expenses to ReportExpenseInput
  const reportExpenses: ReportExpenseInput[] = expenses.map((e) => ({
    value: e.value,
    quantity: e.quantity,
    date: e.date,
  }));

  const reportPrevExpenses: ReportExpenseInput[] = prevExpenses.map((e) => ({
    value: e.value,
    quantity: e.quantity,
    date: e.date,
  }));

  // Compute reports metrics using pure engine
  const summary = calculateSalesSummary(reportOrders, reportExpenses);
  const previousSummary = calculateSalesSummary(reportPrevOrders, reportPrevExpenses);
  const comparison = calculateSalesComparison(summary, previousSummary);
  const platformBrand = groupSalesByPlatformBrand(reportOrders);
  const dailyBreakdown = buildDailyBreakdown(reportOrders, reportExpenses, startDate, endDate);
  const driverCash = calculateDriverCashCollection(reportOrders);
  const topProducts = calculateTopProducts(reportOrders, 10);

  return {
    startDate,
    endDate,
    summary,
    previousSummary,
    comparison,
    platformBrand,
    dailyBreakdown,
    driverCash,
    topProducts,
  };
}

/**
 * Service function to retrieve Peak Hours analytics (hourly breakdown & 7x24 heatmap).
 */
export async function getPeakHoursData(filters: ReportsFilter = {}): Promise<PeakHoursPayload> {
  const defaults = getDefaultDateRange();
  const startDate = filters.startDate?.trim() || defaults.startDate;
  const endDate = filters.endDate?.trim() || defaults.endDate;

  validateDateRange(startDate, endDate);

  const orderStart = new Date(`${startDate}T00:00:00.000`);
  const orderEnd = new Date(`${endDate}T23:59:59.999`);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: orderStart,
        lte: orderEnd,
      },
      ...(filters.brandId ? { brandId: filters.brandId } : {}),
      ...(filters.platformId ? { platformId: filters.platformId } : {}),
    },
    select: {
      id: true,
      status: true,
      paymentMethod: true,
      subtotal: true,
      discount: true,
      discountStatus: true,
      deliveryFee: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const reportOrders: ReportOrderInput[] = orders.map((o) => ({
    id: o.id,
    status: o.status,
    paymentMethod: o.paymentMethod,
    subtotal: o.subtotal,
    discount: o.discount,
    discountStatus: o.discountStatus,
    deliveryFee: o.deliveryFee,
    createdAt: o.createdAt,
  }));

  return {
    startDate,
    endDate,
    hourly: buildHourlyBreakdown(reportOrders),
    heatmap: buildDayHourHeatmap(reportOrders),
  };
}

/**
 * Service function to retrieve Employee performance and discounts log.
 */
export async function getEmployeesData(filters: ReportsFilter = {}): Promise<EmployeesPayload> {
  const defaults = getDefaultDateRange();
  const startDate = filters.startDate?.trim() || defaults.startDate;
  const endDate = filters.endDate?.trim() || defaults.endDate;

  validateDateRange(startDate, endDate);

  const orderStart = new Date(`${startDate}T00:00:00.000`);
  const orderEnd = new Date(`${endDate}T23:59:59.999`);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: orderStart,
        lte: orderEnd,
      },
      ...(filters.brandId ? { brandId: filters.brandId } : {}),
      ...(filters.platformId ? { platformId: filters.platformId } : {}),
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentMethod: true,
      subtotal: true,
      discount: true,
      discountStatus: true,
      discountReason: true,
      deliveryFee: true,
      createdAt: true,
      cashier: { select: { id: true, name: true } },
      approver: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const extended: ReportOrderInputExtended[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentMethod: o.paymentMethod,
    subtotal: o.subtotal,
    discount: o.discount,
    discountStatus: o.discountStatus,
    discountReason: o.discountReason,
    deliveryFee: o.deliveryFee,
    createdAt: o.createdAt,
    cashierId: o.cashier.id,
    cashierName: o.cashier.name,
    approverName: o.approver?.name ?? null,
  }));

  return {
    startDate,
    endDate,
    employees: calculateEmployeeReport(extended),
    discounts: extractDiscountRows(extended),
  };
}
