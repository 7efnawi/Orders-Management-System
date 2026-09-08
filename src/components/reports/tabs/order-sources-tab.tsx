"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { PlatformShareChart } from "@/components/reports/charts/platform-share-chart";
import { BrandPerformanceChart } from "@/components/reports/charts/brand-performance-chart";
import { PlatformLogo } from "@/components/ui/platform-logo";
import { getBrandToken } from "@/lib/visualTokens";
import type { ReportsPayload } from "@/services/reports";

interface OrderSourcesTabProps {
  data: ReportsPayload;
  formatCurrency: (v: number) => string;
}

export function OrderSourcesTab({ data, formatCurrency }: OrderSourcesTabProps) {
  const t = useTranslations("reports.orderSources");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-5">
          <PlatformShareChart data={data.platformBrand} formatCurrency={formatCurrency} />
        </div>
        <div className="lg:col-span-7">
          <BrandPerformanceChart data={data.platformBrand} formatCurrency={formatCurrency} />
        </div>
      </div>

      <Card className="border-border/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                <th className="p-3 text-start">{t("table.platform")}</th>
                <th className="p-3 text-start">{t("table.brand")}</th>
                <th className="p-3 text-center">{t("table.orders")}</th>
                <th className="p-3 text-end">{t("table.revenue")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.platformBrand.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    {t("table.empty")}
                  </td>
                </tr>
              ) : (
                data.platformBrand.map((row, idx) => {
                  const brandToken = getBrandToken(row.brandName);
                  return (
                    <tr
                      key={`${row.platformName}-${row.brandName}-${idx}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <PlatformLogo platformName={row.platformName} size="xs" />
                          <span className="font-semibold">{row.platformName}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold opacity-80">
                            {brandToken.kanji}
                          </span>
                          <span className="font-medium">{row.brandName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-bold">{row.orders}</td>
                      <td className="p-3 text-end font-mono font-bold text-foreground">
                        {formatCurrency(row.sales)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
