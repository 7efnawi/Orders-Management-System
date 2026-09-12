"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { History, ExternalLink, AlertTriangle, CheckCircle2, Clock, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomerOrderHistoryTableProps {
  orders: any[];
}

export function CustomerOrderHistoryTable({ orders }: CustomerOrderHistoryTableProps) {
  const t = useTranslations("customers.profile");
  const locale = useLocale();
  const isAr = locale === "ar";

  function formatDisplayDate(dateStr: string | Date | null): string {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusBadge(order: any) {
    const status = order.status;
    if (status === "CANCELLED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
          <Ban className="w-3 h-3" />
          <span>{isAr ? "ملغي" : "Cancelled"}</span>
        </span>
      );
    }
    if (status === "DELIVERED" || status === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
          <CheckCircle2 className="w-3 h-3" />
          <span>{isAr ? "مكتمل" : "Delivered"}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
        <Clock className="w-3 h-3" />
        <span>{status}</span>
      </span>
    );
  }

  function calculateOrderTotal(order: any): number {
    const subtotal = Number(order.subtotal ?? 0);
    const discount = Number(order.discount ?? 0);
    const deliveryFee = Number(order.deliveryFee ?? 0);
    return Math.max(0, subtotal - discount + deliveryFee);
  }

  return (
    <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden space-y-0">
      <div className="p-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">{t("orderHistory")}</h3>
        </div>
        <span className="text-xs text-muted-foreground font-mono tabular-nums">
          {orders.length} {isAr ? "طلب" : "orders"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="table-fixed w-full text-sm divide-y divide-border/60">
          <colgroup>
            <col className="w-[18%] min-w-[120px]" />
            <col className="w-[18%] min-w-[120px]" />
            <col className="w-[16%] min-w-[100px]" />
            <col className="w-[16%] min-w-[110px]" />
            <col className="w-[14%] min-w-[100px]" />
            <col className="w-[18%] min-w-[130px]" />
          </colgroup>
          <thead className="bg-muted/40 text-muted-foreground font-medium text-xs">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-start">
                {t("orderNumber")}
              </th>
              <th scope="col" className="px-4 py-2.5 text-start">
                {t("brand")} / {t("platform")}
              </th>
              <th scope="col" className="px-4 py-2.5 text-start">
                {t("status")}
              </th>
              <th scope="col" className="px-4 py-2.5 text-start">
                {t("total")}
              </th>
              <th scope="col" className="px-4 py-2.5 text-start">
                {t("date")}
              </th>
              <th scope="col" className="px-4 py-2.5 text-start">
                {t("cancelReason")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-xs">
                  {t("noOrders")}
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const total = calculateOrderTotal(order);
                const orderNumber =
                  order.orderNumber ||
                  order.externalId ||
                  `#${order.id.slice(0, 7).toUpperCase()}`;
                const brandName = order.brand?.name ?? "-";
                const platformName = order.platform?.name ?? "-";
                const isCancelled = order.status === "CANCELLED";

                return (
                  <tr
                    key={order.id}
                    className={cn(
                      "hover:bg-muted/40 transition-colors",
                      isCancelled && "bg-rose-50/30 dark:bg-rose-950/20"
                    )}
                  >
                    {/* Order Number & link */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-mono text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <span>{orderNumber}</span>
                        <ExternalLink className="w-3 h-3 rtl:rotate-180" />
                      </Link>
                    </td>

                    {/* Brand / Platform */}
                    <td className="px-4 py-3">
                      <div className="text-xs space-y-0.5">
                        <div className="font-semibold text-foreground truncate">{brandName}</div>
                        <div className="text-muted-foreground truncate">{platformName}</div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {getStatusBadge(order)}
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-xs tabular-nums text-foreground">
                        {total.toFixed(2)} {isAr ? "ج.م" : "EGP"}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDisplayDate(order.createdAt)}
                    </td>

                    {/* Cancellation or Delivery reason */}
                    <td className="px-4 py-3 text-xs">
                      {order.cancelReason ? (
                        <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-medium">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{order.cancelReason}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
