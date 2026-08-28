"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react";
import type { PlatformBrandRow } from "@/lib/reports";
import { getPlatformToken } from "@/lib/visualTokens";

interface PlatformShareChartProps {
  data: PlatformBrandRow[];
  formatCurrency: (val: number) => string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      orders: number;
      color: string;
      percent: number;
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
      <div className="flex items-center gap-1.5 font-bold text-foreground pb-1 border-b border-border/60">
        <span
          className="size-2.5 rounded-full shrink-0"
          style={{ backgroundColor: item.color }}
        />
        <span>{item.name}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>{t("sales")}:</span>
        <span className="font-bold text-foreground tabular-nums">{formatCurrency(item.value)}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>{t("orders")}:</span>
        <span className="font-bold text-foreground tabular-nums">{item.orders}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>{t("share")}:</span>
        <span className="font-bold text-primary tabular-nums">{(item.percent * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}

export function PlatformShareChart({ data, formatCurrency }: PlatformShareChartProps) {
  const t = useTranslations("reports.charts");

  // Aggregate matrix by platform
  const platformAgg = React.useMemo(() => {
    const map = new Map<string, { name: string; value: number; orders: number; color: string }>();
    let totalSales = 0;

    for (const row of data) {
      const existing = map.get(row.platformName) || {
        name: row.platformName,
        value: 0,
        orders: 0,
        color: getPlatformToken(row.platformName).hex,
      };
      existing.value += row.sales;
      existing.orders += row.orders;
      totalSales += row.sales;
      map.set(row.platformName, existing);
    }

    const items = Array.from(map.values()).map((p) => ({
      ...p,
      percent: totalSales > 0 ? p.value / totalSales : 0,
    }));

    // Sort descending by sales
    items.sort((a, b) => b.value - a.value);

    return { items, totalSales };
  }, [data]);

  if (!platformAgg.items.length) {
    return (
      <Card className="border-border/80 bg-card/90 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <PieChartIcon className="size-4.5 text-primary" />
            {t("platformShare")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t("platformShareSubtitle")}
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
          <PieChartIcon className="size-4.5 text-orange-500" />
          {t("platformShare")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          {t("platformShareSubtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Donut Chart */}
          <div className="h-[240px] w-full sm:w-1/2 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformAgg.items}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="var(--background)"
                  strokeWidth={2}
                >
                  {platformAgg.items.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={
                    <CustomTooltip
                      formatCurrency={formatCurrency}
                      t={t}
                    />
                  }
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Summary Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] font-medium text-muted-foreground">
                {t("sales")}
              </span>
              <span className="text-sm font-extrabold text-foreground tabular-nums">
                {formatCurrency(platformAgg.totalSales)}
              </span>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="w-full sm:w-1/2 space-y-1.5">
            {platformAgg.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-muted/40 border border-border/40 text-xs hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-foreground truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 tabular-nums">
                  <span className="text-muted-foreground text-[11px]">
                    {item.orders} {t("orders")}
                  </span>
                  <span className="font-bold text-foreground">
                    {(item.percent * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
