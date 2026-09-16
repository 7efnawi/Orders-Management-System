"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AuditAction, type Role } from "@/types/enums";
import {
  Search,
  Filter,
  RotateCcw,
  RefreshCw,
  Calendar,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AuditDatePreset = "today" | "yesterday" | "last7Days" | "thisMonth" | "allTime" | "custom";

export interface AuditFilterState {
  startDate?: string;
  endDate?: string;
  action?: AuditAction | "";
  entityType?: string;
  userId?: string;
  search?: string;
}

interface AuditFilterBarProps {
  filters: AuditFilterState;
  activePreset: AuditDatePreset;
  users: Array<{ id: string; name: string; role: Role }>;
  onPresetChange: (preset: "today" | "yesterday" | "last7Days" | "thisMonth" | "allTime") => void;
  onFilterChange: (changes: Partial<AuditFilterState>) => void;
  onReset: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const ENTITY_OPTIONS = [
  "Order",
  "User",
  "Product",
  "Category",
  "Expense",
  "ExpenseType",
  "DailyClosing",
  "Driver",
  "DeliveryZone",
] as const;

const ACTION_OPTIONS = [
  AuditAction.CREATE,
  AuditAction.UPDATE,
  AuditAction.CANCEL,
  AuditAction.STATUS_CHANGE,
  AuditAction.DISCOUNT_REQUEST,
  AuditAction.DISCOUNT_APPROVE,
  AuditAction.DISCOUNT_REJECT,
] as const;

export function AuditFilterBar({
  filters,
  activePreset,
  users,
  onPresetChange,
  onFilterChange,
  onReset,
  onRefresh,
  isLoading,
}: AuditFilterBarProps) {
  const t = useTranslations("audit");
  const tRoles = useTranslations("roles");

  const [searchInput, setSearchInput] = React.useState(filters.search || "");

  // Sync internal search input with incoming prop
  React.useEffect(() => {
    setSearchInput(filters.search || "");
  }, [filters.search]);

  // Handle debounced search changes
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== (filters.search || "")) {
        onFilterChange({ search: searchInput });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput, filters.search, onFilterChange]);

  const hasActiveFilters = Boolean(
    filters.action ||
    filters.entityType ||
    filters.userId ||
    filters.search ||
    activePreset !== "allTime"
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-xs">
      {/* Top Row: Date Presets & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Date Presets Pill Group */}
        <div className="flex flex-wrap items-center rounded-lg bg-muted/60 p-1 border border-border/60 gap-0.5">
          {(
            [
              { id: "today", label: t("filters.quick.today") },
              { id: "yesterday", label: t("filters.quick.yesterday") },
              { id: "last7Days", label: t("filters.quick.last7Days") },
              { id: "thisMonth", label: t("filters.quick.thisMonth") },
              { id: "allTime", label: t("filters.quick.allTime") },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPresetChange(item.id)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap",
                activePreset === item.id
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Refresh & Reset Controls */}
        <div className="flex items-center gap-1.5 ms-auto">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="size-3.5" />
              <span>{t("filters.reset")}</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 px-2.5 text-xs font-medium gap-1"
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            <span>{t("filters.refresh")}</span>
          </Button>
        </div>
      </div>

      {/* Bottom Row: Multi-Criteria Filter Dropdowns & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("filters.searchPlaceholder")}
            className="h-9 ps-9 pe-8 text-xs bg-background/90"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                onFilterChange({ search: "" });
              }}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Action Select */}
        <div>
          <select
            value={filters.action || ""}
            onChange={(e) =>
              onFilterChange({
                action: e.target.value ? (e.target.value as AuditAction) : undefined,
              })
            }
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
          >
            <option value="">{t("filters.allActions")}</option>
            {ACTION_OPTIONS.map((action) => (
              <option key={action} value={action}>
                {t(`actions.${action}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Entity Type Select */}
        <div>
          <select
            value={filters.entityType || ""}
            onChange={(e) =>
              onFilterChange({
                entityType: e.target.value || undefined,
              })
            }
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
          >
            <option value="">{t("filters.allEntities")}</option>
            {ENTITY_OPTIONS.map((entity) => (
              <option key={entity} value={entity}>
                {t(`entities.${entity}`)}
              </option>
            ))}
          </select>
        </div>

        {/* User Select */}
        <div>
          <select
            value={filters.userId || ""}
            onChange={(e) =>
              onFilterChange({
                userId: e.target.value || undefined,
              })
            }
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
          >
            <option value="">{t("filters.allUsers")}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({tRoles.has(u.role) ? tRoles(u.role) : u.role})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
