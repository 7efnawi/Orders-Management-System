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
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Flame } from "lucide-react";
import type { PlatformBrandRow } from "@/lib/reports";
import { getBrandToken } from "@/lib/visualTokens";

interface BrandPerformanceChartProps {
  data: PlatformBrandRow[];
  formatCurrency: (val: number) => string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      kanji: string;
      sales: number;
      orders: number;
      color: string;
    };
  }>;
  formatCurrency: (val: number) => string;
  t: (key: string) => string;
}

function CustomTooltip({ active, payload, formatCurrency, t }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-[170px]">
      <div className="flex items-center justify-between font-bold text-foreground pb-1 border-b border-border/60">
        <div className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.name}</span>
        </div>
        <span className="font-japanese text-sm text-primary/80">{item.kanji}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>{t("sales")}:</span>
        <span className="font-bold text-foreground tabular-nums">{formatCurrency(item.sales)}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>{t("orders")}:</span>
        <span className="font-bold text-foreground tabular-nums">{item.orders}</span>
      </div>
    </div>
  );
}

export function BrandPerformanceChart({ data, formatCurrency }: BrandPerformanceChartProps) {
  const t = useTranslations("reports.charts");

  // Aggregate by brand
  const brandAgg = React.useMemo(() => {
    const map = new Map<string, { name: string; kanji: string; sales: number; orders: number; color: string }>();

    for (const row of data) {
      const token = getBrandToken(row.brandName);
      const existing = map.get(row.brandName) || {
        name: row.brandName,
        kanji: token.kanji,
        sales: 0,
        orders: 0,
        color: token.hex,
      };
      existing.sales += row.sales;
      existing.orders += row.orders;
      map.set(row.brandName, existing);
    }

    const items = Array.from(map.values());
    items.sort((a, b) => b.sales - a.sales);
    return items;
  }, [data]);

  if (!brandAgg.length) {
    return (
      <Card className="border-border/80 bg-card/90 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Flame className="size-4.5 text-primary" />
            {t("brandPerformance")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t("brandPerformanceSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center text-xs text-muted-foreground">
          {t("noChartData")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 bg-card/90 shadow-xs group hover:border-border transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <Flame className="size-4.5 text-amber-500" />
          {t("brandPerformance")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          {t("brandPerformanceSubtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={brandAgg}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />

              <XAxis
                dataKey="name"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />

              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}`}
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
                dataKey="sales"
                name={t("sales")}
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              >
                {brandAgg.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} opacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
