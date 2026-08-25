// Single Source of Truth لانتقالات حالات الأوردر (Directives §3 — المواصفة §6)
// المنطق الفعلي (assertTransition) يتكتب بـ TDD في مرحلة Orders (Phase 4).

export enum OrderStatus {
  NEW = "NEW",
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  READY = "READY",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

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
  return ALLOWED_TRANSITIONS[status];
}
