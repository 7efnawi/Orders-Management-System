import { OrderStatus, CancelReason, DriverType } from "@prisma/client";

export { OrderStatus };

// الانتقالات المسموحة فقط — أي شيء آخر مرفوض.
// CANCELLED مسموح من كل الحالات غير النهائية مع cancelReason إجباري.
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

/** الـ UI يستخدم نفس الخريطة دي لعرض الأزرار الصالحة فقط (FR-ORD-02) */
export function nextAllowedStatuses(status: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[status] ?? [];
}

/**
 * فحص صحة الانتقال بين الحالات ورمي أخطاء واضحة في حال المخالفة
 */
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

/**
 * تحديد حقل التاريخ والوقت المناسب لتسجيل لحظة الانتقال
 */
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

/**
 * محرك الحسابات المالية للأوردر (Subtotal, Net Delivery Fee, Total)
 */
export function calculateOrderTotals(input: {
  items: { price: number; quantity: number }[];
  discount?: number;
  deliveryFee?: number;
  driverType?: DriverType | null;
}): { subtotal: number; netDeliveryFee: number; total: number } {
  const subtotal = input.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = Math.max(0, input.discount ?? 0);
  const rawFee = Math.max(0, input.deliveryFee ?? 0);

  // App fleet means restaurant collected delivery fee is 0 (handled by platform)
  const netDeliveryFee = input.driverType === DriverType.APP ? 0 : rawFee;

  const total = Math.max(0, subtotal - discount + netDeliveryFee);

  return { subtotal, netDeliveryFee, total };
}
