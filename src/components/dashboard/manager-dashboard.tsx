"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Plus,
  ChefHat,
  TrendingUp,
  Wallet,
  Receipt,
  UtensilsCrossed,
  Truck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  ShoppingBag,
  Store,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformLogo } from "@/components/ui/platform-logo";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { getBrandToken, getPlatformToken } from "@/lib/visualTokens";
import { OrderStatus, Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import type { DashboardOverview } from "@/services/orders";

interface ManagerDashboardProps {
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

export function ManagerDashboard({ user, overview }: ManagerDashboardProps) {
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

  const { activeShift, shiftSummary, statusCounts, recentOrders, brandCounts, platformCounts } = overview;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
      {/* ────────────────── 1. Hero & Operations Supervision ────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/90 to-muted/40 p-6 sm:p-8 shadow-xs backdrop-blur-md">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {t("greeting", { name: user.name })}
              </h1>
              <Badge
                variant="outline"
                className="border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 text-xs font-semibold gap-1.5 shadow-2xs"
              >
                <ShieldCheck className="size-3.5" />
                <span>{tRoles(user.role)}</span>
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              {t("manager.subtitle")}
            </p>

            {/* Shift Oversight */}
            <div className="flex items-center gap-2 mt-1 text-xs font-medium">
              {activeShift ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-indigo-600 dark:text-indigo-400 shadow-2xs">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex size-2 rounded-full bg-indigo-500"></span>
                  </span>
                  <span>
                    {t("activeShift")}: {activeShift.cashierName} — {t("shiftStartedAt", { time: formatTime(activeShift.openedAt) })}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-600 dark:text-amber-400 shadow-2xs">
                  <AlertCircle className="size-3.5" />
                  <span>{t("noActiveShift")}</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Supervisor Actions */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <Button asChild size="lg" className="h-12 px-6 font-bold shadow-sm gap-2">
              <Link href="/orders">
                <ChefHat className="size-5 stroke-[2.5]" />
                <span>{t("liveOrdersBtn")}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-5 font-semibold gap-2 border-border/80">
              <Link href="/delivery">
                <Truck className="size-4.5 text-muted-foreground" />
                <span>{t("quickLinks.delivery")}</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="h-12 px-4 font-medium text-muted-foreground hover:text-foreground gap-2">
              <Link href="/menu">
                <Store className="size-4.5" />
                <span>{t("quickLinks.menu")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ────────────────── 2. Manager Operational KPIs ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Pipeline Orders */}
        <Card className="relative overflow-hidden border-border/70 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("manager.kpi.activeOrders")}
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ChefHat className="size-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black tabular-nums tracking-tight text-foreground">
                {shiftSummary.activeOrders}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("manager.kpi.activeOrdersDesc")}
              </p>
            </div>
            <Link
              href="/orders"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 mt-1"
            >
              <span>{t("liveOrdersBtn")}</span>
              <ArrowIcon className="size-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Total Today's Revenue */}
        <Card className="relative overflow-hidden border-border/70 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("manager.kpi.revenue")}
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-foreground truncate">
                {formatCurrency(shiftSummary.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("manager.kpi.revenueDesc")}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mt-1">
              <span>كاش: {formatCurrency(shiftSummary.totalCash)}</span>
              <span>•</span>
              <span>فيزا: {formatCurrency(shiftSummary.totalVisa)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Delivered Today */}
        <Card className="relative overflow-hidden border-border/70 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("manager.kpi.delivered")}
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 className="size-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black tabular-nums tracking-tight text-foreground">
                {shiftSummary.deliveredOrders}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("manager.kpi.deliveredDesc")}
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {t("kpi.totalOrders")}: {shiftSummary.totalOrders}
            </span>
          </CardContent>
        </Card>

        {/* Operating Expenses */}
        <Card className="relative overflow-hidden border-border/70 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("manager.kpi.expenses")}
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Receipt className="size-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-foreground truncate">
                {formatCurrency(shiftSummary.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("manager.kpi.expensesDesc")}
              </p>
            </div>
            <Link
              href="/expenses"
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 mt-1"
            >
              <span>{t("quickLinks.expenses")}</span>
              <ArrowIcon className="size-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ────────────────── 3. Main Dashboard Body ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Orders Feed & Prep Pipeline (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-4 border-b border-border/40">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">
                  {t("manager.recentOrders")}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  {shiftSummary.totalOrders} {t("kpi.totalOrders")}
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

          {/* Kitchen Prep Stages */}
          <Card className="border-border/70 shadow-xs p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UtensilsCrossed className="size-3.5" />
                <span>مراحل تجهيز السوشي الحالية</span>
              </span>
              <Link href="/orders" className="text-xs font-semibold text-primary hover:underline">
                {t("liveOrdersBtn")}
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5">
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold block">{tOrders("statuses.NEW")}</span>
                <span className="text-xl font-bold font-mono tabular-nums text-foreground">{statusCounts.NEW}</span>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold block">{tOrders("statuses.PREPARING")}</span>
                <span className="text-xl font-bold font-mono tabular-nums text-foreground">{statusCounts.PREPARING}</span>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">{tOrders("statuses.READY")}</span>
                <span className="text-xl font-bold font-mono tabular-nums text-foreground">{statusCounts.READY}</span>
              </div>
              <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-2.5">
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block">{tOrders("statuses.OUT_FOR_DELIVERY")}</span>
                <span className="text-xl font-bold font-mono tabular-nums text-foreground">{statusCounts.OUT_FOR_DELIVERY}</span>
              </div>
              <div className="rounded-lg border border-green-600/20 bg-green-600/5 p-2.5 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-green-700 dark:text-green-300 font-semibold block">{tOrders("statuses.DELIVERED")}</span>
                <span className="text-xl font-bold font-mono tabular-nums text-foreground">{statusCounts.DELIVERED}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Brands & Platforms Distribution (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Sushi Brands Performance */}
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="p-5 pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Store className="size-4 text-primary" />
                <span>{t("manager.brandsOverview")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-2.5">
              {brandCounts.map((b) => {
                const token = getBrandToken(b.name);
                return (
                  <div
                    key={b.id}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-lg border transition-colors select-none",
                      token.bgClass,
                      token.borderClass
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-xs">{token.kanji}</span>
                      <span className="text-xs font-semibold truncate">{b.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold tabular-nums opacity-80">{b.count}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Delivery Platforms Performance */}
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="p-5 pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShoppingBag className="size-4 text-primary" />
                <span>{t("manager.platformsOverview")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {platformCounts.map((p) => {
                const token = getPlatformToken(p.name);
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-lg border transition-all select-none hover:shadow-2xs",
                      token.bgClass,
                      token.borderClass
                    )}
                    title={p.name}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PlatformLogo platformName={p.name} size="sm" />
                      <span className={cn("text-xs font-semibold truncate", token.textClass)}>
                        {p.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold tabular-nums px-1.5 py-0.5 rounded bg-background/80 dark:bg-background/60 border border-border/50 shadow-2xs">
                      {p.count}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Management Quick Links */}
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="p-5 pb-3 border-b border-border/40">
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <span>{t("quickLinks.title")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex flex-col gap-1.5">
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
                      {t("quickLinks.delivery")}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{t("quickLinks.deliveryDesc")}</p>
                  </div>
                </div>
                <ArrowIcon className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>

              <Link
                href="/menu"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/60 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Store className="size-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {t("quickLinks.menu")}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{t("quickLinks.menuDesc")}</p>
                  </div>
                </div>
                <ArrowIcon className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>

              <Link
                href="/closing"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/60 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <Wallet className="size-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {t("quickLinks.shiftClosing")}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{t("quickLinks.shiftClosingDesc")}</p>
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
