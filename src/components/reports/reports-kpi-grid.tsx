"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  TrendingUp,
  Wallet,
  TrendingDown,
  ShoppingBag,
  CreditCard,
  Banknote,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SalesSummary, SalesComparison } from "@/lib/reports";
import { cn } from "@/lib/utils";

interface ReportsKpiGridProps {
  summary: SalesSummary;
  comparison?: SalesComparison;
  formatCurrency: (amount: number) => string;
}

function DeltaBadge({ delta }: { delta?: number }) {
  if (delta === undefined || isNaN(delta)) return null;
  const isPositive = delta > 0;
  const isZero = delta === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full",
        isPositive
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : isZero
          ? "bg-muted text-muted-foreground"
          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
      )}
      dir="ltr"
    >
      {isPositive ? "↑ +" : isZero ? "→ " : "↓ "}
      {delta.toFixed(1)}%
    </span>
  );
}

export function ReportsKpiGrid({ summary, comparison, formatCurrency }: ReportsKpiGridProps) {
  const t = useTranslations("reports.kpis");

  // Profit Margin %
  const profitMargin = summary.netRevenue > 0
    ? (summary.netProfit / summary.netRevenue) * 100
    : 0;

  // Expense to Revenue %
  const expenseRatio = summary.netRevenue > 0
    ? (summary.totalExpenses / summary.netRevenue) * 100
    : 0;

  // Cancellation %
  const cancellationRate = summary.totalOrders > 0
    ? (summary.cancelledOrders / summary.totalOrders) * 100
    : 0;

  // Payment totals & percentages
  const electronicTotal = summary.visaTotal + summary.onlineTotal;
  const grandPaymentTotal = summary.cashTotal + electronicTotal || 1;
  const cashPct = Math.round((summary.cashTotal / grandPaymentTotal) * 100);
  const visaPct = Math.round((summary.visaTotal / grandPaymentTotal) * 100);
  const onlinePct = Math.round((summary.onlineTotal / grandPaymentTotal) * 100);
  const electronicPct = visaPct + onlinePct;

  return (
    <div className="space-y-4">
      {/* 4 Core Financial & Volume KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Net Revenue */}
        <Card className="border-border/80 bg-card/90 shadow-xs relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="absolute top-0 start-0 w-1.5 h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("netRevenue")}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <DeltaBadge delta={comparison?.netRevenueDeltaPct} />
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                <TrendingUp className="size-4.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums tracking-tight">
              {formatCurrency(summary.netRevenue)}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              <span>{t("grossSales")}:</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatCurrency(summary.grossSales)}
              </span>
              {summary.totalDiscounts > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  (-{formatCurrency(summary.totalDiscounts)})
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Net Operating Profit & Margin */}
        <Card className="border-border/80 bg-card/90 shadow-xs relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="absolute top-0 start-0 w-1.5 h-full bg-indigo-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("netProfit")}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <DeltaBadge delta={comparison?.netProfitDeltaPct} />
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20">
                <Wallet className="size-4.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={cn(
              "text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight",
              summary.netProfit >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600 dark:text-rose-400"
            )}>
              {formatCurrency(summary.netProfit)}
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50">
              <span className="text-muted-foreground">{t("profitMargin")}:</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 font-semibold gap-1",
                  profitMargin >= 50
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : profitMargin >= 25
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                )}
              >
                {profitMargin >= 50 ? (
                  <CheckCircle2 className="size-3 shrink-0" />
                ) : (
                  <AlertTriangle className="size-3 shrink-0" />
                )}
                {profitMargin.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 3. Operating Expenses */}
        <Card className="border-border/80 bg-card/90 shadow-xs relative overflow-hidden group hover:border-rose-500/40 transition-colors">
          <div className="absolute top-0 start-0 w-1.5 h-full bg-rose-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("totalExpenses")}
            </CardTitle>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20">
              <TrendingDown className="size-4.5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
              {formatCurrency(summary.totalExpenses)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              <span>{t("totalExpensesDesc")}:</span>
              <span className="font-semibold text-foreground tabular-nums">
                {expenseRatio.toFixed(1)}% {t("expenseRatio")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 4. Orders Volume & AOV */}
        <Card className="border-border/80 bg-card/90 shadow-xs relative overflow-hidden group hover:border-sky-500/40 transition-colors">
          <div className="absolute top-0 start-0 w-1.5 h-full bg-sky-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("totalOrders")}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <DeltaBadge delta={comparison?.ordersDeltaPct} />
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 ring-1 ring-sky-500/20">
                <ShoppingBag className="size-4.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums tracking-tight">
                {summary.totalOrders}
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium border-border/80 text-muted-foreground">
                AOV: <span className="text-foreground font-bold ms-1 tabular-nums">{formatCurrency(summary.aov)}</span>
              </Badge>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50">
              <span className="text-muted-foreground">
                {t("deliveredOrders")}: <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">{summary.deliveredOrders}</strong>
              </span>
              {summary.cancelledOrders > 0 ? (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-medium">
                  {summary.cancelledOrders} {t("cancelledOrders")} ({cancellationRate.toFixed(0)}%)
                </Badge>
              ) : (
                <span className="text-muted-foreground text-[10px]">{t("activeOrders")}: {summary.activeOrders}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Payment Methods Distribution Bar & Ratio Card */}
      <Card className="border-border/80 bg-card/80 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              <span className="text-xs sm:text-sm font-bold text-foreground">
                {t("cashVsElectronic")}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Banknote className="size-3.5" />
                {t("cash")}: {cashPct}% ({formatCurrency(summary.cashTotal)})
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                <CreditCard className="size-3.5" />
                {t("electronic")}: {electronicPct}% ({formatCurrency(electronicTotal)})
              </span>
            </div>
          </div>

          {/* Visual Progress Multi-Bar */}
          <div className="h-2.5 w-full rounded-full bg-muted/80 overflow-hidden flex shadow-inner">
            {summary.cashTotal > 0 && (
              <div
                style={{ width: `${cashPct}%` }}
                className="bg-emerald-500 h-full transition-all duration-300 relative group"
                title={`${t("cash")}: ${formatCurrency(summary.cashTotal)} (${cashPct}%)`}
              />
            )}
            {summary.visaTotal > 0 && (
              <div
                style={{ width: `${visaPct}%` }}
                className="bg-sky-500 h-full transition-all duration-300 relative group"
                title={`${t("visa")}: ${formatCurrency(summary.visaTotal)} (${visaPct}%)`}
              />
            )}
            {summary.onlineTotal > 0 && (
              <div
                style={{ width: `${onlinePct}%` }}
                className="bg-purple-500 h-full transition-all duration-300 relative group"
                title={`${t("online")}: ${formatCurrency(summary.onlineTotal)} (${onlinePct}%)`}
              />
            )}
          </div>

          {/* Detailed 3-pill legend */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                <span>{t("cash")}</span>
              </div>
              <span className="font-bold text-foreground tabular-nums">
                {formatCurrency(summary.cashTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 text-xs">
              <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-medium">
                <span className="size-2 rounded-full bg-sky-500 shrink-0" />
                <span>{t("visa")}</span>
              </div>
              <span className="font-bold text-foreground tabular-nums">
                {formatCurrency(summary.visaTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 text-xs">
              <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
                <span className="size-2 rounded-full bg-purple-500 shrink-0" />
                <span>{t("online")}</span>
              </div>
              <span className="font-bold text-foreground tabular-nums">
                {formatCurrency(summary.onlineTotal)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
