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
import { Button } from "@/components/ui/button";
import { Award, Trophy, ListOrdered, BarChart3, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <div
      dir="rtl"
      className="rounded-xl border border-border/80 bg-background/95 p-3.5 shadow-xl backdrop-blur-md text-xs space-y-2 min-w-[200px]"
    >
      <div className="flex items-center gap-2 font-bold text-foreground pb-1.5 border-b border-border/60">
        <Award className="size-4 text-amber-500 shrink-0" />
        <span className="leading-snug">{item.productName}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground gap-4">
        <span>{t("quantity")}:</span>
        <span className="font-bold text-foreground font-mono tabular-nums text-xs">
          {item.quantity} {t("item")}
        </span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground gap-4">
        <span>{t("orders")}:</span>
        <span className="font-bold text-foreground font-mono tabular-nums text-xs">
          {item.ordersCount}
        </span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground gap-4">
        <span>{t("revenue")}:</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums text-xs">
          {formatCurrency(item.revenue)}
        </span>
      </div>
    </div>
  );
}

export function TopProductsChart({ data, formatCurrency }: TopProductsChartProps) {
  const t = useTranslations("reports.charts");
  const [viewMode, setViewMode] = React.useState<"leaderboard" | "chart">("leaderboard");

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
        <CardContent className="h-[320px] flex items-center justify-center text-xs text-muted-foreground">
          {t("noChartData")}
        </CardContent>
      </Card>
    );
  }

  // Display top 6 best-selling products
  const topItems = data.slice(0, 6);
  const maxQty = Math.max(...topItems.map((p) => p.quantity), 1);

  return (
    <Card className="border-border/80 bg-card/90 shadow-xs group hover:border-border transition-colors">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/40">
        <div>
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Trophy className="size-4" />
            </div>
            <span>{t("topProducts")}</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            {t("topProductsSubtitle")}
          </CardDescription>
        </div>

        {/* View Switcher: Leaderboard vs Vertical Column Chart */}
        <div className="inline-flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5 shrink-0 self-start sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("leaderboard")}
            className={cn(
              "h-7 px-2.5 text-xs font-semibold rounded-md transition-all gap-1.5",
              viewMode === "leaderboard"
                ? "bg-background text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ListOrdered className="size-3.5" />
            <span>{t("leaderboard")}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("chart")}
            className={cn(
              "h-7 px-2.5 text-xs font-semibold rounded-md transition-all gap-1.5",
              viewMode === "chart"
                ? "bg-background text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="size-3.5" />
            <span>{t("barChart")}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {viewMode === "leaderboard" ? (
          /* Executive Leaderboard Progress Rows */
          <div className="space-y-3.5 min-h-[300px] flex flex-col justify-between">
            {topItems.map((item, idx) => {
              const pct = Math.max(Math.round((item.quantity / maxQty) * 100), 5);

              return (
                <div
                  key={item.productId}
                  className="group/row flex flex-col gap-2 p-2.5 rounded-xl hover:bg-muted/40 border border-transparent hover:border-border/50 transition-all duration-150"
                >
                  {/* Top line: Rank, Full Name, and Numerical Badges */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full text-xs font-mono font-bold shrink-0 shadow-2xs",
                          idx === 0 && "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 ring-2 ring-amber-500/20",
                          idx === 1 && "bg-slate-300/30 text-slate-700 dark:text-slate-200 border border-slate-400/40",
                          idx === 2 && "bg-amber-700/20 text-amber-800 dark:text-amber-500 border border-amber-700/40",
                          idx > 2 && "bg-muted text-muted-foreground border border-border/60"
                        )}
                      >
                        {idx + 1}
                      </span>
                      <span
                        className="font-bold text-sm text-foreground tracking-tight truncate leading-normal"
                        title={item.productName}
                      >
                        {item.productName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-muted-foreground hidden sm:inline-block text-xs font-medium">
                        {item.ordersCount} طلب
                      </span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(item.revenue)}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono font-bold text-xs bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/25 shadow-2xs">
                        {item.quantity} {t("item")}
                      </span>
                    </div>
                  </div>

                  {/* Sleek Gradient Progress Track */}
                  <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden relative">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out",
                        idx === 0
                          ? "bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500 shadow-xs"
                          : idx === 1
                          ? "bg-gradient-to-r from-violet-500 to-indigo-400"
                          : "bg-gradient-to-r from-violet-500/80 to-indigo-400/80"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Upward Column Chart with Zero RTL SVG Overlap */
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topItems.map((item, idx) => ({
                  ...item,
                  rankLabel: `#${idx + 1}`,
                  shortName: item.productName.length > 12 ? `${item.productName.slice(0, 10)}…` : item.productName,
                }))}
                layout="horizontal"
                margin={{ top: 15, right: 15, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />

                <XAxis
                  dataKey="shortName"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  interval={0}
                />

                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />

                <Tooltip
                  content={<CustomTooltip formatCurrency={formatCurrency} t={t} />}
                  cursor={{ fill: "var(--muted)", opacity: 0.15 }}
                />

                <Bar
                  dataKey="quantity"
                  name={t("quantity")}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                >
                  {topItems.map((_, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={idx === 0 ? "#7c3aed" : idx === 1 ? "#8b5cf6" : idx === 2 ? "#a78bfa" : "#c4b5fd"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
