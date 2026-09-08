"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { RevenueTrendChart } from "@/components/reports/charts/revenue-trend-chart";
import { cn } from "@/lib/utils";
import type { ReportsPayload } from "@/services/reports";

interface SalesTabProps {
  data: ReportsPayload;
  formatCurrency: (v: number) => string;
}

export function SalesTab({ data, formatCurrency }: SalesTabProps) {
  const t = useTranslations("reports.sales");
  const { summary, dailyBreakdown: rows } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("grossSales"), value: summary.grossSales, color: "text-foreground" },
          {
            label: t("totalDiscounts"),
            value: summary.totalDiscounts,
            color: "text-rose-600 dark:text-rose-400",
          },
          {
            label: t("deliveryFees"),
            value: summary.totalDeliveryFees,
            color: "text-muted-foreground",
          },
          {
            label: t("netRevenue"),
            value: summary.netRevenue,
            color: "text-emerald-600 dark:text-emerald-400",
          },
        ].map((item) => (
          <Card key={item.label} className="p-4 border-border/70 shadow-xs">
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className={cn("text-base font-bold font-mono", item.color)}>
              {formatCurrency(item.value)}
            </p>
          </Card>
        ))}
      </div>

      <RevenueTrendChart data={rows} formatCurrency={formatCurrency} />

      <Card className="border-border/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                <th className="p-3 text-start">{t("table.date")}</th>
                <th className="p-3 text-center">{t("table.orders")}</th>
                <th className="p-3 text-center">{t("table.delivered")}</th>
                <th className="p-3 text-center">{t("table.cancelled")}</th>
                <th className="p-3 text-end">{t("table.sales")}</th>
                <th className="p-3 text-end">{t("table.deliveryFees")}</th>
                <th className="p-3 text-end">{t("table.expenses")}</th>
                <th className="p-3 text-end font-bold text-foreground">{t("table.net")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    {t("table.empty")}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.date} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono font-medium">{row.date}</td>
                    <td className="p-3 text-center font-mono">{row.orders}</td>
                    <td className="p-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {row.delivered}
                    </td>
                    <td className="p-3 text-center font-mono text-rose-600 dark:text-rose-400 font-semibold">
                      {row.cancelled}
                    </td>
                    <td className="p-3 text-end font-mono font-semibold">
                      {formatCurrency(row.sales)}
                    </td>
                    <td className="p-3 text-end font-mono text-muted-foreground">
                      {formatCurrency(row.deliveryFees)}
                    </td>
                    <td className="p-3 text-end font-mono text-rose-600 dark:text-rose-400">
                      {formatCurrency(row.expenses)}
                    </td>
                    <td
                      className={cn(
                        "p-3 text-end font-mono font-bold",
                        row.net >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {formatCurrency(row.net)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
