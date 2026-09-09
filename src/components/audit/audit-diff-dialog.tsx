"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { AuditAction, Role } from "@prisma/client";
import {
  ArrowRight,
  Clock,
  User as UserIcon,
  Tag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  computeAuditDiff,
  formatDomainValue,
  formatHumanEntityId,
  STATUS_MAP_AR,
  type AuditLogWithUser,
  type FieldDiff,
} from "@/lib/auditDiff";
import { cn } from "@/lib/utils";

interface AuditDiffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: AuditLogWithUser | null;
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

const ROLE_STYLES: Record<Role, { badgeClass: string }> = {
  OWNER: {
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  MANAGER: {
    badgeClass: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
  },
  CASHIER: {
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
};

export function AuditDiffDialog({ open, onOpenChange, log }: AuditDiffDialogProps) {
  const t = useTranslations("audit");
  const tRoles = useTranslations("roles");
  const locale = useLocale();
  const isAr = locale === "ar";

  const diffs: FieldDiff[] = React.useMemo(() => {
    if (!log) return [];
    return computeAuditDiff(log.oldValue, log.newValue);
  }, [log]);

  const renderFormattedValue = (value: any, field: string, type: FieldDiff["type"]) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-muted-foreground italic font-sans text-xs">—</span>;
    }

    if (
      type === "currency" ||
      (typeof value === "number" &&
        (field.toLowerCase().includes("amount") ||
          field.toLowerCase().includes("discount") ||
          field.toLowerCase().includes("total") ||
          field.toLowerCase().includes("price") ||
          field.toLowerCase().includes("cash")))
    ) {
      const formatted = formatDomainValue(value, field, "currency", isAr);
      return (
        <span className="tabular-nums font-semibold text-foreground text-sm">
          {formatted}
        </span>
      );
    }

    if (type === "boolean" || typeof value === "boolean") {
      const isTrue = Boolean(value);
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-xs font-semibold px-2.5 py-0.5 shadow-2xs",
            isTrue
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              : "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30"
          )}
        >
          {field === "isActive"
            ? isTrue
              ? isAr
                ? "نشط"
                : "Active"
              : isAr
              ? "معطل"
              : "Inactive"
            : isTrue
            ? isAr
              ? "نعم"
              : "Yes"
            : isAr
            ? "لا"
            : "No"}
        </Badge>
      );
    }

    if (type === "role" || field === "role") {
      const role = value as Role;
      const roleStyle = ROLE_STYLES[role] || ROLE_STYLES.CASHIER;
      const roleText = formatDomainValue(value, "role", "role", isAr);
      return (
        <Badge variant="outline" className={cn("text-xs font-semibold px-2.5 py-0.5 shadow-2xs", roleStyle.badgeClass)}>
          {roleText}
        </Badge>
      );
    }

    if (
      type === "status" ||
      field.toLowerCase().includes("status") ||
      (typeof value === "string" && STATUS_MAP_AR[value.toUpperCase()])
    ) {
      const statusText = formatDomainValue(value, field, "status", isAr);
      return (
        <Badge
          variant="outline"
          className="bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium text-xs border-amber-500/30 px-2.5 py-0.5 shadow-2xs"
        >
          {statusText}
        </Badge>
      );
    }

    if (type === "json" || typeof value === "object") {
      return (
        <div className="font-mono text-xs whitespace-pre-wrap break-all max-h-36 overflow-y-auto p-2 rounded-lg bg-muted/40 border border-border/50 text-foreground">
          {JSON.stringify(value, null, 2)}
        </div>
      );
    }

    return <span className="break-words font-medium text-foreground text-xs sm:text-sm">{String(value)}</span>;
  };

  if (!log) return null;

  const actionStyle = ACTION_STYLES[log.action] || ACTION_STYLES.STATUS_CHANGE;
  const userRoleStyle = ROLE_STYLES[log.user.role] || ROLE_STYLES.CASHIER;
  const formattedId = formatHumanEntityId(log);

  const dateObj = new Date(log.timestamp);
  const formattedDate = dateObj.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[88vh] overflow-y-auto flex flex-col gap-5 p-5 sm:p-8">
        <DialogHeader className="gap-2.5 border-b border-border/60 pb-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("gap-1.5 px-2.5 py-1 text-xs font-semibold", actionStyle.badgeClass)}>
                <span className={cn("size-2 rounded-full", actionStyle.dotClass)} />
                {t(`actions.${log.action}`)}
              </Badge>

              <Badge variant="outline" className="bg-secondary/60 text-secondary-foreground border-border/80 text-xs font-medium">
                {t.has(`entities.${log.entityType}`) ? t(`entities.${log.entityType}`) : log.entityType}
              </Badge>

              <span
                dir="ltr"
                className="font-mono text-xs text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded border border-border/40 tabular-nums font-semibold"
                title={formattedId.full}
              >
                {formattedId.display}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              <span className="tabular-nums font-medium">{formattedDate} {formattedTime}</span>
            </div>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-foreground mt-1">
            {t("diffDialog.title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("diffDialog.subtitle")}
          </DialogDescription>
        </DialogHeader>

        {/* Metadata Summary Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 p-4 rounded-xl bg-muted/35 border border-border/60 text-xs">
          <div>
            <span className="text-muted-foreground block mb-1">{t("diffDialog.metaActor")}</span>
            <div className="flex items-center gap-1.5 font-semibold text-foreground truncate">
              <UserIcon className="size-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{log.user.name}</span>
            </div>
          </div>

          <div>
            <span className="text-muted-foreground block mb-1">{t("table.user")} ({t("diffDialog.metaAction")})</span>
            <Badge variant="outline" className={cn("text-3xs font-semibold px-2 py-0.5", userRoleStyle.badgeClass)}>
              {tRoles(log.user.role)}
            </Badge>
          </div>

          <div>
            <span className="text-muted-foreground block mb-1">{t("diffDialog.metaEntity")}</span>
            <span className="font-semibold text-foreground truncate block">
              {t.has(`entities.${log.entityType}`) ? t(`entities.${log.entityType}`) : log.entityType}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block mb-1">{t("diffDialog.metaTime")}</span>
            <span className="font-mono text-foreground truncate block tabular-nums">
              {formattedDate} {formattedTime}
            </span>
          </div>
        </div>

        {/* Semantic Field Diff List */}
        <div className="flex flex-col gap-3.5 py-1">
          {diffs.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-border/80 bg-muted/20">
              <Tag className="size-8 text-muted-foreground/60 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">{t("diffDialog.noChanges")}</p>
            </div>
          ) : (
            diffs.map((diff, idx) => (
              <div
                key={`diff-item-${idx}`}
                className="flex flex-col gap-3 p-4 rounded-xl border border-border/70 bg-card shadow-2xs hover:border-border transition-colors"
              >
                {/* Field Header - Friendly label only without raw field code */}
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary/70" />
                    <span className="text-sm font-bold text-foreground">
                      {isAr ? diff.labelAr : diff.labelEn}
                    </span>
                  </div>
                </div>

                {/* Diff Comparison Row - Symmetric balanced grid */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-stretch gap-3 sm:gap-4 text-xs">
                  {/* Previous Value Card */}
                  <div className="flex flex-col justify-between gap-2 p-3.5 sm:p-4 rounded-xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 text-foreground min-w-0 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-2xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="flex size-4 items-center justify-center rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono text-xs font-bold">-</span>
                        {t("diffDialog.previousValue")}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center min-h-[36px] mt-1 text-foreground">
                      {renderFormattedValue(diff.oldValue, diff.field, diff.type)}
                    </div>
                  </div>

                  {/* Transition Arrow Indicator */}
                  <div className="flex justify-center items-center py-1 md:py-0">
                    <div className="size-8 rounded-full bg-muted/80 flex items-center justify-center border border-border/70 shadow-2xs text-muted-foreground shrink-0">
                      <ArrowRight className="size-4 rtl:rotate-180" />
                    </div>
                  </div>

                  {/* New Value Card */}
                  <div className="flex flex-col justify-between gap-2 p-3.5 sm:p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 text-foreground min-w-0 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-2xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="flex size-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold">+</span>
                        {t("diffDialog.newValue")}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center min-h-[36px] mt-1 text-foreground">
                      {renderFormattedValue(diff.newValue, diff.field, diff.type)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="border-t border-border/60 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-9 text-xs font-semibold"
          >
            {t("diffDialog.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
