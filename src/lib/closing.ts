import { OrderStatus, PaymentMethod } from "@/types/enums";
import type { Prisma } from "@prisma/client";

/** Decimal-like type supporting numbers, strings, and Prisma Decimal instances */
export type DecimalLike = number | string | Prisma.Decimal | { toNumber?: () => number; toString?: () => string };

export interface OrderSummaryItem {
  status: OrderStatus | string;
  paymentMethod: PaymentMethod | string;
  subtotal: DecimalLike;
  discount?: DecimalLike | null;
  deliveryFee?: DecimalLike | null;
}

export interface ExpenseSummaryItem {
  quantity?: number | null;
  value: DecimalLike;
}

export interface ShiftFinancialSummary {
  totalOrders: number;
  cancelledOrders: number;
  activeOrders: number;
  totalCash: number;
  totalVisa: number;
  totalOnline: number;
  totalDeliveryFees: number;
  totalExpenses: number;
  netCash: number;
}

/**
 * Safely converts any DecimalLike value to a standard JavaScript number.
 */
export function toNumber(value: DecimalLike | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object") {
    if ("toNumber" in value && typeof value.toNumber === "function") {
      return value.toNumber();
    }
    if ("toString" in value && typeof value.toString === "function") {
      const parsed = parseFloat(value.toString());
      return isNaN(parsed) ? 0 : parsed;
    }
  }
  return 0;
}

/**
 * Rounds a monetary value to two decimal places to prevent floating-point inaccuracies.
 */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Pure calculation engine for shift summaries and daily closing reconciliations.
 * Computes:
 * - totalOrders: All orders in shift (active + cancelled)
 * - cancelledOrders: Orders with CANCELLED status
 * - activeOrders: Non-cancelled orders (totalOrders - cancelledOrders)
 * - totalCash: Sum of net total (subtotal - discount + deliveryFee) for active CASH orders
 * - totalVisa: Sum of net total (subtotal - discount + deliveryFee) for active VISA orders
 * - totalOnline: Sum of net total (subtotal - discount + deliveryFee) for active ONLINE orders
 * - totalDeliveryFees: Sum of deliveryFee for all active orders
 * - totalExpenses: Sum of (quantity * value) for all shift expenses
 * - netCash: totalCash - totalExpenses (can be negative if expenses exceed cash)
 */
export function calculateShiftSummary(
  orders: OrderSummaryItem[] = [],
  expenses: ExpenseSummaryItem[] = []
): ShiftFinancialSummary {
  let totalOrders = 0;
  let cancelledOrders = 0;
  let totalCash = 0;
  let totalVisa = 0;
  let totalOnline = 0;
  let totalDeliveryFees = 0;

  for (const order of orders) {
    totalOrders += 1;

    const isCancelled =
      order.status === OrderStatus.CANCELLED ||
      String(order.status).toUpperCase() === "CANCELLED";

    if (isCancelled) {
      cancelledOrders += 1;
      // Cancelled orders do not contribute to revenue or collected fees
      continue;
    }

    const subtotal = toNumber(order.subtotal);
    const discount = Math.max(0, toNumber(order.discount));
    const deliveryFee = Math.max(0, toNumber(order.deliveryFee));
    const orderTotal = Math.max(0, subtotal - discount + deliveryFee);

    totalDeliveryFees += deliveryFee;

    const method = String(order.paymentMethod).toUpperCase();
    if (method === PaymentMethod.CASH || method === "CASH") {
      totalCash += orderTotal;
    } else if (method === PaymentMethod.VISA || method === "VISA") {
      totalVisa += orderTotal;
    } else if (method === PaymentMethod.ONLINE || method === "ONLINE") {
      totalOnline += orderTotal;
    }
  }

  let totalExpenses = 0;
  for (const expense of expenses) {
    const qty = expense.quantity != null && expense.quantity > 0 ? expense.quantity : 1;
    const val = toNumber(expense.value);
    totalExpenses += qty * val;
  }

  const activeOrders = totalOrders - cancelledOrders;
  const roundedTotalCash = roundCurrency(totalCash);
  const roundedTotalVisa = roundCurrency(totalVisa);
  const roundedTotalOnline = roundCurrency(totalOnline);
  const roundedTotalDeliveryFees = roundCurrency(totalDeliveryFees);
  const roundedTotalExpenses = roundCurrency(totalExpenses);
  const netCash = roundCurrency(roundedTotalCash - roundedTotalExpenses);

  return {
    totalOrders,
    cancelledOrders,
    activeOrders,
    totalCash: roundedTotalCash,
    totalVisa: roundedTotalVisa,
    totalOnline: roundedTotalOnline,
    totalDeliveryFees: roundedTotalDeliveryFees,
    totalExpenses: roundedTotalExpenses,
    netCash,
  };
}
