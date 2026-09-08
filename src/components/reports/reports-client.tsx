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
import { exportReportToExcel, type ExcelExportOptions } from "@/lib/exportExcel";
import { ReportsFilterBar, type ReportsFilterState } from "./reports-filter-bar";
import { OverviewTab } from "./tabs/overview-tab";
import { SalesTab } from "./tabs/sales-tab";
import { ProductsTab } from "./tabs/products-tab";
import { PeakHoursTab } from "./tabs/peak-hours-tab";
import { OrderSourcesTab } from "./tabs/order-sources-tab";
import { PaymentTab } from "./tabs/payment-tab";
import { EmployeesTab } from "./tabs/employees-tab";
import { ReportsPrintModal } from "./reports-print-modal";

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
  const [printModalOpen, setPrintModalOpen] = React.useState(false);

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

  // Professional formatted Excel export handler
  const handleExportCsv = () => {
    try {
      const selectedBrand = brands.find((b) => b.id === filter.brandId)?.name;
      const selectedPlatform = platforms.find((p) => p.id === filter.platformId)?.name;
      const dateRange = { startDate: filter.startDate, endDate: filter.endDate };
      const filename = `تقرير_${activeTab}_${filter.startDate}_إلى_${filter.endDate}.xls`;

      let options: ExcelExportOptions;

      if (activeTab === "sales") {
        const totalOrders = mainData.dailyBreakdown.reduce((s, r) => s + r.orders, 0);
        const totalDelivered = mainData.dailyBreakdown.reduce((s, r) => s + r.delivered, 0);
        const totalCancelled = mainData.dailyBreakdown.reduce((s, r) => s + r.cancelled, 0);
        const totalSales = mainData.dailyBreakdown.reduce((s, r) => s + r.sales, 0);
        const totalDeliveryFees = mainData.dailyBreakdown.reduce((s, r) => s + r.deliveryFees, 0);
        const totalExpenses = mainData.dailyBreakdown.reduce((s, r) => s + r.expenses, 0);
        const totalNet = mainData.dailyBreakdown.reduce((s, r) => s + r.net, 0);

        options = {
          title: "تقرير المبيعات التفصيلي اليومي",
          sheetName: "المبيعات اليومية",
          dateRange,
          brandName: selectedBrand,
          platformName: selectedPlatform,
          kpis: [
            { label: "صافي الإيرادات", value: mainData.summary.netRevenue.toLocaleString("ar-EG"), unit: "ج.م" },
            { label: "إجمالي الطلبات", value: mainData.summary.totalOrders },
            { label: "إجمالي المصروفات", value: mainData.summary.totalExpenses.toLocaleString("ar-EG"), unit: "ج.م" },
            { label: "صافي الأرباح", value: mainData.summary.netProfit.toLocaleString("ar-EG"), unit: "ج.م" },
          ],
          columns: [
            { header: "التاريخ", key: "date", align: "center" },
            { header: "إجمالي الطلبات", key: "orders", align: "center" },
            { header: "المسلمة", key: "delivered", align: "center" },
            { header: "الملغاة", key: "cancelled", align: "center" },
            { header: "المبيعات (ج.م)", key: "sales", align: "left" },
            { header: "رسوم التوصيل (ج.م)", key: "deliveryFees", align: "left" },
            { header: "المصروفات (ج.م)", key: "expenses", align: "left" },
            { header: "صافي الإيراد (ج.م)", key: "net", align: "left" },
          ],
          rows: mainData.dailyBreakdown.map((r) => ({
            date: r.date,
            orders: r.orders,
            delivered: r.delivered,
            cancelled: r.cancelled,
            sales: r.sales.toLocaleString("ar-EG"),
            deliveryFees: r.deliveryFees.toLocaleString("ar-EG"),
            expenses: r.expenses.toLocaleString("ar-EG"),
            net: r.net.toLocaleString("ar-EG"),
          })),
          totalsRow: {
            date: "الإجمالي العام",
            orders: totalOrders,
            delivered: totalDelivered,
            cancelled: totalCancelled,
            sales: totalSales.toLocaleString("ar-EG"),
            deliveryFees: totalDeliveryFees.toLocaleString("ar-EG"),
            expenses: totalExpenses.toLocaleString("ar-EG"),
            net: totalNet.toLocaleString("ar-EG"),
          },
        };
      } else if (activeTab === "products") {
        const totalQty = mainData.topProducts.reduce((s, p) => s + p.quantity, 0);
        const totalOrdersCount = mainData.topProducts.reduce((s, p) => s + p.ordersCount, 0);
        const totalRevenue = mainData.topProducts.reduce((s, p) => s + p.revenue, 0);

        options = {
          title: "تقرير أداء ومبيعات أصناف السوشي",
          sheetName: "المنتجات",
          dateRange,
          brandName: selectedBrand,
          platformName: selectedPlatform,
          kpis: [
            { label: "عدد الأصناف المباعة", value: mainData.topProducts.length },
            { label: "إجمالي الكمية المباعة", value: totalQty, unit: "وجبة/قطعة" },
            { label: "إجمالي الإيرادات", value: totalRevenue.toLocaleString("ar-EG"), unit: "ج.م" },
          ],
          columns: [
            { header: "#", key: "rank", align: "center", width: 40 },
            { header: "اسم الصنف", key: "productName", align: "right" },
            { header: "الكمية المباعة", key: "quantity", align: "center" },
            { header: "عدد مرات الطلب", key: "ordersCount", align: "center" },
            { header: "إجمالي الإيراد (ج.م)", key: "revenue", align: "left" },
          ],
          rows: mainData.topProducts.map((p, idx) => ({
            rank: idx + 1,
            productName: p.productName,
            quantity: p.quantity,
            ordersCount: p.ordersCount,
            revenue: p.revenue.toLocaleString("ar-EG"),
          })),
          totalsRow: {
            rank: "",
            productName: "الإجمالي العام",
            quantity: totalQty,
            ordersCount: totalOrdersCount,
            revenue: totalRevenue.toLocaleString("ar-EG"),
          },
        };
      } else if (activeTab === "order-sources") {
        const totalOrders = mainData.platformBrand.reduce((s, pb) => s + pb.orders, 0);
        const totalSales = mainData.platformBrand.reduce((s, pb) => s + pb.sales, 0);

        options = {
          title: "تقرير قنوات البيع ومنصات التوصيل والبراندات",
          sheetName: "قنوات البيع",
          dateRange,
          brandName: selectedBrand,
          platformName: selectedPlatform,
          kpis: [
            { label: "إجمالي طلبات القنوات", value: totalOrders },
            { label: "إجمالي مبيعات القنوات", value: totalSales.toLocaleString("ar-EG"), unit: "ج.م" },
          ],
          columns: [
            { header: "المنصة", key: "platformName", align: "center" },
            { header: "البراند", key: "brandName", align: "center" },
            { header: "عدد الطلبات", key: "orders", align: "center" },
            { header: "إجمالي المبيعات (ج.م)", key: "sales", align: "left" },
          ],
          rows: mainData.platformBrand.map((pb) => ({
            platformName: pb.platformName,
            brandName: pb.brandName,
            orders: pb.orders,
            sales: pb.sales.toLocaleString("ar-EG"),
          })),
          totalsRow: {
            platformName: "الإجمالي",
            brandName: "-",
            orders: totalOrders,
            sales: totalSales.toLocaleString("ar-EG"),
          },
        };
      } else if (activeTab === "payment") {
        const netRev = mainData.summary.netRevenue || 1;
        const cashPct = Math.round((mainData.summary.cashTotal / netRev) * 100);
        const visaPct = Math.round((mainData.summary.visaTotal / netRev) * 100);
        const onlinePct = Math.round((mainData.summary.onlineTotal / netRev) * 100);

        options = {
          title: "تقرير طرق الدفع والتحصيل المالي",
          sheetName: "طرق الدفع",
          dateRange,
          brandName: selectedBrand,
          platformName: selectedPlatform,
          kpis: [
            { label: "كاش", value: mainData.summary.cashTotal.toLocaleString("ar-EG"), unit: "ج.م" },
            { label: "فيزا", value: mainData.summary.visaTotal.toLocaleString("ar-EG"), unit: "ج.م" },
            { label: "أونلاين", value: mainData.summary.onlineTotal.toLocaleString("ar-EG"), unit: "ج.م" },
            { label: "الإجمالي", value: mainData.summary.netRevenue.toLocaleString("ar-EG"), unit: "ج.م" },
          ],
          columns: [
            { header: "طريقة الدفع", key: "method", align: "center" },
            { header: "المبلغ المحصل (ج.م)", key: "amount", align: "left" },
            { header: "النسبة المئوية", key: "percentage", align: "center" },
          ],
          rows: [
            { method: "كاش (نقدي)", amount: mainData.summary.cashTotal.toLocaleString("ar-EG"), percentage: `${cashPct}%` },
            { method: "فيزا (بطاقة ائتمانية)", amount: mainData.summary.visaTotal.toLocaleString("ar-EG"), percentage: `${visaPct}%` },
            { method: "أونلاين (دفع إلكتروني)", amount: mainData.summary.onlineTotal.toLocaleString("ar-EG"), percentage: `${onlinePct}%` },
          ],
          totalsRow: {
            method: "الإجمالي المحصل",
            amount: mainData.summary.netRevenue.toLocaleString("ar-EG"),
            percentage: "100%",
          },
        };
      } else if (activeTab === "employees" && empData) {
        const totalOrders = empData.employees.reduce((s, e) => s + e.totalOrders, 0);
        const totalCancelled = empData.employees.reduce((s, e) => s + e.cancelledOrders, 0);
        const totalRev = empData.employees.reduce((s, e) => s + e.totalRevenue, 0);
        const totalDiscounts = empData.employees.reduce((s, e) => s + e.discountsApprovedValue, 0);

        options = {
          title: "تقرير كفاءة وإنتاجية الكاشيرية وفريق العمل",
          sheetName: "الموظفون",
          dateRange,
          brandName: selectedBrand,
          platformName: selectedPlatform,
          columns: [
            { header: "اسم الكاشير", key: "cashierName", align: "right" },
            { header: "إجمالي الطلبات", key: "totalOrders", align: "center" },
            { header: "الطلبات الملغاة", key: "cancelledOrders", align: "center" },
            { header: "إجمالي الإيراد (ج.م)", key: "totalRevenue", align: "left" },
            { header: "متوسط الطلب (ج.م)", key: "avgOrderValue", align: "left" },
            { header: "خصومات معتمدة (عدد)", key: "discountsApproved", align: "center" },
            { header: "قيمة الخصومات (ج.م)", key: "discountsApprovedValue", align: "left" },
          ],
          rows: empData.employees.map((e) => ({
            cashierName: e.cashierName,
            totalOrders: e.totalOrders,
            cancelledOrders: e.cancelledOrders,
            totalRevenue: e.totalRevenue.toLocaleString("ar-EG"),
            avgOrderValue: e.avgOrderValue.toLocaleString("ar-EG"),
            discountsApproved: e.discountsApproved,
            discountsApprovedValue: e.discountsApprovedValue.toLocaleString("ar-EG"),
          })),
          totalsRow: {
            cashierName: "الإجمالي العام",
            totalOrders,
            cancelledOrders: totalCancelled,
            totalRevenue: totalRev.toLocaleString("ar-EG"),
            avgOrderValue: "-",
            discountsApproved: "-",
            discountsApprovedValue: totalDiscounts.toLocaleString("ar-EG"),
          },
        };
      } else if (activeTab === "peak-hours" && peakData) {
        const totalOrders = peakData.hourly.reduce((s, h) => s + h.orders, 0);
        const totalRevenue = peakData.hourly.reduce((s, h) => s + h.revenue, 0);
        const busiestHour = [...peakData.hourly].sort((a, b) => b.orders - a.orders)[0];

        options = {
          title: "تقرير ساعات وأيام الذروة التشغيلية",
          sheetName: "ساعات الذروة",
          dateRange,
          brandName: selectedBrand,
          platformName: selectedPlatform,
          kpis: [
            { label: "ساعة الذروة العظمى", value: busiestHour ? `${String(busiestHour.hour).padStart(2, "0")}:00 (${busiestHour.orders} طلب)` : "-" },
            { label: "إجمالي طلبات الساعات", value: totalOrders },
          ],
          columns: [
            { header: "الساعة", key: "hourLabel", align: "center" },
            { header: "عدد الطلبات", key: "orders", align: "center" },
            { header: "المبيعات (ج.م)", key: "revenue", align: "left" },
            { header: "متوسط الطلب (ج.م)", key: "aov", align: "left" },
          ],
          rows: peakData.hourly.map((h) => {
            const avg = h.orders > 0 ? Math.round(h.revenue / h.orders) : 0;
            return {
              hourLabel: `${String(h.hour).padStart(2, "0")}:00 - ${String(h.hour + 1).padStart(2, "0")}:00`,
              orders: h.orders,
              revenue: h.revenue.toLocaleString("ar-EG"),
              aov: avg.toLocaleString("ar-EG"),
            };
          }),
          totalsRow: {
            hourLabel: "الإجمالي",
            orders: totalOrders,
            revenue: totalRevenue.toLocaleString("ar-EG"),
            aov: "-",
          },
        };
      } else {
        // Overview default export
        options = {
          title: "تقرير المؤشرات الشاملة والأداء العام",
          sheetName: "نظرة عامة",
          dateRange,
          brandName: selectedBrand,
          platformName: selectedPlatform,
          kpis: [
            { label: "صافي الإيرادات", value: mainData.summary.netRevenue.toLocaleString("ar-EG"), unit: "ج.م" },
            { label: "إجمالي الطلبات", value: mainData.summary.totalOrders },
            { label: "إجمالي المصروفات", value: mainData.summary.totalExpenses.toLocaleString("ar-EG"), unit: "ج.م" },
            { label: "صافي الأرباح", value: mainData.summary.netProfit.toLocaleString("ar-EG"), unit: "ج.م" },
          ],
          columns: [
            { header: "المؤشر المالي / التشغيلي", key: "metric", align: "right" },
            { header: "القيمة المحققة", key: "value", align: "left" },
          ],
          rows: [
            { metric: "إجمالي المبيعات الخام (Gross Sales)", value: `${mainData.summary.grossSales.toLocaleString("ar-EG")} ج.م` },
            { metric: "إجمالي الخصومات الممنوحة", value: `${mainData.summary.totalDiscounts.toLocaleString("ar-EG")} ج.م` },
            { metric: "إجمالي رسوم التوصيل المحصلة", value: `${mainData.summary.totalDeliveryFees.toLocaleString("ar-EG")} ج.م` },
            { metric: "صافي الإيرادات (Net Revenue)", value: `${mainData.summary.netRevenue.toLocaleString("ar-EG")} ج.م` },
            { metric: "إجمالي المصروفات التشغيلية", value: `${mainData.summary.totalExpenses.toLocaleString("ar-EG")} ج.م` },
            { metric: "صافي الأرباح التشغيلية (Net Profit)", value: `${mainData.summary.netProfit.toLocaleString("ar-EG")} ج.م` },
            { metric: "إجمالي عدد الطلبات المسجلة", value: String(mainData.summary.totalOrders) },
            { metric: "الطلبات المسلمة بنجاح", value: String(mainData.summary.deliveredOrders) },
            { metric: "الطلبات الملغاة", value: String(mainData.summary.cancelledOrders) },
            { metric: "متوسط قيمة الطلب (AOV)", value: `${mainData.summary.aov.toLocaleString("ar-EG")} ج.م` },
            { metric: "مبيعات الدفع النقدي (كاش)", value: `${mainData.summary.cashTotal.toLocaleString("ar-EG")} ج.م` },
            { metric: "مبيعات بطاقات الدفع (فيزا)", value: `${mainData.summary.visaTotal.toLocaleString("ar-EG")} ج.م` },
            { metric: "مبيعات الدفع الإلكتروني (أونلاين)", value: `${mainData.summary.onlineTotal.toLocaleString("ar-EG")} ج.م` },
          ],
        };
      }

      exportReportToExcel(options, filename);
      toast.success(t("exportSuccess"));
    } catch {
      toast.error(t("errors.generic"));
    }
  };

  const handlePrintPdf = () => {
    setPrintModalOpen(true);
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

      {/* Executive Printable Report Modal (PDF) */}
      <ReportsPrintModal
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        activeTab={activeTab}
        filter={filter}
        mainData={mainData}
        peakData={peakData}
        empData={empData}
        brandName={brands.find((b) => b.id === filter.brandId)?.name}
        platformName={platforms.find((p) => p.id === filter.platformId)?.name}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
