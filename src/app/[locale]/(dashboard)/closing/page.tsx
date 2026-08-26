import { setRequestLocale } from "next-intl/server";
import { requirePageUser } from "@/lib/auth";
import {
  getCurrentOpenShift,
  getShiftPreview,
  listDailyClosings,
} from "@/services/closing";
import { ClosingClient } from "@/components/closing/closing-client";

export default async function ClosingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requirePageUser();

  // 1. Fetch current open shift for this user
  const openShift = await getCurrentOpenShift(user.id);
  let initialShiftPreview = null;
  if (openShift) {
    const rawPreview = await getShiftPreview(openShift.id);
    initialShiftPreview = {
      ...rawPreview,
      orders: rawPreview.orders.map((o) => ({
        ...o,
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        deliveryFee: Number(o.deliveryFee),
        createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
      })),
      expenses: rawPreview.expenses.map((e) => ({
        ...e,
        value: Number(e.value),
        createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
      })),
      shift: {
        ...rawPreview.shift,
        openedAt: rawPreview.shift.openedAt instanceof Date ? rawPreview.shift.openedAt.toISOString() : String(rawPreview.shift.openedAt),
        closedAt: rawPreview.shift.closedAt ? (rawPreview.shift.closedAt instanceof Date ? rawPreview.shift.closedAt.toISOString() : String(rawPreview.shift.closedAt)) : null,
      },
    };
  }

  // 2. Fetch recent closings
  const rawClosingsResult = await listDailyClosings({ limit: 50 });
  const initialClosings = rawClosingsResult.closings.map((c) => ({
    id: c.id,
    shiftId: c.shiftId,
    date: c.date instanceof Date ? c.date.toISOString() : String(c.date),
    totalOrders: c.totalOrders,
    cancelledOrders: c.cancelledOrders,
    totalCash: Number(c.totalCash),
    totalVisa: Number(c.totalVisa),
    totalOnline: Number(c.totalOnline),
    totalDeliveryFees: Number(c.totalDeliveryFees),
    totalExpenses: Number(c.totalExpenses),
    netCash: Number(c.netCash),
    notes: c.notes,
    closedAt: c.closedAt instanceof Date ? c.closedAt.toISOString() : String(c.closedAt),
    shift: {
      id: c.shift.id,
      openedAt: c.shift.openedAt instanceof Date ? c.shift.openedAt.toISOString() : String(c.shift.openedAt),
      closedAt: c.shift.closedAt ? (c.shift.closedAt instanceof Date ? c.shift.closedAt.toISOString() : String(c.shift.closedAt)) : null,
      cashier: {
        id: c.shift.cashier.id,
        name: c.shift.cashier.name,
        email: c.shift.cashier.email,
        role: c.shift.cashier.role,
      },
    },
  }));

  return (
    <ClosingClient
      initialShiftPreview={initialShiftPreview}
      initialClosings={initialClosings}
      initialTotalClosingsCount={rawClosingsResult.totalCount}
      currentUser={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
    />
  );
}
