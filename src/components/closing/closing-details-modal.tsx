"use client";

import { useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Clock,
  CreditCard,
  FileText,
  Globe,
  Printer,
  Receipt,
  Truck,
  UserCheck,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

export interface ClosingDetailsItem {
  id: string;
  shiftId: string;
  date: string | Date;
  totalOrders: number;
  cancelledOrders: number;
  totalCash: number;
  totalVisa: number;
  totalOnline: number;
  totalDeliveryFees: number;
  totalExpenses: number;
  netCash: number;
  notes: string | null;
  closedAt: string | Date;
  shift: {
    id: string;
    openedAt: string | Date;
    closedAt: string | Date | null;
    cashier: {
      id: string;
      name: string;
      email?: string;
      role: string;
    };
  };
}

export interface ClosingDetailsModalProps {
  closing: ClosingDetailsItem | null;
  open: boolean;
  onClose: () => void;
}

export function ClosingDetailsModal({
  closing,
  open,
  onClose,
}: ClosingDetailsModalProps) {
  const t = useTranslations("closing");
  const tModal = useTranslations("closing.detailsModal");
  const tRoles = useTranslations("roles");
  const locale = useLocale();

  // Currency Formatter
  const formatCurrency = useCallback(
    (amount: number) => {
      const formatted = new Intl.NumberFormat(
        locale === "ar" ? "ar-EG" : "en-US",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      ).format(amount);
      return `${formatted} ${t("currency")}`;
    },
    [locale, t]
  );

  // Time & Date Formatter
  const formatDateTime = useCallback(
    (dateStr: string | Date) => {
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return String(dateStr);
      }
    },
    [locale]
  );

  const calculateDuration = useCallback(
    (startStr: string | Date, endStr: string | Date) => {
      try {
        const start = new Date(startStr).getTime();
        const end = new Date(endStr).getTime();
        const diffSeconds = Math.max(0, Math.floor((end - start) / 1000));
        const hours = Math.floor(diffSeconds / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
      } catch {
        return "—";
      }
    },
    []
  );

  if (!closing) return null;

  const completedOrders = closing.totalOrders - closing.cancelledOrders;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {tModal("title")}
            </DialogTitle>
            <Badge variant="secondary" className="font-mono text-xs">
              #{closing.shiftId.slice(0, 8)}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {tModal("subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Shift Metadata Card */}
          <Card className="border-border/60 bg-muted/20 shadow-none">
            <CardContent className="p-3 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <div className="flex items-center gap-1.5 font-medium">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{tModal("cashier")}:</span>
                  <span className="font-semibold text-foreground">
                    {closing.shift.cashier.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0">
                    {tRoles(
                      closing.shift.cashier.role as "OWNER" | "MANAGER" | "CASHIER"
                    )}
                  </Badge>
                </div>
                <div className="text-muted-foreground font-mono">
                  {calculateDuration(closing.shift.openedAt, closing.closedAt)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{tModal("openedAt")}:</span>
                  <span className="font-mono text-foreground font-medium">
                    {formatDateTime(closing.shift.openedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>{tModal("closedAt")}:</span>
                  <span className="font-mono text-foreground font-medium">
                    {formatDateTime(closing.closedAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Big Highlight: Net Cash Handover */}
          <Card className="border-2 border-primary/30 bg-primary/5 shadow-none">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  {tModal("netCash")}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-primary font-mono">
                  {formatCurrency(closing.netCash)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground text-start sm:text-end">
                <div>{tModal("totalCash")}: {formatCurrency(closing.totalCash)}</div>
                <div className="text-destructive font-medium">
                  - {tModal("totalExpenses")}: {formatCurrency(closing.totalExpenses)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Breakdown Grid */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {tModal("breakdown")}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-lg border p-2.5 bg-card space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>{tModal("totalCash")}</span>
                  <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div className="text-sm font-bold font-mono text-emerald-600">
                  {formatCurrency(closing.totalCash)}
                </div>
              </div>

              <div className="rounded-lg border p-2.5 bg-card space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>{tModal("totalVisa")}</span>
                  <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="text-sm font-bold font-mono text-blue-600">
                  {formatCurrency(closing.totalVisa)}
                </div>
              </div>

              <div className="rounded-lg border p-2.5 bg-card space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>{tModal("totalOnline")}</span>
                  <Globe className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <div className="text-sm font-bold font-mono text-purple-600">
                  {formatCurrency(closing.totalOnline)}
                </div>
              </div>

              <div className="rounded-lg border p-2.5 bg-card space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>{tModal("totalDeliveryFees")}</span>
                  <Truck className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="text-sm font-bold font-mono text-amber-600">
                  {formatCurrency(closing.totalDeliveryFees)}
                </div>
              </div>
            </div>
          </div>

          {/* Orders Summary */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {tModal("ordersSummary")}
            </h4>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-lg border p-2.5 bg-card">
                <span className="text-[11px] text-muted-foreground block">
                  {tModal("totalOrders")}
                </span>
                <span className="text-base font-bold font-mono text-foreground">
                  {closing.totalOrders}
                </span>
              </div>
              <div className="rounded-lg border p-2.5 bg-card">
                <span className="text-[11px] text-emerald-600 block">
                  {tModal("netOrders")}
                </span>
                <span className="text-base font-bold font-mono text-emerald-600">
                  {completedOrders}
                </span>
              </div>
              <div className="rounded-lg border p-2.5 bg-card">
                <span className="text-[11px] text-destructive block">
                  {tModal("cancelledOrders")}
                </span>
                <span className="text-base font-bold font-mono text-destructive">
                  {closing.cancelledOrders}
                </span>
              </div>
            </div>
          </div>

          {/* Closing Notes */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              {tModal("notes")}
            </h4>
            <div className="rounded-lg border bg-muted/40 p-3 text-xs text-foreground min-h-[50px] whitespace-pre-wrap">
              {closing.notes ? closing.notes : (
                <span className="text-muted-foreground italic">{tModal("noNotes")}</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{tModal("print")}</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            {tModal("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
