"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentBreakdownChart } from "@/components/reports/charts/payment-breakdown-chart";
import type { ReportsPayload } from "@/services/reports";

interface PaymentTabProps {
  data: ReportsPayload;
  formatCurrency: (v: number) => string;
}

export function PaymentTab({ data, formatCurrency }: PaymentTabProps) {
  const t = useTranslations("reports.payment");
  const { summary } = data;

  const rows = [
    {
      method: t("cash"),
      value: summary.cashTotal,
      badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0",
    },
    {
      method: t("visa"),
      value: summary.visaTotal,
      badge: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-0",
    },
    {
      method: t("online"),
      value: summary.onlineTotal,
      badge: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-0",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentBreakdownChart summary={summary} formatCurrency={formatCurrency} />

        <Card className="border-border/70 shadow-xs overflow-hidden self-start">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-3 text-start">{t("table.method")}</th>
                  <th className="p-3 text-end">{t("table.revenue")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {rows.map((row) => (
                  <tr key={row.method} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <Badge className={`text-[11px] font-semibold ${row.badge}`}>{row.method}</Badge>
                    </td>
                    <td className="p-3 text-end font-mono font-bold text-foreground">
                      {formatCurrency(row.value)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/20 font-bold">
                  <td className="p-3 text-foreground">{t("table.total")}</td>
                  <td className="p-3 text-end font-mono text-foreground">
                    {formatCurrency(summary.netRevenue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
