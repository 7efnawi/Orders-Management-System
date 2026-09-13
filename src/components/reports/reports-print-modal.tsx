"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Printer,
  X,
  FileText,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

  const isWideTab = ["sales", "order-sources", "peak-hours", "employees"].includes(activeTab);
  const [orientation, setOrientation] = React.useState<"portrait" | "landscape">(isWideTab ? "landscape" : "portrait");
  const [zoomLevel, setZoomLevel] = React.useState<number>(100);
  const [isMaximized, setIsMaximized] = React.useState<boolean>(false);
  const [paperWidthMode, setPaperWidthMode] = React.useState<"standard" | "wide">("standard");

  // Smart orientation default sync on tab or modal open changes
  React.useEffect(() => {
    if (open) {
      const wide = ["sales", "order-sources", "peak-hours", "employees"].includes(activeTab);
      setOrientation(wide ? "landscape" : "portrait");
    }
  }, [open, activeTab]);

  const now = new Date();
  const formattedTimestamp = now.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const marginPct =
    mainData.summary.netRevenue > 0
      ? Math.round((mainData.summary.netProfit / mainData.summary.netRevenue) * 100)
      : 0;

  const getReportTitle = React.useCallback(() => {
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
  }, [activeTab]);

  const handlePrint = React.useCallback(() => {
    const tableHtml = generateReportTableHtml(activeTab, {
      mainData,
      peakData,
      empData,
      formatCurrency,
    });

    const printableHtml = generatePrintableReportHtml({
      orientation,
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
        { label: tModal("kpiAov"), value: formatCurrency(mainData.summary.aov) },
        { label: tModal("kpiMargin"), value: `${marginPct}%` },
      ],
      tableHtml,
      generatedBy: tModal("systemAdmin"),
      timestamp: formattedTimestamp,
    });

    printHtmlViaIframe(printableHtml);
  }, [orientation, activeTab, mainData, peakData, empData, formatCurrency, getReportTitle, filter.startDate, filter.endDate, brandName, platformName, tModal, formattedTimestamp]);

  // Fast keyboard shortcut: Ctrl+P triggers print while preview is open
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handlePrint]);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 10, 150));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 10, 60));
  const handleResetZoom = () => setZoomLevel(100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[96vw] sm:max-w-[95vw] md:max-w-[94vw] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1480px]",
          isMaximized
            ? "!w-screen !max-w-none !h-screen !max-h-none !rounded-none !inset-0 !top-0 !start-0 !translate-x-0 rtl:!translate-x-0 !translate-y-0 z-[60]"
            : "h-[94vh] max-h-[94vh] rounded-2xl",
          "flex flex-col p-0 gap-0 overflow-hidden bg-background text-foreground border-border/80 shadow-2xl transition-all duration-200"
        )}
        showCloseButton={false}
      >
        {/* Modal Top Action & Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border/60 bg-muted/40 backdrop-blur-sm shrink-0">
          {/* Document Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/25 shadow-xs shrink-0">
              <FileText className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold text-foreground">
                  {tModal("title")}
                </DialogTitle>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {tModal("paperBadge")}
                </span>
              </div>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-foreground/80">{getReportTitle()}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="font-mono text-[11px]" dir="ltr">
                  {filter.startDate} → {filter.endDate}
                </span>
              </DialogDescription>
            </div>
          </div>

          {/* Interactive Preview Viewport Controls (Center) */}
          <div className="flex items-center gap-2 bg-background/80 border border-border/60 p-1 rounded-xl shadow-xs">
            {/* Orientation Mode Switcher */}
            <div className="flex items-center rounded-lg bg-muted/50 p-0.5" title={tModal("orientation")}>
              <button
                type="button"
                onClick={() => setOrientation("portrait")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1",
                  orientation === "portrait"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={tModal("portrait")}
              >
                <span>{tModal("portrait")}</span>
              </button>
              <button
                type="button"
                onClick={() => setOrientation("landscape")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1",
                  orientation === "landscape"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={tModal("landscape")}
              >
                <span>{tModal("landscape")}</span>
              </button>
            </div>

            <div className="h-4 w-px bg-border/80" />

            {/* Width Mode Switcher */}
            <div className="flex items-center rounded-lg bg-muted/50 p-0.5">
              <button
                type="button"
                onClick={() => setPaperWidthMode("standard")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  paperWidthMode === "standard"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={tModal("standardWidth")}
              >
                {tModal("standardWidth")}
              </button>
              <button
                type="button"
                onClick={() => setPaperWidthMode("wide")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  paperWidthMode === "wide"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={tModal("fitWidth")}
              >
                {tModal("fitWidth")}
              </button>
            </div>

            <div className="h-4 w-px bg-border/80" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 60}
                className="size-7 text-muted-foreground hover:text-foreground"
                title={tModal("zoomOut")}
              >
                <ZoomOut className="size-3.5" />
              </Button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-0.5 rounded text-xs font-mono font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                title={tModal("zoomReset")}
              >
                {zoomLevel}%
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 150}
                className="size-7 text-muted-foreground hover:text-foreground"
                title={tModal("zoomIn")}
              >
                <ZoomIn className="size-3.5" />
              </Button>
            </div>

            <div className="h-4 w-px bg-border/80" />

            {/* Maximize / Restore Toggle */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsMaximized((m) => !m)}
              className="size-7 text-muted-foreground hover:text-foreground"
              title={isMaximized ? tModal("restore") : tModal("maximize")}
            >
              {isMaximized ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
            </Button>
          </div>

          {/* Primary Action Buttons (End) */}
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
              title={tModal("shortcutHint")}
              className="text-xs font-bold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 px-4"
            >
              <Printer className="size-3.5 ms-1.5" />
              {tModal("printAction")}
            </Button>
          </div>
        </div>

        {/* Scrollable Preview Canvas */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 lg:p-10 bg-slate-200/85 dark:bg-zinc-950/90 flex justify-center items-start">
          {/* Official Printable Document Paper */}
          <div
            id="printable-report-area"
            dir="rtl"
            style={{
              zoom: `${zoomLevel}%`,
            }}
            className={cn(
              "w-full bg-white text-slate-900 border border-slate-300 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18),0_0_1px_rgba(0,0,0,0.12)] ring-1 ring-slate-900/5 rounded-xl p-8 sm:p-12 md:p-14 text-right font-sans shrink-0 transition-[max-width] duration-200",
              orientation === "landscape"
                ? "max-w-[1140px] md:max-w-[1240px]"
                : paperWidthMode === "wide" ? "max-w-[980px]" : "max-w-[850px]"
            )}
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
            <div className={cn(
              "grid gap-3 mb-6",
              orientation === "landscape"
                ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-6"
            )}>
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <span className="text-slate-500 text-[11px] font-medium block">{tModal("kpiRevenue")}</span>
                <span className="text-base sm:text-lg font-bold text-slate-950 font-mono mt-0.5 block">
                  {formatCurrency(mainData.summary.netRevenue)}
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <span className="text-slate-500 text-[11px] font-medium block">{tModal("kpiOrders")}</span>
                <span className="text-base sm:text-lg font-bold text-slate-950 font-mono mt-0.5 block">
                  {mainData.summary.totalOrders} <span className="text-xs font-normal text-slate-500">طلب</span>
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <span className="text-slate-500 text-[11px] font-medium block">{tModal("kpiExpenses")}</span>
                <span className="text-base sm:text-lg font-bold text-slate-950 font-mono mt-0.5 block">
                  {formatCurrency(mainData.summary.totalExpenses)}
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <span className="text-slate-500 text-[11px] font-medium block">{tModal("kpiProfit")}</span>
                <span className="text-base sm:text-lg font-bold text-emerald-700 font-mono mt-0.5 block">
                  {formatCurrency(mainData.summary.netProfit)}
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <span className="text-slate-500 text-[11px] font-medium block">{tModal("kpiAov")}</span>
                <span className="text-base sm:text-lg font-bold text-slate-950 font-mono mt-0.5 block">
                  {formatCurrency(mainData.summary.aov)}
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <span className="text-slate-500 text-[11px] font-medium block">{tModal("kpiMargin")}</span>
                <span className={cn(
                  "text-base sm:text-lg font-bold font-mono mt-0.5 block",
                  marginPct >= 0 ? "text-emerald-700" : "text-rose-700"
                )}>
                  {marginPct}%
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
