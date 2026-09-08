"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Printer, X, FileText, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type {
  ReportsPayload,
  PeakHoursPayload,
  EmployeesPayload,
} from "@/services/reports";
import type { ReportsFilterState } from "./reports-filter-bar";
import {
  generatePrintableReportHtml,
  printHtmlViaIframe,
  generateReportTableHtml,
} from "@/lib/printReport";

type TabId =
  | "overview"
  | "sales"
  | "products"
  | "peak-hours"
  | "order-sources"
  | "payment"
  | "employees";

interface ReportsPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: TabId;
  filter: ReportsFilterState;
  mainData: ReportsPayload;
  peakData: PeakHoursPayload | null;
  empData: EmployeesPayload | null;
  brandName?: string;
  platformName?: string;
  formatCurrency: (v: number) => string;
}

export function ReportsPrintModal({
  open,
  onOpenChange,
  activeTab,
  filter,
  mainData,
  peakData,
  empData,
  brandName,
  platformName,
  formatCurrency,
}: ReportsPrintModalProps) {
  const t = useTranslations("reports");
  const tModal = useTranslations("reports.printModal");

  const now = new Date();
  const formattedTimestamp = now.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getReportTitle = () => {
    switch (activeTab) {
      case "sales":
        return "تقرير المبيعات والتحليلات اليومية";
      case "products":
        return "تقرير حركة ومبيعات أصناف السوشي";
      case "order-sources":
        return "تقرير قنوات البيع وتطبيقات التوصيل والبراندات";
      case "payment":
        return "تقرير طرق الدفع والتحصيل المالي";
      case "employees":
        return "تقرير كفاءة وإنتاجية الكاشيرية وفريق العمل";
      case "peak-hours":
        return "تقرير ساعات الذروة وتوزيع ضغط الطلبات";
      default:
        return "تقرير المؤشرات الشاملة والأداء العام للمطعم";
    }
  };

  const handlePrint = () => {
    const tableHtml = generateReportTableHtml(activeTab, {
      mainData,
      peakData,
      empData,
      formatCurrency,
    });

    const printableHtml = generatePrintableReportHtml({
      title: getReportTitle(),
      dateRange: {
        startDate: filter.startDate,
        endDate: filter.endDate,
      },
      brandName: brandName || tModal("allBrands"),
      platformName: platformName || tModal("allPlatforms"),
      kpis: [
        { label: tModal("kpiRevenue"), value: formatCurrency(mainData.summary.netRevenue) },
        { label: tModal("kpiOrders"), value: `${mainData.summary.totalOrders} طلب` },
        { label: tModal("kpiExpenses"), value: formatCurrency(mainData.summary.totalExpenses) },
        { label: tModal("kpiProfit"), value: formatCurrency(mainData.summary.netProfit) },
      ],
      tableHtml,
      generatedBy: tModal("systemAdmin"),
      timestamp: formattedTimestamp,
    });

    printHtmlViaIframe(printableHtml);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background text-foreground border-border/80 shadow-2xl"
        showCloseButton={false}
      >

        {/* Modal Top Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <FileText className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {tModal("title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {tModal("subtitle")}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-medium"
            >
              <X className="size-3.5 ms-1.5" />
              {tModal("closeAction")}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="text-xs font-bold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Printer className="size-3.5 ms-1.5" />
              {tModal("printAction")}
            </Button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-zinc-950/80">
          {/* Official Printable Document Paper */}
          <div
            id="printable-report-area"
            dir="rtl"
            className="w-full max-w-[820px] mx-auto bg-white text-slate-900 border border-slate-200 shadow-md rounded-xl p-8 sm:p-10 text-right font-sans"
          >
            {/* 1. Official Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍣</span>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950">
                    {tModal("systemLetterhead")}
                  </h1>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {getReportTitle()}
                </p>
              </div>

              <div className="text-left space-y-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 text-white text-[11px] font-bold">
                  <CheckCircle2 className="size-3 text-emerald-400" />
                  <span>{tModal("officialReport")}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {tModal("generationDate")}: <span dir="ltr" className="font-mono">{formattedTimestamp}</span>
                </div>
              </div>
            </div>

            {/* 2. Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-6">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">{tModal("dateRange")}</span>
                <span className="font-mono font-bold text-slate-900 mt-0.5 block" dir="ltr">
                  {filter.startDate} → {filter.endDate}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">{tModal("brand")}</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {brandName || tModal("allBrands")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">{tModal("platform")}</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {platformName || tModal("allPlatforms")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">{tModal("generatedBy")}</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {tModal("systemAdmin")}
                </span>
              </div>
            </div>

            {/* 3. Key Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <span className="text-slate-500 text-[11px] font-medium block">{tModal("kpiRevenue")}</span>
                <span className="text-lg font-bold text-slate-950 font-mono mt-0.5 block">
                  {formatCurrency(mainData.summary.netRevenue)}
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <span className="text-slate-500 text-[11px] font-medium block">{tModal("kpiOrders")}</span>
                <span className="text-lg font-bold text-slate-950 font-mono mt-0.5 block">
                  {mainData.summary.totalOrders} <span className="text-xs font-normal text-slate-500">طلب</span>
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <span className="text-slate-500 text-[11px] font-medium block">{tModal("kpiExpenses")}</span>
                <span className="text-lg font-bold text-slate-950 font-mono mt-0.5 block">
                  {formatCurrency(mainData.summary.totalExpenses)}
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <span className="text-slate-500 text-[11px] font-medium block">{tModal("kpiProfit")}</span>
                <span className="text-lg font-bold text-emerald-700 font-mono mt-0.5 block">
                  {formatCurrency(mainData.summary.netProfit)}
                </span>
              </div>
            </div>

            {/* 4. Tab Data Table */}
            <div className="mb-8">
              <h2 className="text-xs font-bold text-slate-900 mb-2.5 pb-1 border-b border-slate-200">
                {tModal("tableTitle")} — {getReportTitle()}
              </h2>

              {activeTab === "sales" && (
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="border border-slate-400 p-2 text-center">التاريخ</th>
                      <th className="border border-slate-400 p-2 text-center">الطلبات</th>
                      <th className="border border-slate-400 p-2 text-center">المسلمة</th>
                      <th className="border border-slate-400 p-2 text-center">الملغاة</th>
                      <th className="border border-slate-400 p-2 text-left">المبيعات</th>
                      <th className="border border-slate-400 p-2 text-left">التوصيل</th>
                      <th className="border border-slate-400 p-2 text-left">المصروفات</th>
                      <th className="border border-slate-400 p-2 text-left">الصافي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mainData.dailyBreakdown.map((r, i) => (
                      <tr key={r.date} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="border border-slate-200 p-1.5 text-center font-mono">{r.date}</td>
                        <td className="border border-slate-200 p-1.5 text-center font-mono">{r.orders}</td>
                        <td className="border border-slate-200 p-1.5 text-center font-mono text-emerald-700">{r.delivered}</td>
                        <td className="border border-slate-200 p-1.5 text-center font-mono text-rose-700">{r.cancelled}</td>
                        <td className="border border-slate-200 p-1.5 text-left font-mono">{formatCurrency(r.sales)}</td>
                        <td className="border border-slate-200 p-1.5 text-left font-mono">{formatCurrency(r.deliveryFees)}</td>
                        <td className="border border-slate-200 p-1.5 text-left font-mono">{formatCurrency(r.expenses)}</td>
                        <td className="border border-slate-200 p-1.5 text-left font-mono font-semibold">{formatCurrency(r.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                      <td className="border border-slate-300 p-2 text-center">الإجمالي</td>
                      <td className="border border-slate-300 p-2 text-center font-mono">
                        {mainData.dailyBreakdown.reduce((s, r) => s + r.orders, 0)}
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-mono text-emerald-700">
                        {mainData.dailyBreakdown.reduce((s, r) => s + r.delivered, 0)}
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-mono text-rose-700">
                        {mainData.dailyBreakdown.reduce((s, r) => s + r.cancelled, 0)}
                      </td>
                      <td className="border border-slate-300 p-2 text-left font-mono">
                        {formatCurrency(mainData.dailyBreakdown.reduce((s, r) => s + r.sales, 0))}
                      </td>
                      <td className="border border-slate-300 p-2 text-left font-mono">
                        {formatCurrency(mainData.dailyBreakdown.reduce((s, r) => s + r.deliveryFees, 0))}
                      </td>
                      <td className="border border-slate-300 p-2 text-left font-mono">
                        {formatCurrency(mainData.dailyBreakdown.reduce((s, r) => s + r.expenses, 0))}
                      </td>
                      <td className="border border-slate-300 p-2 text-left font-mono text-emerald-800">
                        {formatCurrency(mainData.dailyBreakdown.reduce((s, r) => s + r.net, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {activeTab === "products" && (
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="border border-slate-400 p-2 text-center w-10">#</th>
                      <th className="border border-slate-400 p-2 text-right">اسم الصنف</th>
                      <th className="border border-slate-400 p-2 text-center">الكمية المباعة</th>
                      <th className="border border-slate-400 p-2 text-center">عدد مرات الطلب</th>
                      <th className="border border-slate-400 p-2 text-left">إجمالي الإيراد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mainData.topProducts.map((p, idx) => (
                      <tr key={p.productId} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="border border-slate-200 p-1.5 text-center font-mono">{idx + 1}</td>
                        <td className="border border-slate-200 p-1.5 font-medium">{p.productName}</td>
                        <td className="border border-slate-200 p-1.5 text-center font-mono">{p.quantity}</td>
                        <td className="border border-slate-200 p-1.5 text-center font-mono">{p.ordersCount}</td>
                        <td className="border border-slate-200 p-1.5 text-left font-mono font-semibold">{formatCurrency(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                      <td className="border border-slate-300 p-2 text-center" colSpan={2}>الإجمالي العام</td>
                      <td className="border border-slate-300 p-2 text-center font-mono">
                        {mainData.topProducts.reduce((s, p) => s + p.quantity, 0)}
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-mono">
                        {mainData.topProducts.reduce((s, p) => s + p.ordersCount, 0)}
                      </td>
                      <td className="border border-slate-300 p-2 text-left font-mono text-emerald-800">
                        {formatCurrency(mainData.topProducts.reduce((s, p) => s + p.revenue, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {activeTab === "payment" && (
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="border border-slate-400 p-2 text-center">طريقة الدفع</th>
                      <th className="border border-slate-400 p-2 text-left">المبلغ المحصل</th>
                      <th className="border border-slate-400 p-2 text-center">النسبة المئوية</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 p-2 font-medium">كاش (نقدي)</td>
                      <td className="border border-slate-200 p-2 text-left font-mono">{formatCurrency(mainData.summary.cashTotal)}</td>
                      <td className="border border-slate-200 p-2 text-center font-mono">
                        {Math.round((mainData.summary.cashTotal / (mainData.summary.netRevenue || 1)) * 100)}%
                      </td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-200 p-2 font-medium">فيزا (بطاقة ائتمانية)</td>
                      <td className="border border-slate-200 p-2 text-left font-mono">{formatCurrency(mainData.summary.visaTotal)}</td>
                      <td className="border border-slate-200 p-2 text-center font-mono">
                        {Math.round((mainData.summary.visaTotal / (mainData.summary.netRevenue || 1)) * 100)}%
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-2 font-medium">أونلاين (دفع إلكتروني)</td>
                      <td className="border border-slate-200 p-2 text-left font-mono">{formatCurrency(mainData.summary.onlineTotal)}</td>
                      <td className="border border-slate-200 p-2 text-center font-mono">
                        {Math.round((mainData.summary.onlineTotal / (mainData.summary.netRevenue || 1)) * 100)}%
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                      <td className="border border-slate-300 p-2 text-center">الإجمالي المحصل</td>
                      <td className="border border-slate-300 p-2 text-left font-mono text-emerald-800">
                        {formatCurrency(mainData.summary.netRevenue)}
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-mono">100%</td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {activeTab === "order-sources" && (
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="border border-slate-400 p-2 text-center">المنصة</th>
                      <th className="border border-slate-400 p-2 text-center">البراند</th>
                      <th className="border border-slate-400 p-2 text-center">عدد الطلبات</th>
                      <th className="border border-slate-400 p-2 text-left">إجمالي المبيعات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mainData.platformBrand.map((pb, idx) => (
                      <tr key={`${pb.platformName}-${pb.brandName}`} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="border border-slate-200 p-2 text-center font-medium">{pb.platformName}</td>
                        <td className="border border-slate-200 p-2 text-center font-medium">{pb.brandName}</td>
                        <td className="border border-slate-200 p-2 text-center font-mono">{pb.orders}</td>
                        <td className="border border-slate-200 p-2 text-left font-mono">{formatCurrency(pb.sales)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                      <td className="border border-slate-300 p-2 text-center" colSpan={2}>الإجمالي</td>
                      <td className="border border-slate-300 p-2 text-center font-mono">
                        {mainData.platformBrand.reduce((s, pb) => s + pb.orders, 0)}
                      </td>
                      <td className="border border-slate-300 p-2 text-left font-mono text-emerald-800">
                        {formatCurrency(mainData.platformBrand.reduce((s, pb) => s + pb.sales, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {activeTab === "employees" && (
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="border border-slate-400 p-2 text-right">اسم الكاشير</th>
                      <th className="border border-slate-400 p-2 text-center">إجمالي الطلبات</th>
                      <th className="border border-slate-400 p-2 text-center">الطلبات الملغاة</th>
                      <th className="border border-slate-400 p-2 text-left">إجمالي الإيراد</th>
                      <th className="border border-slate-400 p-2 text-left">متوسط الطلب</th>
                      <th className="border border-slate-400 p-2 text-center">خصومات معتمدة</th>
                      <th className="border border-slate-400 p-2 text-left">قيمة الخصم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(empData?.employees || []).map((e, idx) => (
                      <tr key={e.cashierId} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="border border-slate-200 p-2 font-medium">{e.cashierName}</td>
                        <td className="border border-slate-200 p-2 text-center font-mono">{e.totalOrders}</td>
                        <td className="border border-slate-200 p-2 text-center font-mono text-rose-700">{e.cancelledOrders}</td>
                        <td className="border border-slate-200 p-2 text-left font-mono">{formatCurrency(e.totalRevenue)}</td>
                        <td className="border border-slate-200 p-2 text-left font-mono">{formatCurrency(e.avgOrderValue)}</td>
                        <td className="border border-slate-200 p-2 text-center font-mono">{e.discountsApproved}</td>
                        <td className="border border-slate-200 p-2 text-left font-mono">{formatCurrency(e.discountsApprovedValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "peak-hours" && (
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="border border-slate-400 p-2 text-center">الساعة</th>
                      <th className="border border-slate-400 p-2 text-center">عدد الطلبات</th>
                      <th className="border border-slate-400 p-2 text-left">إجمالي المبيعات</th>
                      <th className="border border-slate-400 p-2 text-left">متوسط الطلب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(peakData?.hourly || []).map((h, idx) => (
                      <tr key={h.hour} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="border border-slate-200 p-2 text-center font-mono">
                          {String(h.hour).padStart(2, "0")}:00 - {String(h.hour + 1).padStart(2, "0")}:00
                        </td>
                        <td className="border border-slate-200 p-2 text-center font-mono">{h.orders}</td>
                        <td className="border border-slate-200 p-2 text-left font-mono">{formatCurrency(h.revenue)}</td>
                        <td className="border border-slate-200 p-2 text-left font-mono">
                          {formatCurrency(h.orders > 0 ? Math.round(h.revenue / h.orders) : 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "overview" && (
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="border border-slate-400 p-2 text-right">المؤشر الإحصائي / المالي</th>
                      <th className="border border-slate-400 p-2 text-left">القيمة المحققة</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 p-2">إجمالي المبيعات الخام (Gross Sales)</td>
                      <td className="border border-slate-200 p-2 text-left font-mono font-medium">{formatCurrency(mainData.summary.grossSales)}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-200 p-2">إجمالي الخصومات الممنوحة</td>
                      <td className="border border-slate-200 p-2 text-left font-mono font-medium text-rose-700">{formatCurrency(mainData.summary.totalDiscounts)}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-2">إجمالي رسوم التوصيل</td>
                      <td className="border border-slate-200 p-2 text-left font-mono font-medium">{formatCurrency(mainData.summary.totalDeliveryFees)}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-200 p-2 font-bold">صافي الإيرادات (Net Revenue)</td>
                      <td className="border border-slate-200 p-2 text-left font-mono font-bold text-slate-950">{formatCurrency(mainData.summary.netRevenue)}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-2">إجمالي المصروفات التشغيلية</td>
                      <td className="border border-slate-200 p-2 text-left font-mono font-medium text-amber-700">{formatCurrency(mainData.summary.totalExpenses)}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-200 p-2 font-bold">صافي الأرباح التشغيلية (Net Profit)</td>
                      <td className="border border-slate-200 p-2 text-left font-mono font-bold text-emerald-800">{formatCurrency(mainData.summary.netProfit)}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-2">إجمالي الطلبات المسجلة</td>
                      <td className="border border-slate-200 p-2 text-left font-mono font-medium">{mainData.summary.totalOrders}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-200 p-2">الطلبات المسلمة بنجاح</td>
                      <td className="border border-slate-200 p-2 text-left font-mono font-medium text-emerald-700">{mainData.summary.deliveredOrders}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-2">الطلبات الملغاة</td>
                      <td className="border border-slate-200 p-2 text-left font-mono font-medium text-rose-700">{mainData.summary.cancelledOrders}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-200 p-2">متوسط قيمة الطلب (AOV)</td>
                      <td className="border border-slate-200 p-2 text-left font-mono font-medium">{formatCurrency(mainData.summary.aov)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* 5. Signatures Block */}
            <div className="grid grid-cols-2 gap-8 border-t border-slate-300 pt-6 mt-6 break-inside-avoid">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-800 block">
                  {tModal("operationsSignature")}
                </span>
                <div className="border-b border-dashed border-slate-400 h-10 w-48" />
                <span className="text-[11px] text-slate-500 block">التوقيع والتاريخ</span>
              </div>
              <div className="space-y-4 text-left">
                <span className="text-xs font-bold text-slate-800 block">
                  {tModal("financeSignature")}
                </span>
                <div className="border-b border-dashed border-slate-400 h-10 w-48 ms-auto" />
                <span className="text-[11px] text-slate-500 block">الختم والاعتماد</span>
              </div>
            </div>

            {/* 6. Document Footer Notice */}
            <div className="border-t border-slate-200 mt-8 pt-4 text-center text-[10px] text-slate-500">
              {tModal("systemNotice")}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
