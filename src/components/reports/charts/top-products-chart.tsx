"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award } from "lucide-react";
import type { TopProductRow } from "@/lib/reports";

interface TopProductsChartProps {
  data: TopProductRow[];
  formatCurrency: (val: number) => string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TopProductRow;
  }>;
  formatCurrency: (val: number) => string;
  t: (key: string) => string;
}

function CustomTooltip({ active, payload, formatCurrency, t }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-[170px]">
      <div className="flex items-center gap-1.5 font-bold text-foreground pb-1 border-b border-border/60">
        <Award className="size-3.5 text-amber-500" />
        <span className="truncate">{item.productName}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>{t("quantity")}:</span>
        <span className="font-bold text-foreground tabular-nums">{item.quantity}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>{t("orders")}:</span>
        <span className="font-bold text-foreground tabular-nums">{item.ordersCount}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>{t("revenue")}:</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
          {formatCurrency(item.revenue)}
        </span>
      </div>
    </div>
  );
}

export function TopProductsChart({ data, formatCurrency }: TopProductsChartProps) {
  const t = useTranslations("reports.charts");

  if (!data || data.length === 0) {
    return (
      <Card className="border-border/80 bg-card/90 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Award className="size-4.5 text-primary" />
            {t("topProducts")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t("topProductsSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center text-xs text-muted-foreground">
          {t("noChartData")}
        </CardContent>
      </Card>
    );
  }

  // Display top 6 for clean visual chart representation
  const topItems = data.slice(0, 6).map((item) => ({
    ...item,
    shortName: item.productName.length > 14 ? `${item.productName.slice(0, 12)}…` : item.productName,
  }));

  return (
    <Card className="border-border/80 bg-card/90 shadow-xs group hover:border-border transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <Award className="size-4.5 text-amber-500" />
          {t("topProducts")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          {t("topProductsSubtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topItems}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.6} />

              <XAxis
                type="number"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />

              <YAxis
                type="category"
                dataKey="shortName"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                width={90}
              />

              <Tooltip
                content={
                  <CustomTooltip
                    formatCurrency={formatCurrency}
                    t={t}
                  />
                }
              />

              <Bar
                dataKey="quantity"
                name={t("quantity")}
                fill="#8b5cf6"
                radius={[0, 4, 4, 0]}
                maxBarSize={22}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
