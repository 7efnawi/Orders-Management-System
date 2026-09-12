"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Search, X, AlertTriangle, RotateCcw, RefreshCw } from "lucide-react";
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
  tier: string;
  onTierChange: (value: string) => void;
  hasProblems: boolean;
  onHasProblemsToggle: () => void;
  onReset: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function CustomerFilterBar({
  search,
  onSearchChange,
  tier,
  onTierChange,
  hasProblems,
  onHasProblemsToggle,
  onReset,
  onRefresh,
  isLoading,
}: CustomerFilterBarProps) {
  const t = useTranslations("customers.filters");

  const hasActiveFilters = Boolean(search || tier || hasProblems);

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
            className="ps-9 pe-9 h-9 text-sm bg-background/60 focus-visible:bg-background"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-sm"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Loyalty Tier Dropdown */}
        <div className="w-full sm:w-[170px]">
          <Select
            value={tier || "ALL"}
            onValueChange={(val) => onTierChange(val === "ALL" ? "" : val)}
          >
            <SelectTrigger className="h-9 text-sm bg-background/60">
              <SelectValue placeholder={t("allTiers")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("allTiers")}</SelectItem>
              <SelectItem value="NEW">{t("tierNew")}</SelectItem>
              <SelectItem value="BRONZE">{t("tierBronze")}</SelectItem>
              <SelectItem value="SILVER">{t("tierSilver")}</SelectItem>
              <SelectItem value="GOLD">{t("tierGold")}</SelectItem>
              <SelectItem value="PLATINUM">{t("tierPlatinum")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Has Problem Orders Toggle */}
        <Button
          type="button"
          variant={hasProblems ? "default" : "outline"}
          size="sm"
          onClick={onHasProblemsToggle}
          className={cn(
            "h-9 gap-1.5 transition-all text-xs font-semibold shrink-0 select-none",
            hasProblems
              ? "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700 shadow-xs ring-2 ring-amber-500/30"
              : "border-border/70 hover:bg-muted/80 text-muted-foreground hover:text-foreground"
          )}
        >
          <AlertTriangle className={cn("w-3.5 h-3.5", hasProblems ? "text-white" : "text-amber-500")} />
          <span>{t("hasProblemsOnly")}</span>
        </Button>
      </div>

      {/* Action Buttons: Reset & Refresh */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t("reset")}</span>
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-9 px-2.5 text-xs gap-1 border-border/70"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          <span className="hidden sm:inline">{t("refresh")}</span>
        </Button>
      </div>
    </div>
  );
}
