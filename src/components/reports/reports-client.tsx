"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Flame,
  Globe,
  CreditCard,
  Users,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import type {
  ReportsPayload,
  PeakHoursPayload,
  EmployeesPayload,
} from "@/services/reports";
import { ReportsFilterBar, type ReportsFilterState } from "./reports-filter-bar";
import { OverviewTab } from "./tabs/overview-tab";
import { SalesTab } from "./tabs/sales-tab";
import { ProductsTab } from "./tabs/products-tab";
import { PeakHoursTab } from "./tabs/peak-hours-tab";
import { OrderSourcesTab } from "./tabs/order-sources-tab";
import { PaymentTab } from "./tabs/payment-tab";
import { EmployeesTab } from "./tabs/employees-tab";

type TabId =
  | "overview"
  | "sales"
  | "products"
  | "peak-hours"
  | "order-sources"
  | "payment"
  | "employees";

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

const TABS: { id: TabId; icon: React.ElementType; key: string }[] = [
  { id: "overview", icon: LayoutDashboard, key: "tabs.overview" },
  { id: "sales", icon: TrendingUp, key: "tabs.sales" },
  { id: "products", icon: ShoppingBag, key: "tabs.products" },
  { id: "peak-hours", icon: Flame, key: "tabs.peakHours" },
  { id: "order-sources", icon: Globe, key: "tabs.orderSources" },
  { id: "payment", icon: CreditCard, key: "tabs.payment" },
  { id: "employees", icon: Users, key: "tabs.employees" },
];

export function ReportsClient({
  initialData,
  brands,
  platforms,
}: ReportsClientProps) {
  const t = useTranslations("reports");

  const [mainData, setMainData] = React.useState<ReportsPayload>(initialData);
  const [peakData, setPeakData] = React.useState<PeakHoursPayload | null>(null);
  const [empData, setEmpData] = React.useState<EmployeesPayload | null>(null);

  const [filter, setFilter] = React.useState<ReportsFilterState>({
    startDate: initialData.startDate,
    endDate: initialData.endDate,
    brandId: "",
    platformId: "",
  });

  const [activeTab, setActiveTab] = React.useState<TabId>("overview");
  const [loading, setLoading] = React.useState(false);

  const formatCurrency = (val: number) =>
    `${Number(val || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${t("currency")}`;

  const buildQs = (f: ReportsFilterState) => {
    const p = new URLSearchParams();
    if (f.startDate) p.set("startDate", f.startDate);
    if (f.endDate) p.set("endDate", f.endDate);
    if (f.brandId) p.set("brandId", f.brandId);
    if (f.platformId) p.set("platformId", f.platformId);
    return p.toString();
  };

  const fetchMain = async (f: ReportsFilterState = filter) => {
    if (f.startDate > f.endDate) {
      toast.error(t("errors.invalidDateRange"));
      return;
    }
    setLoading(true);
    // Invalidate lazy data on filter change
    setPeakData(null);
    setEmpData(null);

    try {
      const res = await fetch(`/api/reports?${buildQs(f)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch reports");
      }
      const data: ReportsPayload = await res.json();
      setMainData(data);
      toast.success(t("refreshSuccess"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  const fetchPeak = async (f: ReportsFilterState = filter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/peak-hours?${buildQs(f)}`);
      if (!res.ok) throw new Error();
      const data: PeakHoursPayload = await res.json();
      setPeakData(data);
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  const fetchEmp = async (f: ReportsFilterState = filter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/employees?${buildQs(f)}`);
      if (!res.ok) throw new Error();
      const data: EmployeesPayload = await res.json();
      setEmpData(data);
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === "peak-hours" && !peakData) {
      fetchPeak();
    }
    if (tab === "employees" && !empData) {
      fetchEmp();
    }
  };

  // Export CSV handler for Excel
  const handleExportCsv = () => {
    try {
      let csvContent = "";
      const filename = `report_${activeTab}_${filter.startDate}_to_${filter.endDate}.csv`;

      if (activeTab === "sales") {
        csvContent =
          "التاريخ,الطلبات,المسلمة,الملغاة,المبيعات,رسوم التوصيل,المصروفات,الصافي\n" +
          mainData.dailyBreakdown
            .map(
              (r) =>
                `"${r.date}",${r.orders},${r.delivered},${r.cancelled},${r.sales},${r.deliveryFees},${r.expenses},${r.net}`
            )
            .join("\n");
      } else if (activeTab === "products") {
        csvContent =
          "الترتيب,المنتج,الكمية المباعة,عدد الطلبات,إجمالي الإيراد\n" +
          mainData.topProducts
            .map(
              (p, idx) =>
                `${idx + 1},"${p.productName.replace(/"/g, '""')}",${p.quantity},${p.ordersCount},${p.revenue}`
            )
            .join("\n");
      } else if (activeTab === "order-sources") {
        csvContent =
          "المنصة,البراند,عدد الطلبات,إجمالي المبيعات\n" +
          mainData.platformBrand
            .map(
              (pb) =>
                `"${pb.platformName}","${pb.brandName}",${pb.orders},${pb.sales}`
            )
            .join("\n");
      } else if (activeTab === "payment") {
        csvContent =
          "طريقة الدفع,الإيراد المحصل\n" +
          `"كاش",${mainData.summary.cashTotal}\n` +
          `"فيزا",${mainData.summary.visaTotal}\n` +
          `"أونلاين",${mainData.summary.onlineTotal}\n` +
          `"الإجمالي",${mainData.summary.netRevenue}\n`;
      } else if (activeTab === "employees" && empData) {
        csvContent =
          "الكاشير,إجمالي الطلبات,الملغاة,الإيراد,متوسط الطلب,خصومات معتمدة\n" +
          empData.employees
            .map(
              (e) =>
                `"${e.cashierName}",${e.totalOrders},${e.cancelledOrders},${e.totalRevenue},${e.avgOrderValue},${e.discountsApproved}`
            )
            .join("\n");
      } else {
        // Overview default export
        csvContent =
          "البند,القيمة\n" +
          `"إجمالي المبيعات الخام",${mainData.summary.grossSales}\n` +
          `"إجمالي الخصومات",${mainData.summary.totalDiscounts}\n` +
          `"رسوم التوصيل",${mainData.summary.totalDeliveryFees}\n` +
          `"صافي الإيرادات",${mainData.summary.netRevenue}\n` +
          `"إجمالي المصروفات",${mainData.summary.totalExpenses}\n` +
          `"صافي الأرباح",${mainData.summary.netProfit}\n` +
          `"إجمالي الطلبات",${mainData.summary.totalOrders}\n` +
          `"الطلبات المسلمة",${mainData.summary.deliveredOrders}\n` +
          `"الطلبات الملغاة",${mainData.summary.cancelledOrders}\n` +
          `"متوسط قيمة الطلب",${mainData.summary.aov}\n`;
      }

      // Prepend UTF-8 BOM so Arabic displays correctly in Microsoft Excel
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t("exportSuccess"));
    } catch {
      toast.error(t("errors.generic"));
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border/40 pb-5 print:border-b-0 print:pb-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs print:hidden">
          <BarChart3 className="size-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-xs text-muted-foreground print:hidden">
            {t("subtitle")}
          </p>
          <p className="text-xs text-muted-foreground hidden print:block">
            {filter.startDate} → {filter.endDate}
          </p>
        </div>
      </div>

      {/* Shared Filter */}
      <ReportsFilterBar
        brands={brands}
        platforms={platforms}
        value={filter}
        loading={loading}
        onChange={setFilter}
        onApply={() => fetchMain()}
        onExportCsv={handleExportCsv}
        onPrintPdf={handlePrintPdf}
      />

      {/* Tab Navigation */}
      <div className="flex items-center gap-0.5 border-b border-border/40 overflow-x-auto scrollbar-none print:hidden">
        {TABS.map(({ id, icon: Icon, key }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap shrink-0",
              activeTab === id
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="size-4" />
            <span>{t(key)}</span>
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <OverviewTab data={mainData} formatCurrency={formatCurrency} />
        )}
        {activeTab === "sales" && (
          <SalesTab data={mainData} formatCurrency={formatCurrency} />
        )}
        {activeTab === "products" && (
          <ProductsTab data={mainData} formatCurrency={formatCurrency} />
        )}
        {activeTab === "peak-hours" && (
          <PeakHoursTab
            data={peakData}
            loading={loading}
            formatCurrency={formatCurrency}
          />
        )}
        {activeTab === "order-sources" && (
          <OrderSourcesTab data={mainData} formatCurrency={formatCurrency} />
        )}
        {activeTab === "payment" && (
          <PaymentTab data={mainData} formatCurrency={formatCurrency} />
        )}
        {activeTab === "employees" && (
          <EmployeesTab
            data={empData}
            loading={loading}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </div>
  );
}
