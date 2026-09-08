"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EmployeesPayload } from "@/services/reports";

interface EmployeesTabProps {
  data: EmployeesPayload | null;
  loading: boolean;
  formatCurrency: (v: number) => string;
}

export function EmployeesTab({ data, loading, formatCurrency }: EmployeesTabProps) {
  const t = useTranslations("reports.employees");
  const [view, setView] = React.useState<"employees" | "discounts">("employees");

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
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        {(["employees", "discounts"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors",
              view === v
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {v === "employees" ? (
              t("teamPerformance")
            ) : (
              <span className="flex items-center gap-1.5">
                <span>{t("discountsLog")}</span>
                {data.discounts.length > 0 && (
                  <span className="bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full px-1.5 py-0.5 text-[10px] font-mono font-bold">
                    {data.discounts.length}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {view === "employees" && (
        <Card className="border-border/70 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-3 text-start">{t("table.cashier")}</th>
                  <th className="p-3 text-center">{t("table.totalOrders")}</th>
                  <th className="p-3 text-center">{t("table.cancelled")}</th>
                  <th className="p-3 text-end">{t("table.revenue")}</th>
                  <th className="p-3 text-end">{t("table.aov")}</th>
                  <th className="p-3 text-center">{t("table.discountsApproved")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      {t("table.empty")}
                    </td>
                  </tr>
                ) : (
                  data.employees.map((emp) => (
                    <tr key={emp.cashierId} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-semibold text-foreground">{emp.cashierName}</td>
                      <td className="p-3 text-center font-mono font-bold">{emp.totalOrders}</td>
                      <td className="p-3 text-center font-mono text-rose-600 dark:text-rose-400 font-semibold">
                        {emp.cancelledOrders}
                      </td>
                      <td className="p-3 text-end font-mono font-bold text-foreground">
                        {formatCurrency(emp.totalRevenue)}
                      </td>
                      <td className="p-3 text-end font-mono text-muted-foreground">
                        {formatCurrency(emp.avgOrderValue)}
                      </td>
                      <td className="p-3 text-center">
                        {emp.discountsApproved > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-mono font-semibold">
                            {emp.discountsApproved} ({formatCurrency(emp.discountsApprovedValue)})
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {view === "discounts" && (
        <Card className="border-border/70 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-3 text-start">{t("disc.orderNum")}</th>
                  <th className="p-3 text-start">{t("disc.cashier")}</th>
                  <th className="p-3 text-start">{t("disc.approver")}</th>
                  <th className="p-3 text-start">{t("disc.reason")}</th>
                  <th className="p-3 text-center">{t("disc.status")}</th>
                  <th className="p-3 text-end">{t("disc.value")}</th>
                  <th className="p-3 text-end">{t("disc.date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.discounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {t("disc.empty")}
                    </td>
                  </tr>
                ) : (
                  data.discounts.map((row) => (
                    <tr key={row.orderId} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-semibold text-foreground">
                        #{row.orderNumber}
                      </td>
                      <td className="p-3 font-medium">{row.cashierName}</td>
                      <td className="p-3 text-muted-foreground">{row.approverName ?? "—"}</td>
                      <td className="p-3 text-muted-foreground max-w-[150px] truncate">
                        {row.discountReason ?? "—"}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          className={cn(
                            "text-[10px] font-semibold border-0",
                            row.discountStatus === "APPROVED"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                          )}
                        >
                          {row.discountStatus}
                        </Badge>
                      </td>
                      <td className="p-3 text-end font-mono font-bold text-rose-600 dark:text-rose-400">
                        -{formatCurrency(row.discountValue)}
                      </td>
                      <td className="p-3 text-end font-mono text-muted-foreground">
                        {row.orderDate}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
