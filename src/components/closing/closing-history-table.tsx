"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Eye,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClosingDetailsModal,
  type ClosingDetailsItem,
} from "./closing-details-modal";

export type QuickDatePreset = "today" | "yesterday" | "last7days" | "thisMonth" | "all";

export interface ClosingHistoryTableProps {
  initialClosings: ClosingDetailsItem[];
  initialTotalCount: number;
  userRole?: string;
  onShiftReopened?: () => void;
}

function formatDateToIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateRangeForPreset(preset: QuickDatePreset): {
  startDate?: string;
  endDate?: string;
} {
  const now = new Date();
  switch (preset) {
    case "today": {
      const todayStr = formatDateToIso(now);
      return { startDate: todayStr, endDate: todayStr };
    }
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatDateToIso(y);
      return { startDate: yStr, endDate: yStr };
    }
    case "last7days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { startDate: formatDateToIso(d), endDate: formatDateToIso(now) };
    }
    case "thisMonth": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: formatDateToIso(first), endDate: formatDateToIso(now) };
    }
    case "all":
    default:
      return {};
  }
}

export function ClosingHistoryTable({
  initialClosings,
  initialTotalCount,
  userRole,
  onShiftReopened,
}: ClosingHistoryTableProps) {
  const t = useTranslations("closing");
  const tHistory = useTranslations("closing.historyTable");
  const tCommon = useTranslations("common");
  const tRoles = useTranslations("roles");
  const locale = useLocale();

  const [closings, setClosings] = useState<ClosingDetailsItem[]>(initialClosings);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount);
  const [loading, setLoading] = useState(false);

  // Filters
  const [quickDate, setQuickDate] = useState<QuickDatePreset>("thisMonth");
  const [cashierSearch, setCashierSearch] = useState("");
  const [selectedClosing, setSelectedClosing] = useState<ClosingDetailsItem | null>(null);

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

  // Date Formatter
  const formatDateDisplay = useCallback(
    (dateStr: string | Date) => {
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
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

  const formatTimeDisplay = useCallback(
    (dateStr: string | Date) => {
      try {
        const d = new Date(dateStr);
        return d.toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return String(dateStr);
      }
    },
    [locale]
  );

  // Fetch Data
  const fetchData = useCallback(
    async (preset: QuickDatePreset = quickDate) => {
      setLoading(true);
      try {
        const { startDate, endDate } = getDateRangeForPreset(preset);
        const params = new URLSearchParams();
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const res = await fetch(`/api/closing?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load closings");

        const data = await res.json();
        const mapped = (data.closings || []).map((c: ClosingDetailsItem) => ({
          ...c,
          totalCash: Number(c.totalCash),
          totalVisa: Number(c.totalVisa),
          totalOnline: Number(c.totalOnline),
          totalDeliveryFees: Number(c.totalDeliveryFees),
          totalExpenses: Number(c.totalExpenses),
          netCash: Number(c.netCash),
        }));

        setClosings(mapped);
        setTotalCount(Number(data.totalCount ?? mapped.length));
      } catch {
        toast.error(tCommon("loading"));
      } finally {
        setLoading(false);
      }
    },
    [quickDate, tCommon]
  );

  const handleQuickDateChange = (preset: QuickDatePreset) => {
    setQuickDate(preset);
    fetchData(preset);
  };

  // Filtered by cashier search
  const filteredClosings = useMemo(() => {
    if (!cashierSearch.trim()) return closings;
    const query = cashierSearch.trim().toLowerCase();
    return closings.filter((c) =>
      c.shift?.cashier?.name?.toLowerCase().includes(query)
    );
  }, [closings, cashierSearch]);

  // Preset labels
  const getPresetLabel = useCallback(
    (preset: QuickDatePreset): string => {
      switch (preset) {
        case "today":
          return tHistory("today");
        case "yesterday":
          return tHistory("yesterday");
        case "last7days":
          return tHistory("last7Days");
        case "thisMonth":
          return tHistory("thisMonth");
        case "all":
          return tHistory("allDates");
      }
    },
    [tHistory]
  );

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground me-1 flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {tHistory("quickDate")}:
              </span>
              {(
                [
                  "today",
                  "yesterday",
                  "last7days",
                  "thisMonth",
                  "all",
                ] as QuickDatePreset[]
              ).map((preset) => {
                const active = quickDate === preset;
                return (
                  <Button
                    key={preset}
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className={`h-8 px-3 text-xs rounded-md ${
                      active ? "font-semibold shadow-xs" : "text-muted-foreground"
                    }`}
                    onClick={() => handleQuickDateChange(preset)}
                  >
                    {getPresetLabel(preset)}
                  </Button>
                );
              })}
            </div>

            {/* Cashier Search & Refresh */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={cashierSearch}
                  onChange={(e) => setCashierSearch(e.target.value)}
                  placeholder={tHistory("searchPlaceholder")}
                  className="h-10 ps-9 text-sm"
                />
                {cashierSearch && (
                  <button
                    type="button"
                    onClick={() => setCashierSearch("")}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData()}
                disabled={loading}
                className="h-10 px-3.5 text-xs sm:text-sm font-medium gap-1.5"
              >
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                <span>{locale === "ar" ? "تحديث" : "Refresh"}</span>
              </Button>

              <Badge variant="secondary" className="h-10 px-3 text-xs font-mono">
                {tHistory("totalRecords")}: {totalCount}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table / Cards */}
      <Card className="border-border/60 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm">{tCommon("loading")}</p>
          </div>
        ) : filteredClosings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <Receipt className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold">{tHistory("emptyTitle")}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {tHistory("emptyDesc")}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent text-xs">
                    <TableHead className="w-[130px]">{tHistory("date")}</TableHead>
                    <TableHead className="w-[150px]">{tHistory("cashier")}</TableHead>
                    <TableHead className="w-[80px] text-center">{tHistory("orders")}</TableHead>
                    <TableHead className="w-[120px] text-end">{tHistory("cash")}</TableHead>
                    <TableHead className="w-[110px] text-end">{tHistory("expenses")}</TableHead>
                    <TableHead className="w-[140px] text-end font-bold">{tHistory("net")}</TableHead>
                    <TableHead className="w-[120px]">{tHistory("closedAt")}</TableHead>
                    <TableHead className="w-[80px] text-center">{tHistory("viewDetails")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClosings.map((closing) => {
                    const roleKey =
                      (closing.shift?.cashier?.role as "OWNER" | "MANAGER" | "CASHIER") ||
                      "CASHIER";

                    return (
                      <TableRow key={closing.id} className="hover:bg-muted/40 text-xs">
                        {/* Date */}
                        <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                          {formatDateDisplay(closing.date)}
                        </TableCell>

                        {/* Cashier */}
                        <TableCell className="whitespace-nowrap">
                          <span className="font-semibold text-foreground">
                            {closing.shift?.cashier?.name ?? "—"}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {tRoles(roleKey)}
                          </span>
                        </TableCell>

                        {/* Orders count */}
                        <TableCell className="text-center font-mono font-medium">
                          {closing.totalOrders}
                          {closing.cancelledOrders > 0 && (
                            <span className="text-[10px] text-destructive block">
                              (-{closing.cancelledOrders})
                            </span>
                          )}
                        </TableCell>

                        {/* Total Cash */}
                        <TableCell className="text-end font-mono text-emerald-600 font-semibold whitespace-nowrap">
                          {formatCurrency(closing.totalCash)}
                        </TableCell>

                        {/* Shift Expenses */}
                        <TableCell className="text-end font-mono text-destructive whitespace-nowrap">
                          -{formatCurrency(closing.totalExpenses)}
                        </TableCell>

                        {/* Net Cash Handover */}
                        <TableCell className="text-end font-mono font-bold text-sm text-primary whitespace-nowrap">
                          {formatCurrency(closing.netCash)}
                        </TableCell>

                        {/* Closed At Time */}
                        <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                          {formatTimeDisplay(closing.closedAt)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedClosing(closing)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                            title={tHistory("viewDetails")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-border">
              {filteredClosings.map((closing) => (
                <div key={closing.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatDateDisplay(closing.date)} • {formatTimeDisplay(closing.closedAt)}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      #{closing.shiftId.slice(0, 6)}
                    </Badge>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{closing.shift?.cashier?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {closing.totalOrders} {tHistory("orders")}
                        {closing.cancelledOrders > 0 && ` (${closing.cancelledOrders} ملغي)`}
                      </p>
                    </div>

                    <div className="text-end shrink-0">
                      <span className="text-xs text-muted-foreground block">{tHistory("net")}</span>
                      <span className="text-base font-bold font-mono text-primary">
                        {formatCurrency(closing.netCash)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span>{tHistory("cash")}: {formatCurrency(closing.totalCash)}</span>
                      <span className="text-destructive">
                        {tHistory("expenses")}: -{formatCurrency(closing.totalExpenses)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedClosing(closing)}
                      className="h-7 px-2.5 text-xs gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{tHistory("viewDetails")}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Details Snapshot Modal */}
      <ClosingDetailsModal
        closing={selectedClosing}
        open={selectedClosing !== null}
        onClose={() => setSelectedClosing(null)}
        userRole={userRole}
        onReopenSuccess={() => {
          fetchData(quickDate);
          onShiftReopened?.();
        }}
        onNotesUpdated={(newNotes) => {
          if (selectedClosing) {
            setSelectedClosing({ ...selectedClosing, notes: newNotes });
          }
          fetchData(quickDate);
        }}
      />
    </div>
  );
}
