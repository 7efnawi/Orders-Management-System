"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Search, X, AlertTriangle, RotateCcw, RefreshCw, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CustomerFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  segment: string;
  onSegmentChange: (value: string) => void;
  hasProblems: boolean;
  onHasProblemsToggle: () => void;
  onReset: () => void;
  onRefresh: () => void;
  onExport?: () => void;
  isLoading?: boolean;
}

export function CustomerFilterBar({
  search,
  onSearchChange,
  segment,
  onSegmentChange,
  hasProblems,
  onHasProblemsToggle,
  onReset,
  onRefresh,
  onExport,
  isLoading,
}: CustomerFilterBarProps) {
  const t = useTranslations("customers.filters");
  const tSegments = useTranslations("customers.segments");

  const hasActiveFilters = Boolean(search || (segment && segment !== "ALL") || hasProblems);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border border-border/70 shadow-xs">
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-9 pe-9 h-10 text-sm bg-background/60 focus-visible:bg-background"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-sm"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Customer Segment Dropdown */}
        <div className="w-full sm:w-[180px]">
          <Select
            value={segment || "ALL"}
            onValueChange={(val) => onSegmentChange(val === "ALL" ? "" : val)}
          >
            <SelectTrigger className="h-10 text-sm bg-background/60">
              <SelectValue placeholder={t("allSegments")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{tSegments("all")}</SelectItem>
              <SelectItem value="VIP">{tSegments("VIP")}</SelectItem>
              <SelectItem value="REGULAR">{tSegments("REGULAR")}</SelectItem>
              <SelectItem value="NEW">{tSegments("NEW")}</SelectItem>
              <SelectItem value="AT_RISK">{tSegments("AT_RISK")}</SelectItem>
              <SelectItem value="INACTIVE">{tSegments("INACTIVE")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Has Problem Orders Toggle */}
        <Button
          type="button"
          variant={hasProblems ? "default" : "outline"}
          onClick={onHasProblemsToggle}
          className={cn(
            "h-10 gap-1.5 transition-all text-xs font-semibold shrink-0 select-none",
            hasProblems
              ? "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700 shadow-xs ring-2 ring-amber-500/30"
              : "border-border/70 hover:bg-muted/80 text-muted-foreground hover:text-foreground"
          )}
        >
          <AlertTriangle className={cn("w-4 h-4", hasProblems ? "text-white" : "text-amber-500")} />
          <span>{t("hasProblemsOnly")}</span>
        </Button>
      </div>

      {/* Action Buttons: Export, Reset & Refresh */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        {onExport && (
          <Button
            type="button"
            variant="outline"
            onClick={onExport}
            className="h-10 px-3 text-xs gap-1.5 border-border/70 hover:bg-muted/80 text-muted-foreground hover:text-foreground shrink-0"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t("exportExcel")}</span>
          </Button>
        )}

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t("reset")}</span>
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-10 px-3 text-xs gap-1.5 border-border/70 hover:bg-muted/80"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          <span className="hidden sm:inline">{t("refresh")}</span>
        </Button>
      </div>
    </div>
  );
}
