"use client";

import * as React from "react";
import { ReportsKpiGrid } from "@/components/reports/reports-kpi-grid";
import { RevenueTrendChart } from "@/components/reports/charts/revenue-trend-chart";
import { PlatformShareChart } from "@/components/reports/charts/platform-share-chart";
import type { ReportsPayload } from "@/services/reports";

interface OverviewTabProps {
  data: ReportsPayload;
  formatCurrency: (v: number) => string;
}

export function OverviewTab({ data, formatCurrency }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <ReportsKpiGrid
        summary={data.summary}
        comparison={data.comparison}
        formatCurrency={formatCurrency}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-7">
          <RevenueTrendChart data={data.dailyBreakdown} formatCurrency={formatCurrency} />
        </div>
        <div className="lg:col-span-5">
          <PlatformShareChart data={data.platformBrand} formatCurrency={formatCurrency} />
        </div>
      </div>
    </div>
  );
}
