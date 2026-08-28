"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Calendar } from "lucide-react";
import type { DailyBreakdownRow } from "@/lib/reports";

interface RevenueTrendChartProps {
  data: DailyBreakdownRow[];
  formatCurrency: (val: number) => string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
    color: string;
  }>;
  label?: string;
  formatCurrency: (val: number) => string;
  t: (key: string) => string;
}

function CustomTooltip({ active, payload, label, formatCurrency, t }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-2 min-w-[170px]">
      <div className="flex items-center gap-1.5 font-bold text-foreground pb-1 border-b border-border/60">
        <Calendar className="size-3.5 text-primary" />
        <span>{label}</span>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const isSales = entry.dataKey === "sales";
          return (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}</span>
              </div>
              <span className="font-bold text-foreground tabular-nums">
                {isSales ? formatCurrency(entry.value) : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RevenueTrendChart({ data, formatCurrency }: RevenueTrendChartProps) {
  const t = useTranslations("reports.charts");

  if (!data || data.length === 0) {
    return (
      <Card className="border-border/80 bg-card/90 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="size-4.5 text-primary" />
            {t("revenueTrend")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t("revenueTrendSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center text-xs text-muted-foreground">
          {t("noChartData")}
        </CardContent>
      </Card>
    );
  }

  // Format short date label for XAxis (MM/DD)
  const chartData = data.map((row) => {
    const parts = row.date.split("-");
    const shortDate = parts.length === 3 ? `${parts[1]}/${parts[2]}` : row.date;
    return {
      ...row,
      displayDate: shortDate,
      fullDate: row.date,
    };
  });

  return (
    <Card className="border-border/80 bg-card/90 shadow-xs group hover:border-border transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="size-4.5 text-emerald-500" />
              {t("revenueTrend")}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {t("revenueTrendSubtitle")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />

              <XAxis
                dataKey="displayDate"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />

              <YAxis
                yAxisId="left"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}`}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />

              <Tooltip
                content={
                  <CustomTooltip
                    formatCurrency={formatCurrency}
                    t={t}
                  />
                }
              />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }}
              />

              <Area
                yAxisId="left"
                type="monotone"
                dataKey="sales"
                name={t("revenue")}
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#salesGradient)"
              />

              <Bar
                yAxisId="right"
                dataKey="orders"
                name={t("orders")}
                fill="#0284c7"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                opacity={0.85}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
