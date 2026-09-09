"use client";

import * as React from "react";
import { useFormatter, useTranslations, useLocale } from "next-intl";
import { AuditAction, Role } from "@prisma/client";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Code2,
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
import { computeAuditDiff, type AuditLogWithUser, type FieldDiff } from "@/lib/auditDiff";
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
  const format = useFormatter();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [showRawJson, setShowRawJson] = React.useState(false);
  const [copiedOld, setCopiedOld] = React.useState(false);
  const [copiedNew, setCopiedNew] = React.useState(false);

  const diffs: FieldDiff[] = React.useMemo(() => {
    if (!log) return [];
    return computeAuditDiff(log.oldValue, log.newValue);
  }, [log]);

  const copyToClipboard = async (data: any, type: "old" | "new") => {
    try {
      const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(text);
      if (type === "old") {
        setCopiedOld(true);
        setTimeout(() => setCopiedOld(false), 2000);
      } else {
        setCopiedNew(true);
        setTimeout(() => setCopiedNew(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  const renderFormattedValue = (value: any, type: FieldDiff["type"]) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-muted-foreground italic font-sans">—</span>;
    }

    if (type === "currency" && typeof value === "number") {
      return (
        <span className="tabular-nums font-semibold">
          {format.number(value, { style: "currency", currency: "EGP" })}
        </span>
      );
    }

    if (type === "boolean") {
      const isTrue = Boolean(value);
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-xs font-medium",
            isTrue
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              : "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30"
          )}
        >
          {isTrue ? (isAr ? "نشط / نعم" : "Active / Yes") : (isAr ? "معطل / لا" : "Inactive / No")}
        </Badge>
      );
    }

    if (type === "role" && typeof value === "string") {
      const role = value as Role;
      const roleStyle = ROLE_STYLES[role] || ROLE_STYLES.CASHIER;
      return (
        <Badge variant="outline" className={cn("text-xs font-semibold", roleStyle.badgeClass)}>
          {tRoles.has(role) ? tRoles(role) : value}
        </Badge>
      );
    }

    if (type === "status" && typeof value === "string") {
      return (
        <Badge
          variant="outline"
          className="bg-muted/70 text-foreground font-mono text-xs border-border/80 uppercase"
        >
          {value}
        </Badge>
      );
    }

    if (type === "json" || typeof value === "object") {
      return (
        <pre className="font-mono text-xs whitespace-pre-wrap break-all max-h-32 overflow-y-auto p-1.5 rounded bg-muted/50 border border-border/50 text-foreground">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return <span className="break-words font-medium">{String(value)}</span>;
  };

  if (!log) return null;

  const actionStyle = ACTION_STYLES[log.action] || ACTION_STYLES.STATUS_CHANGE;
  const userRoleStyle = ROLE_STYLES[log.user.role] || ROLE_STYLES.CASHIER;
  const formattedDate = format.dateTime(new Date(log.timestamp), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-4 p-4 sm:p-6">
        <DialogHeader className="gap-2 border-b border-border/60 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("gap-1.5 px-2.5 py-1 text-xs font-semibold", actionStyle.badgeClass)}>
                <span className={cn("size-2 rounded-full", actionStyle.dotClass)} />
                {t(`actions.${log.action}`)}
              </Badge>

              <Badge variant="outline" className="bg-secondary/60 text-secondary-foreground border-border/80 text-xs font-medium">
                {t.has(`entities.${log.entityType}`) ? t(`entities.${log.entityType}`) : log.entityType}
              </Badge>

              <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                #{log.entityId}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              <span className="tabular-nums">{formattedDate}</span>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs">
          <div>
            <span className="text-muted-foreground block mb-0.5">{t("diffDialog.metaActor")}</span>
            <div className="flex items-center gap-1 font-semibold text-foreground truncate">
              <UserIcon className="size-3 text-muted-foreground" />
              <span className="truncate">{log.user.name}</span>
            </div>
          </div>

          <div>
            <span className="text-muted-foreground block mb-0.5">{t("table.user")} ({t("diffDialog.metaAction")})</span>
            <Badge variant="outline" className={cn("text-3xs font-semibold px-1.5 py-0", userRoleStyle.badgeClass)}>
              {tRoles(log.user.role)}
            </Badge>
          </div>

          <div>
            <span className="text-muted-foreground block mb-0.5">{t("diffDialog.metaEntity")}</span>
            <span className="font-semibold text-foreground truncate block">
              {t.has(`entities.${log.entityType}`) ? t(`entities.${log.entityType}`) : log.entityType}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block mb-0.5">{t("diffDialog.metaTime")}</span>
            <span className="font-mono text-foreground truncate block tabular-nums">
              {new Date(log.timestamp).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Semantic Field Diff List */}
        <div className="flex flex-col gap-3 py-1">
          {diffs.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-dashed border-border/80 bg-muted/20">
              <Tag className="size-8 text-muted-foreground/60 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">{t("diffDialog.noChanges")}</p>
            </div>
          ) : (
            diffs.map((diff) => (
              <div
                key={diff.field}
                className="flex flex-col gap-2 p-3 rounded-lg border border-border/70 bg-card/60 shadow-2xs hover:border-border transition-colors"
              >
                {/* Field Header */}
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {isAr ? diff.labelAr : diff.labelEn}
                    </span>
                    <span className="font-mono text-3xs text-muted-foreground bg-muted/70 px-1.5 py-0.5 rounded">
                      {diff.field}
                    </span>
                  </div>
                </div>

                {/* Diff Comparison Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-2 text-xs">
                  {/* Previous Value */}
                  <div className="flex flex-col gap-1 p-2 rounded-md bg-red-500/10 dark:bg-red-950/20 border border-red-500/20 text-red-900 dark:text-red-200 min-w-0">
                    <span className="text-3xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                      <span className="font-mono text-xs">-</span> {t("diffDialog.previousValue")}
                    </span>
                    <div className="mt-0.5">
                      {renderFormattedValue(diff.oldValue, diff.type)}
                    </div>
                  </div>

                  {/* Transition Arrow Indicator */}
                  <div className="flex justify-center items-center py-1 sm:py-0">
                    <div className="size-6 rounded-full bg-muted flex items-center justify-center border border-border/60">
                      <ArrowRight className="size-3.5 text-muted-foreground rtl:rotate-180" />
                    </div>
                  </div>

                  {/* New Value */}
                  <div className="flex flex-col gap-1 p-2 rounded-md bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 min-w-0">
                    <span className="text-3xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="font-mono text-xs">+</span> {t("diffDialog.newValue")}
                    </span>
                    <div className="mt-0.5">
                      {renderFormattedValue(diff.newValue, diff.type)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Collapsible Raw JSON Inspector */}
        <div className="border-t border-border/60 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowRawJson(!showRawJson)}
            className="w-full justify-between h-9 text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <Code2 className="size-4" />
              {t("diffDialog.rawJson")}
            </span>
            {showRawJson ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>

          {showRawJson && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 animate-in fade-in-50 duration-200">
              {/* Old Value JSON */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-border/80 bg-muted/30">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold">{t("diffDialog.previousValue")}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(log.oldValue, "old")}
                  >
                    {copiedOld ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>
                <pre className="font-mono text-3xs text-foreground/90 bg-background/80 p-2 rounded border border-border/50 overflow-x-auto max-h-48">
                  {JSON.stringify(log.oldValue, null, 2) ?? "null"}
                </pre>
              </div>

              {/* New Value JSON */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-border/80 bg-muted/30">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold">{t("diffDialog.newValue")}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(log.newValue, "new")}
                  >
                    {copiedNew ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>
                <pre className="font-mono text-3xs text-foreground/90 bg-background/80 p-2 rounded border border-border/50 overflow-x-auto max-h-48">
                  {JSON.stringify(log.newValue, null, 2) ?? "null"}
                </pre>
              </div>
            </div>
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
