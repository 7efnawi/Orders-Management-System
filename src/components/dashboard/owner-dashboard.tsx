"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ChefHat,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Truck,
  ArrowRight,
  ArrowLeft,
  Crown,
  ShoppingBag,
  Store,
  Users,
  BarChart3,
  Percent,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformLogo } from "@/components/ui/platform-logo";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { getBrandToken, getPlatformToken } from "@/lib/visualTokens";
import { OrderStatus, Role } from "@/types/enums";
import { cn } from "@/lib/utils";
import type { DashboardOverview } from "@/services/orders";

interface OwnerDashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  overview: DashboardOverview;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.NEW]: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  [OrderStatus.CONFIRMED]: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  [OrderStatus.PREPARING]: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  [OrderStatus.READY]: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  [OrderStatus.OUT_FOR_DELIVERY]: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  [OrderStatus.DELIVERED]: "bg-green-600/15 text-green-700 dark:text-green-300 border-green-600/30 font-semibold",
  [OrderStatus.CANCELLED]: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};

export function OwnerDashboard({ user, overview }: OwnerDashboardProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const tRoles = useTranslations("roles");
  const tOrders = useTranslations("orders");

  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat(
      locale === "ar" ? "ar-EG" : "en-US",
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    ).format(amount);
    return `${formatted} ${tOrders("currency")}`;
  };

  const formatTime = (date: Date | string) => {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const { activeShift, shiftSummary, recentOrders, brandCounts, platformCounts, ownerInsights } = overview;

  // 1. Delta calculation helpers (Today vs Yesterday)
  const todayRev = ownerInsights?.todayRevenue ?? shiftSummary.totalRevenue;
  const yesterdayRev = ownerInsights?.yesterdayRevenue ?? 0;
  const revDelta = yesterdayRev > 0 ? ((todayRev - yesterdayRev) / yesterdayRev) * 100 : null;

  const todayOrders = ownerInsights?.todayOrders ?? shiftSummary.totalOrders;
  const yesterdayOrders = ownerInsights?.yesterdayOrders ?? 0;
  const ordersDelta = yesterdayOrders > 0 ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100 : null;

  const todayCancelCount = ownerInsights?.todayCancelled ?? shiftSummary.cancelledOrders;
  const todayCancelRate = todayOrders > 0 ? (todayCancelCount / todayOrders) * 100 : 0;
  const yesterdayCancelCount = ownerInsights?.yesterdayCancelled ?? 0;
  const yesterdayCancelRate = yesterdayOrders > 0 ? (yesterdayCancelCount / yesterdayOrders) * 100 : 0;
  const cancelRateDelta = yesterdayOrders > 0 ? todayCancelRate - yesterdayCancelRate : null;

  const activeUsers = ownerInsights?.activeUsersCount ?? 0;
  const activeDrivers = ownerInsights?.activeDriversCount ?? 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
      {/* ────────────────── 1. Hero & Executive Command Bar ────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/90 to-muted/40 p-6 sm:p-8 shadow-xs backdrop-blur-md">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {t("greeting", { name: user.name })}
              </h1>
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-xs font-semibold gap-1.5 shadow-2xs"
              >
                <Crown className="size-3.5" />
                <span>{tRoles(user.role)}</span>
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              {t("owner.subtitle")}
            </p>

            {/* Shift Context */}
            <div className="flex items-center gap-2 mt-1 text-xs font-medium">
              {activeShift ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                  </span>
                  <span>
                    الشيفت الجاري مفتوح بواسطة: {activeShift.cashierName} ({formatTime(activeShift.openedAt)})
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-muted-foreground shadow-2xs">
                  <span>{t("noActiveShift")}</span>
                </span>
              )}
            </div>
          </div>

          {/* Executive Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <Button asChild size="lg" className="h-12 px-6 font-bold shadow-sm gap-2">
              <Link href="/reports">
                <BarChart3 className="size-5 stroke-[2.5]" />
                <span>التقارير المتقدمة</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-5 font-semibold gap-2 border-border/80">
              <Link href="/users">
                <Users className="size-4.5 text-muted-foreground" />
                <span>إدارة المستخدمين</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="h-12 px-4 font-medium text-muted-foreground hover:text-foreground gap-2">
              <Link href="/orders">
                <ChefHat className="size-4.5" />
                <span>{t("liveOrdersBtn")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ────────────────── 2. Owner Delta KPIs (Today vs Yesterday) ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Net Revenue with Delta */}
        <Card className="relative overflow-hidden border-border/70 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("owner.kpi.todayRevenue")}
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-foreground truncate">
                {formatCurrency(todayRev)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("owner.kpi.todayRevenueDesc")}
              </p>
            </div>

            {/* Delta vs Yesterday */}
            <div className="flex items-center gap-1.5 text-xs font-semibold pt-1 border-t border-border/40">
              {revDelta !== null ? (
                <>
                  {revDelta > 0 ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
                      <TrendingUp className="size-3.5" />
                      +{revDelta.toFixed(1)}%
                    </span>
                  ) : revDelta < 0 ? (
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-mono">
                      <TrendingDown className="size-3.5" />
                      {revDelta.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground font-mono">
                      <Minus className="size-3.5" />
                      0.0%
                    </span>
                  )}
                  <span className="text-muted-foreground text-[11px] font-normal">
                    {t("owner.vsYesterday")} ({formatCurrency(yesterdayRev)})
                  </span>
                </>
              ) : (
                <span className="text-[11px] text-muted-foreground font-normal">
                  {yesterdayRev > 0 ? `أمس: ${formatCurrency(yesterdayRev)}` : t("owner.noYesterdayData")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Order Volume with Delta */}
        <Card className="relative overflow-hidden border-border/70 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("owner.kpi.todayOrders")}
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ChefHat className="size-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black tabular-nums tracking-tight text-foreground">
                {todayOrders}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("owner.kpi.todayOrdersDesc")}
              </p>
            </div>

            {/* Delta vs Yesterday */}
            <div className="flex items-center gap-1.5 text-xs font-semibold pt-1 border-t border-border/40">
              {ordersDelta !== null ? (
                <>
                  {ordersDelta > 0 ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
                      <TrendingUp className="size-3.5" />
                      +{ordersDelta.toFixed(1)}%
                    </span>
                  ) : ordersDelta < 0 ? (
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-mono">
                      <TrendingDown className="size-3.5" />
                      {ordersDelta.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground font-mono">
                      <Minus className="size-3.5" />
                      0.0%
                    </span>
                  )}
                  <span className="text-muted-foreground text-[11px] font-normal">
                    {t("owner.vsYesterday")} ({yesterdayOrders})
                  </span>
                </>
              ) : (
                <span className="text-[11px] text-muted-foreground font-normal">
                  {yesterdayOrders > 0 ? `أمس: ${yesterdayOrders} طلب` : t("owner.noYesterdayData")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Rate with Delta */}
        <Card className="relative overflow-hidden border-border/70 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("owner.kpi.cancelRate")}
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Percent className="size-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black tabular-nums tracking-tight text-foreground">
                {todayCancelRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {todayCancelCount} طلبات ملغاة اليوم
              </p>
            </div>

            {/* Delta vs Yesterday (Lower is better!) */}
            <div className="flex items-center gap-1.5 text-xs font-semibold pt-1 border-t border-border/40">
              {cancelRateDelta !== null ? (
                <>
                  {cancelRateDelta < 0 ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
                      <TrendingDown className="size-3.5" />
                      {cancelRateDelta.toFixed(1)}% (تحسن)
                    </span>
                  ) : cancelRateDelta > 0 ? (
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-mono">
                      <TrendingUp className="size-3.5" />
                      +{cancelRateDelta.toFixed(1)}% (ارتفاع)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground font-mono">
                      <Minus className="size-3.5" />
                      0.0%
                    </span>
                  )}
                  <span className="text-muted-foreground text-[11px] font-normal">
                    {t("owner.vsYesterday")} ({yesterdayCancelRate.toFixed(1)}%)
                  </span>
                </>
              ) : (
                <span className="text-[11px] text-muted-foreground font-normal">
                  {yesterdayOrders > 0 ? `أمس: ${yesterdayCancelRate.toFixed(1)}%` : t("owner.noYesterdayData")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Team & Fleet Capacity */}
        <Card className="relative overflow-hidden border-border/70 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("owner.kpi.activeTeam")}
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Users className="size-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black tabular-nums tracking-tight text-foreground">
                {activeUsers + activeDrivers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("owner.kpi.activeTeamDesc")}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-medium pt-1 border-t border-border/40 text-muted-foreground">
              <span>{activeUsers} {t("owner.activeUsers")}</span>
              <span>•</span>
              <span>{activeDrivers} {t("owner.activeDrivers")}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ────────────────── 3. Main Executive Grid ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Activity Feed + Revenue Breakdown (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-4 border-b border-border/40">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">
                  {t("owner.recentOrders")}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  {todayOrders} {t("kpi.totalOrders")} مسجلة اليوم
                </CardDescription>
              </div>

              <Button asChild variant="ghost" size="sm" className="h-8 text-xs gap-1 font-semibold">
                <Link href="/orders">
                  <span>{t("recentOrders.viewAll")}</span>
                  <ArrowIcon className="size-3.5" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              {recentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3 shadow-inner">
                    <ShoppingBag className="size-7 stroke-[1.5]" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("recentOrders.empty")}
                  </h3>
                </div>
              ) : (
                <div className="divide-y divide-border/40 overflow-hidden">
                  {recentOrders.map((order) => {
                    const statusClass = STATUS_COLORS[order.status] || "bg-muted text-muted-foreground";
                    return (
                      <div
                        key={order.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          <div className="flex flex-col min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-sm tracking-tight text-foreground">
                                {order.orderNumber}
                              </span>
                              <PlatformBadge platformName={order.platform.name} size="sm" />
                              <Badge variant="outline" className="text-[10px] py-0 px-2 font-mono">
                                {order.brand.name}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono">
                                {formatTime(order.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground truncate">
                              <span className="font-medium text-foreground">{order.customer.name}</span>
                              <span className="font-mono dir-ltr">{order.customer.phone}</span>
                              {order.driver && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80">
                                  <Truck className="size-3" />
                                  <span>{order.driver.name}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <Badge
                            variant="outline"
                            className={cn("text-[11px] px-2.5 py-0.5 font-semibold rounded-full border", statusClass)}
                          >
                            {tOrders(`statuses.${order.status}`)}
                          </Badge>
                          <div className="text-sm font-bold font-mono tabular-nums text-foreground min-w-[80px] text-left sm:text-right">
                            {formatCurrency(order.totalPrice)}
                          </div>
                          <Button asChild variant="ghost" size="sm" className="size-8 p-0 shrink-0">
                            <Link href="/orders" title={t("recentOrders.action")}>
                              <ArrowIcon className="size-4 text-muted-foreground" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Financial Summary */}
          <Card className="border-border/70 shadow-xs p-5">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Wallet className="size-4 text-primary" />
              <span>ملخص التسويات المالية لليوم</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
                <span className="text-xs text-muted-foreground font-medium block">مبيعات كاش</span>
                <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-foreground">
                  {formatCurrency(shiftSummary.totalCash)}
                </span>
              </div>
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
                <span className="text-xs text-muted-foreground font-medium block">مبيعات فيزا + أونلاين</span>
                <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-foreground">
                  {formatCurrency(shiftSummary.totalVisa + shiftSummary.totalOnline)}
                </span>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                <span className="text-xs text-rose-600 dark:text-rose-400 font-medium block">إجمالي المصروفات</span>
                <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-foreground">
                  {formatCurrency(shiftSummary.totalExpenses)}
                </span>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium block">صافي كاش الخزنة</span>
                <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-foreground">
                  {formatCurrency(shiftSummary.netCash)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Volume Share % & Portfolio Intelligence (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Brand Share % */}
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="p-5 pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Store className="size-4 text-primary" />
                <span>{t("owner.brandShare")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-3">
              {brandCounts.map((b) => {
                const token = getBrandToken(b.name);
                const sharePercent = todayOrders > 0 ? (b.count / todayOrders) * 100 : 0;
                return (
                  <div key={b.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{token.kanji}</span>
                        <span className="font-semibold text-foreground">{b.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-muted-foreground">{b.count} طلب</span>
                        <span className="font-bold text-foreground">{sharePercent.toFixed(1)}%</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", token.bgClass.replace("/10", "/80"))}
                        style={{ width: `${Math.max(sharePercent, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Platform Share % */}
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="p-5 pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShoppingBag className="size-4 text-primary" />
                <span>{t("owner.platformShare")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-3">
              {platformCounts.map((p) => {
                const sharePercent = todayOrders > 0 ? (p.count / todayOrders) * 100 : 0;
                return (
                  <div key={p.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <PlatformLogo platformName={p.name} size="sm" />
                        <span className="font-semibold text-foreground">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-muted-foreground">{p.count} طلب</span>
                        <span className="font-bold text-foreground">{sharePercent.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70 transition-all"
                        style={{ width: `${Math.max(sharePercent, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Executive Administrative Links */}
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="p-5 pb-3 border-b border-border/40">
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                <Crown className="size-4 text-amber-500" />
                <span>إدارة المنظومة</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex flex-col gap-1.5">
              <Link
                href="/reports"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/60 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <BarChart3 className="size-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      التقارير والتحليلات المتقدمة
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">تحليل الأرباح ومسار الإيرادات الشهرية</p>
                  </div>
                </div>
                <ArrowIcon className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>

              <Link
                href="/users"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/60 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    <Users className="size-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      إدارة فريق العمل والمستخدمين
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">تعيين المديرين والكاشيرات والصلاحيات</p>
                  </div>
                </div>
                <ArrowIcon className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>

              <Link
                href="/delivery"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/60 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-8 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                    <Truck className="size-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      أسطول التوصيل والمناطق
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">تكويد المناديب والتغطية الجغرافية</p>
                  </div>
                </div>
                <ArrowIcon className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
