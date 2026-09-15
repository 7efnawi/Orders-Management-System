"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Copy,
  Check,
  AlertTriangle,
  Star,
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
  const tSegments = useTranslations("customers.segments");
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

  function getSegmentBadge(customer: CustomerListItem) {
    const seg = customer.segment || "REGULAR";
    const label = tSegments(seg as "VIP" | "REGULAR" | "NEW" | "AT_RISK" | "INACTIVE") || seg;

    if (seg === "VIP") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
          <Star className="w-3 h-3 text-amber-600 dark:text-amber-400 fill-amber-500" />
          <span>{label}</span>
        </span>
      );
    }

    if (seg === "REGULAR") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          {label}
        </span>
      );
    }

    if (seg === "NEW") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
          {label}
        </span>
      );
    }

    if (seg === "AT_RISK") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-900 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
          <AlertTriangle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
          <span>{label}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700">
        {label}
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
    <div className="space-y-3 w-full min-w-0">
      <div className="w-full min-w-0 rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="table-fixed w-full text-sm divide-y divide-border/60">
            <colgroup>
              <col className="w-[22%] min-w-[170px]" />
              <col className="w-[16%] min-w-[140px]" />
              <col className="w-[14%] min-w-[120px]" />
              <col className="w-[11%] min-w-[95px]" />
              <col className="w-[14%] min-w-[120px]" />
              <col className="w-[13%] min-w-[110px]" />
              <col className="w-[10%] min-w-[95px]" />
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
                  {t("segment")}
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  {t("ordersCount")}
                </th>
                <th scope="col" className="px-4 py-3 text-start">
                  {t("spent")}
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
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
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
                  const totalSpent = customer.spent ?? customer.totalSpent ?? 0;

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
                              className="font-semibold text-foreground hover:text-primary transition-colors truncate block text-xs sm:text-sm"
                            >
                              {customer.name || (isAr ? "بدون اسم" : "Unnamed")}
                            </Link>
                            {customer.address && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
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

                      {/* Customer Segment Badge */}
                      <td className="px-4 py-3">
                        {getSegmentBadge(customer)}
                      </td>

                      {/* Orders Count & Problem Indicator */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
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

                      {/* Total Spent */}
                      <td className="px-4 py-3">
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono font-bold text-sm tabular-nums text-foreground">
                            {totalSpent.toLocaleString(isAr ? "ar-EG" : "en-US", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {isAr ? "ج.م" : "EGP"}
                          </span>
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
