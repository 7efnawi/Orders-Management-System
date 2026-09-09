"use client";

import * as React from "react";
import { useFormatter, useTranslations, useLocale } from "next-intl";
import { AuditAction, Role } from "@prisma/client";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeAuditDiff, type AuditLogWithUser } from "@/services/audit";
import { cn } from "@/lib/utils";

interface AuditTableProps {
  logs: AuditLogWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onViewDiff: (log: AuditLogWithUser) => void;
}

const ACTION_STYLES: Record<AuditAction, { badgeClass: string; dotClass: string }> = {
  CREATE: {
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  UPDATE: {
    badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    dotClass: "bg-blue-500",
  },
  CANCEL: {
    badgeClass: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    dotClass: "bg-red-500",
  },
  STATUS_CHANGE: {
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  DISCOUNT_REQUEST: {
    badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
    dotClass: "bg-purple-500",
  },
  DISCOUNT_APPROVE: {
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  DISCOUNT_REJECT: {
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
    dotClass: "bg-rose-500",
  },
};

const ROLE_STYLES: Record<Role, { badgeClass: string; avatarClass: string }> = {
  OWNER: {
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    avatarClass: "bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-amber-700 dark:text-amber-300 border-amber-500/40",
  },
  MANAGER: {
    badgeClass: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
    avatarClass: "bg-gradient-to-br from-indigo-500/20 to-indigo-600/30 text-indigo-700 dark:text-indigo-300 border-indigo-500/40",
  },
  CASHIER: {
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    avatarClass: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
  },
};

function getSummarySnippet(log: AuditLogWithUser, isAr: boolean): string {
  if (log.action === "CREATE") {
    return isAr ? "إنشاء سجل جديد" : "Created new entity record";
  }
  if (log.action === "CANCEL") {
    const reason = log.newValue?.cancelReason || log.oldValue?.cancelReason;
    return reason
      ? `${isAr ? "سبب الإلغاء" : "Cancel reason"}: ${reason}`
      : isAr ? "إلغاء الطلب" : "Order cancelled";
  }
  if (log.action === "DISCOUNT_APPROVE") {
    const amount = log.newValue?.discountAmount ?? log.oldValue?.discountAmount;
    return amount != null
      ? `${isAr ? "اعتماد خصم" : "Approved discount"}: ${amount} EGP`
      : isAr ? "اعتماد الخصم" : "Discount approved";
  }
  if (log.action === "DISCOUNT_REJECT") {
    return isAr ? "رفض طلب الخصم" : "Discount request rejected";
  }
  if (log.action === "STATUS_CHANGE") {
    const oldStatus = log.oldValue?.status;
    const newStatus = log.newValue?.status;
    if (oldStatus && newStatus) {
      return `${oldStatus} ➔ ${newStatus}`;
    }
  }

  const diffs = computeAuditDiff(log.oldValue, log.newValue);
  if (diffs.length === 1) {
    const d = diffs[0];
    const fieldName = isAr ? d.labelAr : d.labelEn;
    const oldVal = d.oldValue != null ? String(d.oldValue) : "—";
    const newVal = d.newValue != null ? String(d.newValue) : "—";
    return `${fieldName}: ${oldVal} ➔ ${newVal}`;
  }
  if (diffs.length > 1) {
    const names = diffs.slice(0, 2).map((d) => (isAr ? d.labelAr : d.labelEn)).join(", ");
    const extra = diffs.length > 2 ? ` (+${diffs.length - 2})` : "";
    return `${isAr ? "تعديل" : "Modified"}: ${names}${extra}`;
  }
  return "—";
}

export function AuditTable({
  logs,
  total,
  page,
  limit,
  totalPages,
  isLoading,
  onPageChange,
  onLimitChange,
  onViewDiff,
}: AuditTableProps) {
  const t = useTranslations("audit");
  const tRoles = useTranslations("roles");
  const format = useFormatter();
  const locale = useLocale();
  const isAr = locale === "ar";

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs flex flex-col">
      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
              <th className="px-4 py-3.5 text-start font-semibold">{t("table.timestamp")}</th>
              <th className="px-4 py-3.5 text-start font-semibold">{t("table.user")}</th>
              <th className="px-4 py-3.5 text-start font-semibold">{t("table.action")}</th>
              <th className="px-4 py-3.5 text-start font-semibold">{t("table.entity")}</th>
              <th className="px-4 py-3.5 text-start font-semibold hidden md:table-cell">{t("table.summary")}</th>
              <th className="px-4 py-3.5 text-end font-semibold">{t("table.details")}</th>
            </tr>
          </thead>
          <tbody className={cn("divide-y divide-border/60 transition-opacity", isLoading && "opacity-60")}>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="size-8 text-muted-foreground/60" />
                    <p className="text-sm font-medium">{t("table.empty")}</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const actionStyle = ACTION_STYLES[log.action] || ACTION_STYLES.STATUS_CHANGE;
                const roleStyle = ROLE_STYLES[log.user.role] || ROLE_STYLES.CASHIER;

                const initials = log.user.name
                  ? log.user.name
                      .trim()
                      .split(/\s+/)
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "U";

                const dateObj = new Date(log.timestamp);
                const formattedDate = format.dateTime(dateObj, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const formattedTime = dateObj.toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });

                const summaryText = getSummarySnippet(log, isAr);

                return (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    {/* Timestamp Column */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{formattedDate}</span>
                        <span className="font-mono text-3xs text-muted-foreground tabular-nums flex items-center gap-1 mt-0.5">
                          <Clock className="size-3" />
                          {formattedTime}
                        </span>
                      </div>
                    </td>

                    {/* User Column */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full border text-3xs font-bold",
                            roleStyle.avatarClass
                          )}
                        >
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-semibold text-foreground">{log.user.name}</span>
                          <span className="text-3xs text-muted-foreground">
                            {tRoles.has(log.user.role) ? tRoles(log.user.role) : log.user.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={cn("gap-1.5 px-2 py-0.5 text-xs font-semibold", actionStyle.badgeClass)}
                      >
                        <span className={cn("size-1.5 rounded-full", actionStyle.dotClass)} />
                        {t(`actions.${log.action}`)}
                      </Badge>
                    </td>

                    {/* Entity Column */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="bg-secondary/50 text-secondary-foreground text-3xs font-medium border-border/70">
                          {t.has(`entities.${log.entityType}`) ? t(`entities.${log.entityType}`) : log.entityType}
                        </Badge>
                        <span className="font-mono text-3xs text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/40">
                          #{log.entityId}
                        </span>
                      </div>
                    </td>

                    {/* Summary Column */}
                    <td className="px-4 py-3 align-middle hidden md:table-cell max-w-xs">
                      <span className="text-xs text-foreground/90 truncate block" title={summaryText}>
                        {summaryText}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="px-4 py-3 align-middle text-end whitespace-nowrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDiff(log)}
                        className="h-8 px-2.5 text-xs font-semibold gap-1 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                      >
                        <Eye className="size-3.5" />
                        <span>{t("table.viewDiff")}</span>
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
      <div className="border-t border-border/80 bg-muted/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        {/* Results Count */}
        <div className="tabular-nums">
          {t("table.showingResults", { from, to, total })}
        </div>

        {/* Page Controls & Size Selector */}
        <div className="flex items-center gap-3 ms-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{t("table.perPage")}:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-7 rounded border border-input bg-background px-2 text-xs font-medium text-foreground focus-visible:outline-none"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
              className="size-7"
              aria-label={t("table.previous")}
            >
              <ChevronLeft className="size-3.5 rtl:rotate-180" />
            </Button>

            <span className="font-mono text-xs text-foreground px-2 tabular-nums">
              {page} / {totalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
              className="size-7"
              aria-label={t("table.next")}
            >
              <ChevronRight className="size-3.5 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
