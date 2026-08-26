"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Clock,
  CreditCard,
  FileText,
  Globe,
  Loader2,
  Lock,
  Printer,
  Receipt,
  RefreshCw,
  ShoppingBag,
  TrendingDown,
  Truck,
  UserCheck,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ShiftPreviewResult } from "@/services/closing";

export interface ActiveShiftSummaryProps {
  initialPreview: ShiftPreviewResult;
  onShiftClosed: () => void | Promise<void>;
}

export function ActiveShiftSummary({
  initialPreview,
  onShiftClosed,
}: ActiveShiftSummaryProps) {
  const t = useTranslations("closing");
  const tSummary = useTranslations("closing.activeSummary");
  const tCommon = useTranslations("common");
  const tRoles = useTranslations("roles");
  const locale = useLocale();

  const [preview, setPreview] = useState<ShiftPreviewResult>(initialPreview);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [closingDialogOpen, setClosingDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Elapsed time tracker
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    const openedTime = new Date(initialPreview.shift.openedAt).getTime();
    return Math.max(0, Math.floor((Date.now() - openedTime) / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const openedTime = new Date(preview.shift.openedAt).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - openedTime) / 1000)));
    }, 1000);

    return () => clearInterval(timer);
  }, [preview.shift.openedAt]);

  const formattedDuration = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, "0");
    if (hours > 0) {
      return `${hours} ${tSummary("hours")} ${minutes} ${tSummary("minutes")}`;
    }
    return `${minutes} ${tSummary("minutes")} ${pad(seconds)} ${tSummary("seconds")}`;
  }, [elapsedSeconds, tSummary]);

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

  // Time formatter
  const formatTime = useCallback(
    (dateStr: string | Date) => {
      try {
        const d = new Date(dateStr);
        return d.toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } catch {
        return String(dateStr);
      }
    },
    [locale]
  );

  const formatDate = useCallback(
    (dateStr: string | Date) => {
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        return String(dateStr);
      }
    },
    [locale]
  );

  // Refresh Preview
  const refreshPreview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shifts/${preview.shift.id}/preview`);
      if (!res.ok) throw new Error("Failed to load shift preview");
      const data = await res.json();
      setPreview(data);
    } catch {
      toast.error(tCommon("loading"));
    } finally {
      setLoading(false);
    }
  }, [preview.shift.id, tCommon]);

  // Close Shift Action
  const handleCloseShift = async () => {
    setIsClosing(true);
    try {
      const res = await fetch(`/api/shifts/${preview.shift.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || tSummary("closeErrorToast"));
      }

      toast.success(tSummary("closeSuccessToast"));
      setClosingDialogOpen(false);
      await onShiftClosed();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tSummary("closeErrorToast");
      toast.error(msg);
    } finally {
      setIsClosing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const { summary, orders, expenses } = preview;
  const activeOrdersCount = summary.totalOrders - summary.cancelledOrders;

  return (
    <div className="space-y-6">
      {/* Top Banner / Shift Status Header */}
      <Card className="border-border/60 shadow-xs overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 gap-1.5 px-2.5 py-0.5">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  {tSummary("liveStatus")}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">
                  #{preview.shift.id.slice(0, 8)}
                </span>
                <Badge variant="outline" className="text-xs">
                  <UserCheck className="h-3 w-3 me-1 text-primary" />
                  {preview.shift.cashier.name} ({tRoles(preview.shift.cashier.role as "OWNER" | "MANAGER" | "CASHIER")})
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {tSummary("shiftStarted")}:{" "}
                  <strong className="text-foreground font-mono">
                    {formatDate(preview.shift.openedAt)} — {formatTime(preview.shift.openedAt)}
                  </strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {tSummary("duration")}:{" "}
                  <strong className="text-foreground font-mono">{formattedDuration}</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshPreview}
                disabled={loading}
                className="gap-1.5 text-xs h-9"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>{tSummary("refreshButton")}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs h-9"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>{tSummary("printSummary")}</span>
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setClosingDialogOpen(true)}
                className="gap-1.5 text-xs font-semibold h-9 shadow-xs"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>{tSummary("closeButton")}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Highlights Grid: Big Drawer Reconciliation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Highlight 1: Net Cash to Hand Over */}
        <Card className="border-2 border-primary/40 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                {tSummary("netCash")}
              </CardTitle>
              <Badge variant="default" className="text-xs font-mono">
                {summary.netCash >= 0 ? "+" : ""}
                {formatCurrency(summary.netCash)}
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {tSummary("netCashHelp")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary font-mono">
              {formatCurrency(summary.netCash)}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs border-t border-primary/20 pt-2 text-muted-foreground">
              <span>{tSummary("totalCash")}: {formatCurrency(summary.totalCash)}</span>
              <span>-</span>
              <span className="text-destructive font-medium">
                {tSummary("totalExpenses")}: {formatCurrency(summary.totalExpenses)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Highlight 2: Total Cash Collected */}
        <Card className="border-border/60 shadow-xs bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                {tSummary("totalCash")}
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {activeOrdersCount} {tSummary("activeOrders")}
              </span>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {tSummary("totalCashHelp")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(summary.totalCash)}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs border-t pt-2 text-muted-foreground">
              <span>{tSummary("totalDeliveryFees")}: {formatCurrency(summary.totalDeliveryFees)}</span>
              <span>•</span>
              <span>{summary.totalOrders} {tSummary("totalOrders")}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Visa */}
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{tSummary("totalVisa")}</span>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {formatCurrency(summary.totalVisa)}
            </div>
          </CardContent>
        </Card>

        {/* Online */}
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{tSummary("totalOnline")}</span>
              <Globe className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {formatCurrency(summary.totalOnline)}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Fees */}
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{tSummary("totalDeliveryFees")}</span>
              <Truck className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {formatCurrency(summary.totalDeliveryFees)}
            </div>
          </CardContent>
        </Card>

        {/* Shift Expenses */}
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{tSummary("totalExpenses")}</span>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <div className="text-xl font-bold font-mono text-destructive">
              {formatCurrency(summary.totalExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Count Summary Stats */}
      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 divide-x divide-border rtl:divide-x-reverse text-center">
            <div className="p-2">
              <div className="text-xs text-muted-foreground">{tSummary("totalOrders")}</div>
              <div className="text-2xl font-bold font-mono mt-1">{summary.totalOrders}</div>
            </div>
            <div className="p-2">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {tSummary("activeOrders")}
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {activeOrdersCount}
              </div>
            </div>
            <div className="p-2">
              <div className="text-xs text-destructive font-medium">
                {tSummary("cancelledOrders")}
              </div>
              <div className="text-2xl font-bold font-mono text-destructive mt-1">
                {summary.cancelledOrders}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accordion / Lists: Orders & Expenses in this shift */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders in Shift */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                {tSummary("ordersListTitle")}
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-mono">
                {orders.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-72 overflow-y-auto">
            {orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {tSummary("noOrders")}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="text-xs hover:bg-transparent">
                    <TableHead className="py-2">#</TableHead>
                    <TableHead className="py-2">{tSummary("drawerTitle")}</TableHead>
                    <TableHead className="py-2">{tCommon("loading")}</TableHead>
                    <TableHead className="py-2 text-end">{tSummary("netCash")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => {
                    const isCancelled = o.status === "CANCELLED";
                    const isCash = o.paymentMethod === "CASH";
                    const finalAmount =
                      Number(o.subtotal) - Number(o.discount) + Number(o.deliveryFee);

                    return (
                      <TableRow key={o.id} className="text-xs hover:bg-muted/40">
                        <TableCell className="font-mono font-medium py-2">
                          #{o.orderNumber}
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge
                            variant={isCash ? "default" : "outline"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {o.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 font-mono text-muted-foreground text-[11px]">
                          {formatTime(o.createdAt)}
                        </TableCell>
                        <TableCell className="text-end py-2 font-mono font-bold">
                          {isCancelled ? (
                            <span className="line-through text-muted-foreground">
                              {formatCurrency(finalAmount)}
                            </span>
                          ) : (
                            <span className={isCash ? "text-emerald-600 font-bold" : ""}>
                              {formatCurrency(finalAmount)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Expenses in Shift */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-destructive" />
                {tSummary("expensesListTitle")}
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-mono">
                {expenses.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-72 overflow-y-auto">
            {expenses.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {tSummary("noExpenses")}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="text-xs hover:bg-transparent">
                    <TableHead className="py-2">#</TableHead>
                    <TableHead className="py-2">{tCommon("loading")}</TableHead>
                    <TableHead className="py-2">{tSummary("expensesListTitle")}</TableHead>
                    <TableHead className="py-2 text-end">{tSummary("totalExpenses")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e) => (
                    <TableRow key={e.id} className="text-xs hover:bg-muted/40">
                      <TableCell className="font-medium py-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {e.expenseType?.name ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 font-mono text-muted-foreground text-[11px]">
                        {formatTime(e.createdAt)}
                      </TableCell>
                      <TableCell className="py-2 max-w-[150px] truncate text-muted-foreground">
                        {e.description} {e.quantity > 1 ? `(×${e.quantity})` : ""}
                      </TableCell>
                      <TableCell className="text-end py-2 font-mono font-bold text-destructive">
                        -{formatCurrency(Number(e.value))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog for Closing Shift */}
      <Dialog open={closingDialogOpen} onOpenChange={setClosingDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Lock className="h-5 w-5" />
              {tSummary("closeConfirmTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {tSummary("closeConfirmDesc")}
            </DialogDescription>
          </DialogHeader>

          {/* Quick Summary Card inside modal */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{tSummary("netCash")}:</span>
              <span className="text-xl font-bold font-mono text-primary">
                {formatCurrency(summary.netCash)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t pt-2">
              <div>{tSummary("totalCash")}: {formatCurrency(summary.totalCash)}</div>
              <div>{tSummary("totalExpenses")}: {formatCurrency(summary.totalExpenses)}</div>
              <div>{tSummary("totalVisa")}: {formatCurrency(summary.totalVisa)}</div>
              <div>{tSummary("totalOnline")}: {formatCurrency(summary.totalOnline)}</div>
            </div>
          </div>

          {/* Closing Notes Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <FileText className="h-3.5 w-3.5 text-primary" />
              {tSummary("notesLabel")}
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tSummary("notesPlaceholder")}
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setClosingDialogOpen(false)}
              disabled={isClosing}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleCloseShift}
              disabled={isClosing}
              className="gap-1.5 font-semibold"
            >
              {isClosing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{tSummary("closingButton")}</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>{tSummary("closeButton")}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
