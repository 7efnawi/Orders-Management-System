"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { TopProductsChart } from "@/components/reports/charts/top-products-chart";
import { BrandPerformanceChart } from "@/components/reports/charts/brand-performance-chart";
import { cn } from "@/lib/utils";
import type { ReportsPayload } from "@/services/reports";

interface ProductsTabProps {
  data: ReportsPayload;
  formatCurrency: (v: number) => string;
}

export function ProductsTab({ data, formatCurrency }: ProductsTabProps) {
  const t = useTranslations("reports.products");
  const products = data.topProducts;
  const maxRev = Math.max(...products.map((p) => p.revenue), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-7">
          <TopProductsChart data={products} formatCurrency={formatCurrency} />
        </div>
        <div className="lg:col-span-5">
          <BrandPerformanceChart data={data.platformBrand} formatCurrency={formatCurrency} />
        </div>
      </div>

      <Card className="border-border/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                <th className="p-3 text-center w-12">{t("table.rank")}</th>
                <th className="p-3 text-start">{t("table.product")}</th>
                <th className="p-3 text-center">{t("table.qty")}</th>
                <th className="p-3 text-center">{t("table.orders")}</th>
                <th className="p-3 text-end">{t("table.revenue")}</th>
                <th className="p-3 text-end w-32">{t("table.share")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {t("table.empty")}
                  </td>
                </tr>
              ) : (
                products.map((p, idx) => (
                  <tr key={p.productId} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-center">
                      <span
                        className={cn(
                          "inline-flex size-6 items-center justify-center rounded-full font-mono text-xs font-bold",
                          idx === 0
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                            : idx === 1
                            ? "bg-slate-500/20 text-slate-600 dark:text-slate-300 border border-slate-500/40"
                            : idx === 2
                            ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/40"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-foreground">{p.productName}</td>
                    <td className="p-3 text-center font-mono font-bold text-primary">{p.quantity}</td>
                    <td className="p-3 text-center font-mono text-muted-foreground">
                      {p.ordersCount}
                    </td>
                    <td className="p-3 text-end font-mono font-bold text-foreground">
                      {formatCurrency(p.revenue)}
                    </td>
                    <td className="p-3 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(p.revenue / maxRev) * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground w-8 text-end">
                          {Math.round((p.revenue / maxRev) * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
