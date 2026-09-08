"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import type { SalesSummary } from "@/lib/reports";

interface PaymentBreakdownChartProps {
  summary: SalesSummary;
  formatCurrency: (v: number) => string;
}

const COLORS = {
  cash: "#10b981",
  visa: "#3b82f6",
  online: "#a855f7",
};

export function PaymentBreakdownChart({ summary, formatCurrency }: PaymentBreakdownChartProps) {
  const t = useTranslations("reports.payment");

  const total = summary.cashTotal + summary.visaTotal + summary.onlineTotal || 1;
  const data = [
    { name: t("cash"), value: summary.cashTotal, color: COLORS.cash },
    { name: t("visa"), value: summary.visaTotal, color: COLORS.visa },
    { name: t("online"), value: summary.onlineTotal, color: COLORS.online },
  ].filter((d) => d.value > 0);

  return (
    <Card className="border-border/70 shadow-xs">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/40">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
          <CreditCard className="size-4 text-primary" />
          <span>{t("chartTitle")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <div className="w-full h-52">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              {t("noData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any) => [formatCurrency(Number(v) || 0), t("revenue")]}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-4 space-y-2 border-t border-border/40 pt-4">
          {[
            { label: t("cash"), value: summary.cashTotal, color: COLORS.cash },
            { label: t("visa"), value: summary.visaTotal, color: COLORS.visa },
            { label: t("online"), value: summary.onlineTotal, color: COLORS.online },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="text-muted-foreground">{row.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-muted-foreground text-[11px]">
                  {Math.round((row.value / total) * 100)}%
                </span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(row.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
