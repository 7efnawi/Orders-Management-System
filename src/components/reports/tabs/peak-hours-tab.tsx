"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { PeakHoursHeatmap } from "@/components/reports/charts/peak-hours-heatmap";
import type { PeakHoursPayload } from "@/services/reports";

interface PeakHoursTabProps {
  data: PeakHoursPayload | null;
  loading: boolean;
  formatCurrency: (v: number) => string;
}

export function PeakHoursTab({ data, loading, formatCurrency }: PeakHoursTabProps) {
  const t = useTranslations("reports.peakHours");

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>{t("loading")}</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        {t("noData")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PeakHoursHeatmap
        heatmap={data.heatmap}
        hourly={data.hourly}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
