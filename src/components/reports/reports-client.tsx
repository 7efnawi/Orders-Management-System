"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Calendar,
  Filter,
  Truck,
  RefreshCw,
  Award,
  Layers,
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

import { ReportsKpiGrid } from "./reports-kpi-grid";
import { RevenueTrendChart } from "./charts/revenue-trend-chart";
import { PlatformShareChart } from "./charts/platform-share-chart";
import { BrandPerformanceChart } from "./charts/brand-performance-chart";
import { TopProductsChart } from "./charts/top-products-chart";

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

      {/* Data Analyst KPI Metrics Grid & Payment Distribution Bar */}
      <ReportsKpiGrid summary={summary} formatCurrency={formatCurrency} />

      {/* Visual Analytics Charts — Row 1: Revenue Trends & Platform Market Share */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-7">
          <RevenueTrendChart
            data={data.dailyBreakdown}
            formatCurrency={formatCurrency}
          />
        </div>
        <div className="lg:col-span-5">
          <PlatformShareChart
            data={data.platformBrand}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>

      {/* Visual Analytics Charts — Row 2: Brand Performance & Top Selling Sushi Rolls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-6">
          <BrandPerformanceChart
            data={data.platformBrand}
            formatCurrency={formatCurrency}
          />
        </div>
        <div className="lg:col-span-6">
          <TopProductsChart
            data={data.topProducts}
            formatCurrency={formatCurrency}
          />
        </div>
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
