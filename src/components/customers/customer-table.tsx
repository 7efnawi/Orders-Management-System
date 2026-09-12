"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Phone,
  Copy,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  User as UserIcon,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerListItem } from "@/services/customers";
import { formatCustomerPhone } from "@/lib/customers";
import { cn } from "@/lib/utils";

interface CustomerTableProps {
  customers: CustomerListItem[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
}

export function CustomerTable({
  customers,
  total,
  page,
  totalPages,
  limit,
  onPageChange,
  isLoading,
}: CustomerTableProps) {
  const t = useTranslations("customers.table");
  const tTiers = useTranslations("customers.tiers");
  const locale = useLocale();
  const isAr = locale === "ar";
  const [copiedPhoneId, setCopiedPhoneId] = React.useState<string | null>(null);

  const from = total > 0 ? (page - 1) * limit + 1 : 0;
  const to = Math.min(page * limit, total);

  function handleCopyPhone(e: React.MouseEvent, id: string, rawPhone: string) {
    e.stopPropagation();
    e.preventDefault();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(rawPhone);
      setCopiedPhoneId(id);
      setTimeout(() => setCopiedPhoneId(null), 2000);
    }
  }

  function getTierBadge(item: CustomerListItem) {
    const tier = item.tier;
    const isNew = item.totalOrders <= 1;

    if (isNew) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {tTiers("NEW")}
        </span>
      );
    }

    if (tier === "PLATINUM") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs">
          {tTiers("PLATINUM")}
        </span>
      );
    }

    if (tier === "GOLD") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          {tTiers("GOLD")}
        </span>
      );
    }

    if (tier === "SILVER") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {tTiers("SILVER")}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
        {tTiers("BRONZE")}
      </span>
    );
  }

  function formatDisplayDate(date: Date | string | null): string {
    if (!date) return isAr ? "لا يوجد" : "None";
    const d = new Date(date);
    if (isNaN(d.getTime())) return isAr ? "لا يوجد" : "None";
    return d.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-fixed w-full text-sm divide-y divide-border/60">
            <colgroup>
              <col className="w-[30%] min-w-[200px]" />
              <col className="w-[20%] min-w-[150px]" />
              <col className="w-[15%] min-w-[120px]" />
              <col className="w-[15%] min-w-[110px]" />
              <col className="w-[12%] min-w-[100px]" />
              <col className="w-[8%] min-w-[80px]" />
            </colgroup>
            <thead className="bg-muted/40 text-muted-foreground font-medium text-xs">
              <tr>
                <th scope="col" className="px-4 py-3 text-start">
                  {t("customer")}
                </th>
                <th scope="col" className="px-4 py-3 text-start">
                  {t("phone")}
                </th>
                <th scope="col" className="px-4 py-3 text-start">
                  {t("tier")}
                </th>
                <th scope="col" className="px-4 py-3 text-start">
                  {t("ordersCount")}
                </th>
                <th scope="col" className="px-4 py-3 text-start">
                  {t("lastOrder")}
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserX className="w-8 h-8 text-muted-foreground/60 stroke-[1.5]" />
                      <p className="text-sm font-medium">{t("empty")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const phoneInfo = formatCustomerPhone(customer.phone);
                  const isCopied = copiedPhoneId === customer.id;

                  return (
                    <tr
                      key={customer.id}
                      className={cn(
                        "hover:bg-muted/40 transition-colors group",
                        isLoading && "opacity-60"
                      )}
                    >
                      {/* Customer Info (Avatar & Name) */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/customers/${customer.id}`}
                              className="font-semibold text-foreground hover:text-primary transition-colors truncate block"
                            >
                              {customer.name || (isAr ? "بدون اسم" : "Unnamed")}
                            </Link>
                            {customer.address && (
                              <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                                {customer.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Direction-safe Phone Chip */}
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 bg-muted/60 hover:bg-muted px-2 py-1 rounded-md border border-border/60 transition-colors">
                          <span
                            dir="ltr"
                            className="font-mono text-xs font-semibold tabular-nums text-foreground select-all"
                          >
                            {phoneInfo.display || customer.phone}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyPhone(e, customer.id, phoneInfo.raw || customer.phone)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                            title="Copy phone"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Loyalty Tier Badge */}
                      <td className="px-4 py-3">
                        {getTierBadge(customer)}
                      </td>

                      {/* Orders Count & Problem Indicator */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm tabular-nums text-foreground">
                            {customer.totalOrders}
                          </span>
                          {customer.problemCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="px-1.5 py-0 text-[10px] font-medium gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>{t("problemBadge", { count: customer.problemCount })}</span>
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Last Order Date */}
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDisplayDate(customer.lastOrderAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Link href={`/customers/${customer.id}`}>
                            <span>{t("viewProfile")}</span>
                            <ExternalLink className="w-3.5 h-3.5 ms-1 rtl:rotate-180" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-muted/20 border-t border-border/60 text-xs text-muted-foreground">
            <div>
              {t("showingResults", { from, to, total })}
            </div>

            <div className="flex items-center gap-2">
              <span className="tabular-nums font-medium text-foreground">
                {t("page")} {page} {t("of")} {totalPages}
              </span>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1 || isLoading}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                  <span className="sr-only">{t("previous")}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages || isLoading}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  <span className="sr-only">{t("next")}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
