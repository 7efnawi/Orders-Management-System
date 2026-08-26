"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Calculator,
  Calendar as CalendarIcon,
  Edit2,
  Loader2,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ExpenseDialog,
  type ExpenseDialogItem,
} from "./expense-dialog";
import {
  ExpenseTypeDialog,
  type ExpenseTypeOption,
} from "./expense-type-dialog";

export interface ExpenseItem {
  id: string;
  expenseTypeId: string;
  description: string;
  quantity: number;
  value: number;
  date: string;
  createdBy: string;
  createdAt: string;
  expenseType: {
    id: string;
    name: string;
    isDefault: boolean;
  };
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export type QuickDatePreset = "today" | "yesterday" | "last7days" | "thisMonth" | "all";

export interface ExpensesClientProps {
  initialExpenses: ExpenseItem[];
  initialTypes: ExpenseTypeOption[];
  initialTotalAmount: number;
  initialTotalCount: number;
  canEdit: boolean;
  canManageTypes: boolean;
  userRole?: string;
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

export function ExpensesClient({
  initialExpenses,
  initialTypes,
  initialTotalAmount,
  initialTotalCount,
  canEdit,
  canManageTypes,
}: ExpensesClientProps) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const tRoles = useTranslations("roles");
  const locale = useLocale();

  // State
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseTypeOption[]>(initialTypes);
  const [totalAmount, setTotalAmount] = useState<number>(initialTotalAmount);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount);

  // Filters
  const [quickDate, setQuickDate] = useState<QuickDatePreset>("thisMonth");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [loading, setLoading] = useState(false);

  // Modals state
  const [expenseDialogState, setExpenseDialogState] = useState<
    { mode: "create" } | { mode: "edit"; expense: ExpenseDialogItem } | null
  >(null);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseItem | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        return dateStr.split("T")[0];
      }
    },
    [locale]
  );

  // Helper for preset labels
  const getPresetLabel = useCallback(
    (preset: QuickDatePreset): string => {
      switch (preset) {
        case "today":
          return t("filters.today");
        case "yesterday":
          return t("filters.yesterday");
        case "last7days":
          return t("filters.last7Days");
        case "thisMonth":
          return t("filters.thisMonth");
        case "all":
          return t("filters.allDates");
      }
    },
    [t]
  );

  // Fetch / Refresh Data
  const fetchData = useCallback(
    async (
      preset: QuickDatePreset = quickDate,
      typeId: string = selectedType,
      search: string = searchQuery
    ) => {
      setLoading(true);
      try {
        const { startDate, endDate } = getDateRangeForPreset(preset);
        const params = new URLSearchParams();
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        if (typeId && typeId !== "all") params.set("expenseTypeId", typeId);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/expenses?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load expenses");

        const data = await res.json();
        setExpenses(data.expenses || []);
        setTotalAmount(Number(data.totalAmount ?? 0));
        setTotalCount(Number(data.totalCount ?? 0));
      } catch {
        toast.error(t("dialog.error"));
      } finally {
        setLoading(false);
      }
    },
    [quickDate, selectedType, searchQuery, t]
  );

  // Fetch updated Expense Types
  const refreshExpenseTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/expenses/types");
      if (res.ok) {
        const data = await res.json();
        setExpenseTypes(data.types || []);
      }
    } catch {
      // silent fallback
    }
  }, []);

  // Handle Filter Change
  const handleQuickDateChange = (preset: QuickDatePreset) => {
    setQuickDate(preset);
    fetchData(preset, selectedType, searchQuery);
  };

  const handleTypeChange = (val: string) => {
    setSelectedType(val);
    fetchData(quickDate, val, searchQuery);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(quickDate, selectedType, searchQuery);
  };

  const handleClearFilters = () => {
    setQuickDate("thisMonth");
    setSelectedType("all");
    setSearchQuery("");
    fetchData("thisMonth", "all", "");
  };

  const isFiltered =
    quickDate !== "thisMonth" || selectedType !== "all" || searchQuery.trim() !== "";

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingExpense) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${deletingExpense.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || t("deleteDialog.error"));
      }
      toast.success(t("deleteDialog.success"));
      setDeletingExpense(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("deleteDialog.error");
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Average Expense Calculation
  const averageValue = useMemo(() => {
    if (totalCount === 0) return 0;
    return totalAmount / totalCount;
  }, [totalAmount, totalCount]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={loading}
            className="h-9 gap-1.5"
            title={tCommon("loading")}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">
              {locale === "ar" ? "تحديث" : "Refresh"}
            </span>
          </Button>

          {canManageTypes && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTypeDialogOpen(true)}
              className="h-9 gap-1.5"
            >
              <Tag className="h-4 w-4" />
              <span>{t("addCategory")}</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setExpenseDialogState({ mode: "create" })}
            className="h-9 gap-1.5 font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>{t("recordExpense")}</span>
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Card 1: Total Amount */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("summary.totalAmount")}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getPresetLabel(quickDate)}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Records */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("summary.totalCount")}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {totalCount.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("summary.countUnit")}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Average Expense */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("summary.averageValue")}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Calculator className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {formatCurrency(averageValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "ar" ? "لكل قيد مصروف" : "Per expense record"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground me-1 flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {t("filters.quickDate")}:
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

            {/* Dropdown Filters & Search */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Selector */}
              <div className="w-full sm:w-48">
                <Select value={selectedType} onValueChange={handleTypeChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={t("filters.allCategories")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">
                      {t("filters.allCategories")}
                    </SelectItem>
                    {expenseTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Form */}
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-1 sm:w-60 items-center gap-1"
              >
                <div className="relative flex-1">
                  <Search className="absolute start-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={t("filters.searchPlaceholder")}
                    className="h-8 ps-8 text-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        fetchData(quickDate, selectedType, "");
                      }}
                      className="absolute end-2 top-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Button type="submit" size="sm" variant="secondary" className="h-8 px-2 text-xs">
                  {tCommon("search")}
                </Button>
              </form>

              {/* Clear Filters Button */}
              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5 me-1" />
                  {t("filters.clearFilters")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Table & Cards */}
      <Card className="border-border/60 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm">{tCommon("loading")}</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <Receipt className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold">{t("table.emptyTitle")}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {t("table.emptyDesc")}
            </p>
            <Button
              size="sm"
              onClick={() => setExpenseDialogState({ mode: "create" })}
              className="mt-4 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>{t("recordExpense")}</span>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px]">{t("table.date")}</TableHead>
                    <TableHead className="w-[160px]">{t("table.category")}</TableHead>
                    <TableHead>{t("table.description")}</TableHead>
                    <TableHead className="w-[80px] text-center">
                      {t("table.quantity")}
                    </TableHead>
                    <TableHead className="w-[140px] text-end font-semibold">
                      {t("table.value")}
                    </TableHead>
                    <TableHead className="w-[140px]">{t("table.recordedBy")}</TableHead>
                    {canEdit && (
                      <TableHead className="w-[100px] text-center">
                        {t("table.actions")}
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => {
                    const roleKey = (expense.user?.role as "OWNER" | "MANAGER" | "CASHIER") || "CASHIER";
                    return (
                      <TableRow key={expense.id} className="group">
                        {/* Date */}
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateDisplay(expense.date)}
                        </TableCell>

                        {/* Category Badge */}
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="font-normal text-xs py-0.5 px-2 truncate max-w-[150px]"
                          >
                            {expense.expenseType?.name ?? "—"}
                          </Badge>
                        </TableCell>

                        {/* Description */}
                        <TableCell className="font-medium text-sm">
                          {expense.description}
                        </TableCell>

                        {/* Quantity */}
                        <TableCell className="text-center font-mono text-xs">
                          {expense.quantity > 1 ? (
                            <Badge variant="outline" className="text-xs font-mono">
                              ×{expense.quantity}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">1</span>
                          )}
                        </TableCell>

                        {/* Value */}
                        <TableCell className="text-end font-bold text-sm font-mono whitespace-nowrap">
                          {formatCurrency(Number(expense.value))}
                        </TableCell>

                        {/* Recorded By */}
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          <span className="font-medium text-foreground">
                            {expense.user?.name ?? "—"}
                          </span>
                          {expense.user?.role && (
                            <span className="block text-[10px] text-muted-foreground/80">
                              {tRoles(roleKey)}
                            </span>
                          )}
                        </TableCell>

                        {/* Actions (Manager/Owner) */}
                        {canEdit && (
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                                title={t("editExpense")}
                                onClick={() =>
                                  setExpenseDialogState({
                                    mode: "edit",
                                    expense: {
                                      id: expense.id,
                                      expenseTypeId: expense.expenseTypeId,
                                      description: expense.description,
                                      quantity: expense.quantity,
                                      value: Number(expense.value),
                                      date: expense.date,
                                    },
                                  })
                                }
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                title={t("deleteExpense")}
                                onClick={() => setDeletingExpense(expense)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-border">
              {expenses.map((expense) => (
                <div key={expense.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatDateDisplay(expense.date)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {expense.expenseType?.name ?? "—"}
                    </Badge>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{expense.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("table.recordedBy")}: {expense.user?.name}
                        {expense.quantity > 1 && ` • ${t("table.quantity")}: ×${expense.quantity}`}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <span className="font-bold text-sm text-primary">
                        {formatCurrency(Number(expense.value))}
                      </span>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1"
                        onClick={() =>
                          setExpenseDialogState({
                            mode: "edit",
                            expense: {
                              id: expense.id,
                              expenseTypeId: expense.expenseTypeId,
                              description: expense.description,
                              quantity: expense.quantity,
                              value: Number(expense.value),
                              date: expense.date,
                            },
                          })
                        }
                      >
                        <Edit2 className="h-3 w-3" />
                        {tCommon("edit")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingExpense(expense)}
                      >
                        <Trash2 className="h-3 w-3" />
                        {locale === "ar" ? "حذف" : "Delete"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Record / Edit Expense Dialog */}
      <ExpenseDialog
        state={expenseDialogState}
        expenseTypes={expenseTypes}
        onClose={() => setExpenseDialogState(null)}
        onSaved={() => fetchData()}
        onOpenTypeDialog={() => setTypeDialogOpen(true)}
        canManageTypes={canManageTypes}
      />

      {/* New Category Type Dialog */}
      {canManageTypes && (
        <ExpenseTypeDialog
          open={typeDialogOpen}
          onClose={() => setTypeDialogOpen(false)}
          onCreated={(newType) => {
            refreshExpenseTypes();
            if (newType) {
              setExpenseTypes((prev) => [...prev, newType]);
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deletingExpense !== null}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              {t("deleteDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {deletingExpense
                ? t("deleteDialog.description", {
                    value: Number(deletingExpense.value).toLocaleString(
                      locale === "ar" ? "ar-EG" : "en-US"
                    ),
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>

          {deletingExpense && (
            <div className="rounded-md bg-muted/60 p-3 space-y-1.5 text-xs text-muted-foreground border">
              <div>
                <span className="font-semibold text-foreground">
                  {t("table.category")}:
                </span>{" "}
                {deletingExpense.expenseType?.name}
              </div>
              <div>
                <span className="font-semibold text-foreground">
                  {t("table.description")}:
                </span>{" "}
                {deletingExpense.description}
              </div>
              <div>
                <span className="font-semibold text-foreground">
                  {t("table.date")}:
                </span>{" "}
                {formatDateDisplay(deletingExpense.date)}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingExpense(null)}
              disabled={deleting}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
