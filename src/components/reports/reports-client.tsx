"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Calendar,
  Filter,
  TrendingUp,
  DollarSign,
  Receipt,
  Truck,
  ShoppingBag,
  RefreshCw,
  Award,
  Layers,
  Banknote,
  CreditCard,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformLogo } from "@/components/ui/platform-logo";
import { getBrandToken } from "@/lib/visualTokens";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import type { ReportsPayload } from "@/services/reports";

interface BrandItem {
  id: string;
  name: string;
}

interface PlatformItem {
  id: string;
  name: string;
}

interface ReportsClientProps {
  initialData: ReportsPayload;
  brands: BrandItem[];
  platforms: PlatformItem[];
  userRole: Role;
}

type TabType = "daily" | "matrix" | "drivers" | "products";

function formatIso(d: Date): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function ReportsClient({
  initialData,
  brands,
  platforms,
}: ReportsClientProps) {
  const t = useTranslations("reports");
  const [data, setData] = React.useState<ReportsPayload>(initialData);
  const [startDate, setStartDate] = React.useState(initialData.startDate);
  const [endDate, setEndDate] = React.useState(initialData.endDate);
  const [selectedBrand, setSelectedBrand] = React.useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabType>("daily");

  const formatCurrency = (val: number) => {
    return `${Number(val || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${t("currency")}`;
  };

  const fetchReports = async (
    start = startDate,
    end = endDate,
    brand = selectedBrand,
    platform = selectedPlatform
  ) => {
    if (start > end) {
      toast.error("تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (start) params.set("startDate", start);
      if (end) params.set("endDate", end);
      if (brand) params.set("brandId", brand);
      if (platform) params.set("platformId", platform);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch reports");
      }
      const json: ReportsPayload = await res.json();
      setData(json);
      toast.success("تم تحديث بيانات التقارير بنجاح");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تحميل التقارير");
    } finally {
      setLoading(false);
    }
  };

  const applyQuickRange = (
    type: "today" | "yesterday" | "last7Days" | "thisMonth" | "lastMonth"
  ) => {
    const now = new Date();
    let s = new Date();
    let e = new Date();

    if (type === "today") {
      s = now;
      e = now;
    } else if (type === "yesterday") {
      s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      e = s;
    } else if (type === "last7Days") {
      s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      e = now;
    } else if (type === "thisMonth") {
      s = new Date(now.getFullYear(), now.getMonth(), 1);
      e = now;
    } else if (type === "lastMonth") {
      s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      e = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    const startIso = formatIso(s);
    const endIso = formatIso(e);
    setStartDate(startIso);
    setEndDate(endIso);
    fetchReports(startIso, endIso, selectedBrand, selectedPlatform);
  };

  const { summary } = data;
  const paymentTotal = summary.cashTotal + summary.visaTotal + summary.onlineTotal;
  const cashPct = paymentTotal > 0 ? Math.round((summary.cashTotal / paymentTotal) * 100) : 0;
  const visaPct = paymentTotal > 0 ? Math.round((summary.visaTotal / paymentTotal) * 100) : 0;
  const onlinePct = paymentTotal > 0 ? Math.round((summary.onlineTotal / paymentTotal) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-[1440px] flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {t("title")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge variant="outline" className="h-10 px-3 font-mono text-xs text-muted-foreground border-border/70">
            <Calendar className="size-3.5 me-1.5 opacity-70" />
            <span dir="ltr">{data.startDate}</span>
            <span className="mx-1.5">→</span>
            <span dir="ltr">{data.endDate}</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReports()}
            disabled={loading}
            className="h-10 px-3.5 gap-2"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin text-primary")} />
            <span>{loading ? t("filters.loading") : t("filters.refresh")}</span>
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border-border/70 shadow-xs">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/40">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Filter className="size-4 text-primary" />
              <span>{t("filters.title")}</span>
            </CardTitle>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyQuickRange("today")}
                className="h-7 text-xs px-2.5 rounded-full"
              >
                {t("filters.quick.today")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyQuickRange("yesterday")}
                className="h-7 text-xs px-2.5 rounded-full"
              >
                {t("filters.quick.yesterday")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyQuickRange("last7Days")}
                className="h-7 text-xs px-2.5 rounded-full"
              >
                {t("filters.quick.last7Days")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyQuickRange("thisMonth")}
                className="h-7 text-xs px-2.5 rounded-full"
              >
                {t("filters.quick.thisMonth")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyQuickRange("lastMonth")}
                className="h-7 text-xs px-2.5 rounded-full"
              >
                {t("filters.quick.lastMonth")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchReports();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {t("filters.startDate")}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {t("filters.endDate")}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {t("filters.brand")}
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">{t("filters.allBrands")}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {t("filters.platform")}
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">{t("filters.allPlatforms")}</option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                disabled={loading}
                className="h-10 w-full gap-2 font-medium"
              >
                <Filter className="size-4" />
                <span>{t("filters.apply")}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Net Revenue */}
        <Card className="border-border/70 shadow-xs relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-card">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("kpis.netRevenue")}
              </span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <DollarSign className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {formatCurrency(summary.netRevenue)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("kpis.netRevenueDesc")}
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Net Profit */}
        <Card className="border-border/70 shadow-xs relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-card to-card">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("kpis.netProfit")}
              </span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className={cn(
              "text-2xl font-bold font-mono tabular-nums",
              summary.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
              {formatCurrency(summary.netProfit)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("kpis.netProfitDesc")}
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Total Expenses */}
        <Card className="border-border/70 shadow-xs relative overflow-hidden bg-gradient-to-br from-rose-500/5 via-card to-card">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("kpis.totalExpenses")}
              </span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Receipt className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
              {formatCurrency(summary.totalExpenses)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("kpis.totalExpensesDesc")}
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Orders & AOV */}
        <Card className="border-border/70 shadow-xs relative overflow-hidden bg-gradient-to-br from-blue-500/5 via-card to-card">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("kpis.totalOrders")} & AOV
              </span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ShoppingBag className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
                {summary.totalOrders}
              </span>
              <span className="text-xs font-mono font-semibold text-muted-foreground">
                AOV: {formatCurrency(summary.aov)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px]">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {summary.deliveredOrders} {t("kpis.deliveredOrders")}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {summary.cancelledOrders} {t("kpis.cancelledOrders")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics Bar: Discounts, Delivery Fees, and Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Metric A: Gross Sales & Discounts Breakdown */}
        <Card className="border-border/70 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              تفاصيل حركة المبيعات والخصومات
            </span>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{t("kpis.grossSales")}:</span>
                <span className="font-mono font-bold">{formatCurrency(summary.grossSales)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{t("kpis.discounts")}:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  - {formatCurrency(summary.totalDiscounts)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-border/40 pt-2">
                <span className="text-muted-foreground">{t("kpis.deliveryFees")}:</span>
                <span className="font-mono font-bold text-primary">
                  + {formatCurrency(summary.totalDeliveryFees)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Metric B: Payment Method Distribution */}
        <Card className="border-border/70 shadow-xs p-4 sm:p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t("kpis.paymentBreakdown")}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                إجمالي الدفع: {formatCurrency(paymentTotal)}
              </span>
            </div>

            <div className="h-3.5 w-full rounded-full bg-muted overflow-hidden flex mb-3">
              <div
                style={{ width: `${cashPct}%` }}
                className="bg-emerald-500 transition-all"
                title={`Cash: ${cashPct}%`}
              />
              <div
                style={{ width: `${visaPct}%` }}
                className="bg-indigo-500 transition-all"
                title={`Visa: ${visaPct}%`}
              />
              <div
                style={{ width: `${onlinePct}%` }}
                className="bg-sky-500 transition-all"
                title={`Online: ${onlinePct}%`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
                <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">
                  <Banknote className="size-3.5" />
                  <span>{t("kpis.cash")}</span>
                </div>
                <div className="font-mono font-bold">{formatCurrency(summary.cashTotal)}</div>
                <div className="text-[10px] text-muted-foreground font-mono">({cashPct}%)</div>
              </div>

              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-2">
                <div className="flex items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold mb-0.5">
                  <CreditCard className="size-3.5" />
                  <span>{t("kpis.visa")}</span>
                </div>
                <div className="font-mono font-bold">{formatCurrency(summary.visaTotal)}</div>
                <div className="text-[10px] text-muted-foreground font-mono">({visaPct}%)</div>
              </div>

              <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-2">
                <div className="flex items-center justify-center gap-1 text-sky-600 dark:text-sky-400 font-semibold mb-0.5">
                  <Globe className="size-3.5" />
                  <span>{t("kpis.online")}</span>
                </div>
                <div className="font-mono font-bold">{formatCurrency(summary.onlineTotal)}</div>
                <div className="text-[10px] text-muted-foreground font-mono">({onlinePct}%)</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs Switcher for Tables */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/40 pb-2 overflow-x-auto">
          <Button
            type="button"
            variant={activeTab === "daily" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("daily")}
            className="h-10 rounded-lg gap-2"
          >
            <Calendar className="size-4" />
            <span>{t("tabs.daily")}</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono">
              {data.dailyBreakdown.length}
            </Badge>
          </Button>

          <Button
            type="button"
            variant={activeTab === "matrix" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("matrix")}
            className="h-10 rounded-lg gap-2"
          >
            <Layers className="size-4" />
            <span>{t("tabs.matrix")}</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono">
              {data.platformBrand.length}
            </Badge>
          </Button>

          <Button
            type="button"
            variant={activeTab === "drivers" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("drivers")}
            className="h-10 rounded-lg gap-2"
          >
            <Truck className="size-4" />
            <span>{t("tabs.drivers")}</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono">
              {data.driverCash.length}
            </Badge>
          </Button>

          <Button
            type="button"
            variant={activeTab === "products" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("products")}
            className="h-10 rounded-lg gap-2"
          >
            <Award className="size-4" />
            <span>{t("tabs.products")}</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono">
              {data.topProducts.length}
            </Badge>
          </Button>
        </div>

        {/* Tab 1: Daily Breakdown Table */}
        {activeTab === "daily" && (
          <Card className="border-border/70 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                    <th className="p-3 text-start">{t("tables.daily.date")}</th>
                    <th className="p-3 text-center">{t("tables.daily.totalOrders")}</th>
                    <th className="p-3 text-center">{t("tables.daily.delivered")}</th>
                    <th className="p-3 text-center">{t("tables.daily.cancelled")}</th>
                    <th className="p-3 text-end">{t("tables.daily.sales")}</th>
                    <th className="p-3 text-end">{t("tables.daily.deliveryFees")}</th>
                    <th className="p-3 text-end">{t("tables.daily.expenses")}</th>
                    <th className="p-3 text-end font-bold text-foreground">{t("tables.daily.net")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {data.dailyBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        {t("tables.daily.empty")}
                      </td>
                    </tr>
                  ) : (
                    data.dailyBreakdown.map((row) => (
                      <tr key={row.date} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono font-medium">{row.date}</td>
                        <td className="p-3 text-center font-mono">{row.orders}</td>
                        <td className="p-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {row.delivered}
                        </td>
                        <td className="p-3 text-center font-mono text-rose-600 dark:text-rose-400 font-semibold">
                          {row.cancelled}
                        </td>
                        <td className="p-3 text-end font-mono font-semibold">
                          {formatCurrency(row.sales)}
                        </td>
                        <td className="p-3 text-end font-mono text-muted-foreground">
                          {formatCurrency(row.deliveryFees)}
                        </td>
                        <td className="p-3 text-end font-mono text-rose-600 dark:text-rose-400">
                          {formatCurrency(row.expenses)}
                        </td>
                        <td className={cn(
                          "p-3 text-end font-mono font-bold",
                          row.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        )}>
                          {formatCurrency(row.net)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 2: Platform × Brand Matrix */}
        {activeTab === "matrix" && (
          <Card className="border-border/70 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                    <th className="p-3 text-start">{t("tables.matrix.platform")}</th>
                    <th className="p-3 text-start">{t("tables.matrix.brand")}</th>
                    <th className="p-3 text-center">{t("tables.matrix.orders")}</th>
                    <th className="p-3 text-end">{t("tables.matrix.sales")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {data.platformBrand.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        {t("tables.matrix.empty")}
                      </td>
                    </tr>
                  ) : (
                    data.platformBrand.map((row, idx) => {
                      const brandToken = getBrandToken(row.brandName);
                      return (
                        <tr key={`${row.platformName}-${row.brandName}-${idx}`} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <PlatformLogo platformName={row.platformName} size="xs" />
                              <span className="font-semibold">{row.platformName}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold opacity-80">{brandToken.kanji}</span>
                              <span className="font-medium">{row.brandName}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono font-bold">{row.orders}</td>
                          <td className="p-3 text-end font-mono font-bold text-foreground">
                            {formatCurrency(row.sales)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 3: Courier Cash Collection */}
        {activeTab === "drivers" && (
          <Card className="border-border/70 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                    <th className="p-3 text-start">{t("tables.drivers.driver")}</th>
                    <th className="p-3 text-center">{t("tables.drivers.type")}</th>
                    <th className="p-3 text-center">{t("tables.drivers.totalOrders")}</th>
                    <th className="p-3 text-center">{t("tables.drivers.cashOrders")}</th>
                    <th className="p-3 text-end font-bold">{t("tables.drivers.cashCollected")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {data.driverCash.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        {t("tables.drivers.empty")}
                      </td>
                    </tr>
                  ) : (
                    data.driverCash.map((row, idx) => (
                      <tr key={row.driverId || `no-driver-${idx}`} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-semibold">
                          {row.driverName || t("tables.drivers.noDriver")}
                        </td>
                        <td className="p-3 text-center">
                          {row.driverType ? (
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {row.driverType}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono">{row.totalOrders}</td>
                        <td className="p-3 text-center font-mono font-bold">{row.cashOrders}</td>
                        <td className="p-3 text-end font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(row.cashCollected)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 4: Top 10 Products */}
        {activeTab === "products" && (
          <Card className="border-border/70 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                    <th className="p-3 text-center w-12">{t("tables.products.rank")}</th>
                    <th className="p-3 text-start">{t("tables.products.product")}</th>
                    <th className="p-3 text-center">{t("tables.products.quantity")}</th>
                    <th className="p-3 text-center">{t("tables.products.ordersCount")}</th>
                    <th className="p-3 text-end">{t("tables.products.revenue")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {data.topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        {t("tables.products.empty")}
                      </td>
                    </tr>
                  ) : (
                    data.topProducts.map((p, idx) => (
                      <tr key={p.productId} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-center">
                          <span className={cn(
                            "inline-flex size-6 items-center justify-center rounded-full font-mono text-xs font-bold",
                            idx === 0 ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40" :
                            idx === 1 ? "bg-slate-500/20 text-slate-600 dark:text-slate-300 border border-slate-500/40" :
                            idx === 2 ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/40" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-foreground">{p.productName}</td>
                        <td className="p-3 text-center font-mono font-bold text-primary">{p.quantity}</td>
                        <td className="p-3 text-center font-mono text-muted-foreground">{p.ordersCount}</td>
                        <td className="p-3 text-end font-mono font-bold text-foreground">
                          {formatCurrency(p.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
