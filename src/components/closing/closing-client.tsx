"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Clock, History, LockOpen, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OpenShiftCard } from "./open-shift-card";
import { ActiveShiftSummary } from "./active-shift-summary";
import { ClosingHistoryTable } from "./closing-history-table";
import type { ShiftPreviewResult } from "@/services/closing";
import type { ClosingDetailsItem } from "./closing-details-modal";
import { cn } from "@/lib/utils";

export type ClosingTab = "activeShift" | "history";

export interface ClosingClientProps {
  initialShiftPreview: ShiftPreviewResult | null;
  initialClosings: ClosingDetailsItem[];
  initialTotalClosingsCount: number;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function ClosingClient({
  initialShiftPreview,
  initialClosings,
  initialTotalClosingsCount,
  currentUser,
}: ClosingClientProps) {
  const t = useTranslations("closing");
  const tTabs = useTranslations("closing.tabs");
  const tCommon = useTranslations("common");

  const [activeTab, setActiveTab] = useState<ClosingTab>("activeShift");
  const [shiftPreview, setShiftPreview] = useState<ShiftPreviewResult | null>(
    initialShiftPreview
  );
  const [refreshing, setRefreshing] = useState(false);

  // Fetch / Refresh current active shift status
  const refreshCurrentShift = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/shifts/current");
      if (!res.ok) throw new Error("Failed to check current shift");
      const data = await res.json();

      if (data.shift?.id) {
        // Fetch full live preview
        const previewRes = await fetch(`/api/shifts/${data.shift.id}/preview`);
        if (previewRes.ok) {
          const previewData = await previewRes.json();
          setShiftPreview(previewData);
          return;
        }
      }
      setShiftPreview(null);
    } catch {
      // fallback
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleShiftOpened = async () => {
    await refreshCurrentShift();
  };

  const handleShiftClosed = async () => {
    setShiftPreview(null);
    setActiveTab("history");
  };

  const hasActiveShift = shiftPreview !== null && shiftPreview.shift.closedAt === null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Top Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshCurrentShift}
            disabled={refreshing}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            <span>{tCommon("loading")}</span>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Button
          type="button"
          variant={activeTab === "activeShift" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("activeShift")}
          className="rounded-full px-4 text-xs font-semibold gap-1.5"
        >
          {hasActiveShift ? (
            <LockOpen className="size-3.5 text-emerald-400" />
          ) : (
            <Clock className="size-3.5" />
          )}
          <span>{tTabs("activeShift")}</span>
          <Badge
            variant="secondary"
            className={cn(
              "ms-1 px-1.5 py-0 text-[10px]",
              activeTab === "activeShift"
                ? "bg-primary-foreground text-primary"
                : hasActiveShift
                ? "bg-emerald-500/20 text-emerald-600"
                : ""
            )}
          >
            {hasActiveShift ? "1" : "0"}
          </Badge>
        </Button>

        <Button
          type="button"
          variant={activeTab === "history" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("history")}
          className="rounded-full px-4 text-xs font-semibold gap-1.5"
        >
          <History className="size-3.5" />
          <span>{tTabs("history")}</span>
          <Badge
            variant="secondary"
            className={cn(
              "ms-1 px-1.5 py-0 text-[10px]",
              activeTab === "history" ? "bg-primary-foreground text-primary" : ""
            )}
          >
            {initialTotalClosingsCount}
          </Badge>
        </Button>
      </div>

      {/* Tab 1: Current Shift */}
      {activeTab === "activeShift" && (
        <div>
          {hasActiveShift ? (
            <ActiveShiftSummary
              initialPreview={shiftPreview!}
              onShiftClosed={handleShiftClosed}
            />
          ) : (
            <div className="py-6">
              <OpenShiftCard
                cashierName={currentUser.name}
                cashierRole={currentUser.role}
                onShiftOpened={handleShiftOpened}
              />
            </div>
          )}
        </div>
      )}

      {/* Tab 2: History */}
      {activeTab === "history" && (
        <ClosingHistoryTable
          initialClosings={initialClosings}
          initialTotalCount={initialTotalClosingsCount}
          userRole={currentUser.role}
          onShiftReopened={async () => {
            await refreshCurrentShift();
            setActiveTab("activeShift");
          }}
        />
      )}
    </div>
  );
}
