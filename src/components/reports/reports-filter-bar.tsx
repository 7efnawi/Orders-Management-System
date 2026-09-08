"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Filter, RefreshCw, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ReportsFilterState {
  startDate: string;
  endDate: string;
  brandId: string;
  platformId: string;
}

export interface ReportsFilterBarProps {
  brands: { id: string; name: string }[];
  platforms: { id: string; name: string }[];
  value: ReportsFilterState;
  loading: boolean;
  onChange: (next: ReportsFilterState) => void;
  onApply: () => void;
  onExportCsv?: () => void;
  onPrintPdf?: () => void;
}

export type QuickRange = "today" | "yesterday" | "last7Days" | "thisMonth" | "lastMonth";

function fmtIso(d: Date): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function getQuickRange(type: QuickRange): { startDate: string; endDate: string } {
  const now = new Date();
  if (type === "today") {
    return { startDate: fmtIso(now), endDate: fmtIso(now) };
  }
  if (type === "yesterday") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    return { startDate: fmtIso(d), endDate: fmtIso(d) };
  }
  if (type === "last7Days") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return { startDate: fmtIso(d), endDate: fmtIso(now) };
  }
  if (type === "thisMonth") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: fmtIso(d), endDate: fmtIso(now) };
  }
  const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const e = new Date(now.getFullYear(), now.getMonth(), 0);
  return { startDate: fmtIso(s), endDate: fmtIso(e) };
}

export function isQuickRangeActive(
  type: QuickRange,
  currentStart: string,
  currentEnd: string
): boolean {
  const range = getQuickRange(type);
  return range.startDate === currentStart && range.endDate === currentEnd;
}

export function ReportsFilterBar({
  brands,
  platforms,
  value,
  loading,
  onChange,
  onApply,
  onExportCsv,
  onPrintPdf,
}: ReportsFilterBarProps) {
  const t = useTranslations("reports.filters");

  const applyQuick = (type: QuickRange) => {
    const range = getQuickRange(type);
    onChange({ ...value, ...range });
    setTimeout(onApply, 0);
  };

  return (
    <Card className="border-border/70 shadow-xs print:hidden">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <Filter className="size-4 text-primary" />
            <span>{t("title")}</span>
          </CardTitle>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(["today", "yesterday", "last7Days", "thisMonth", "lastMonth"] as QuickRange[]).map((q) => {
              const active = isQuickRangeActive(q, value.startDate, value.endDate);
              return (
                <Button
                  key={q}
                  type="button"
                  variant={active ? "default" : "secondary"}
                  size="sm"
                  onClick={() => applyQuick(q)}
                  className={cn(
                    "h-7 text-xs px-3 rounded-full transition-all duration-150",
                    active
                      ? "bg-primary text-primary-foreground font-bold shadow-xs ring-1 ring-primary/40"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
                  )}
                >
                  {t(`quick.${q}`)}
                </Button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onApply();
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">{t("startDate")}</label>
            <input
              type="date"
              value={value.startDate}
              onChange={(e) => onChange({ ...value, startDate: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">{t("endDate")}</label>
            <input
              type="date"
              value={value.endDate}
              onChange={(e) => onChange({ ...value, endDate: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">{t("brand")}</label>
            <select
              value={value.brandId}
              onChange={(e) => onChange({ ...value, brandId: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t("allBrands")}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">{t("platform")}</label>
            <select
              value={value.platformId}
              onChange={(e) => onChange({ ...value, platformId: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t("allPlatforms")}</option>
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="h-10 w-full gap-2 font-medium">
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              <span>{loading ? t("loading") : t("apply")}</span>
            </Button>
          </div>

          <div className="flex items-end gap-1.5">
            {onExportCsv && (
              <Button
                type="button"
                variant="outline"
                onClick={onExportCsv}
                title={t("exportCsv")}
                className="h-10 flex-1 px-2.5 gap-1.5 text-xs font-medium border-border/80"
              >
                <Download className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">{t("exportCsvShort")}</span>
              </Button>
            )}
            {onPrintPdf && (
              <Button
                type="button"
                variant="outline"
                onClick={onPrintPdf}
                title={t("printPdf")}
                className="h-10 flex-1 px-2.5 gap-1.5 text-xs font-medium border-border/80"
              >
                <Printer className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span className="truncate">{t("printPdfShort")}</span>
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
