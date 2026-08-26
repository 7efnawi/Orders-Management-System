"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExpenseTypeOption } from "./expense-type-dialog";

export interface ExpenseDialogItem {
  id: string;
  expenseTypeId: string;
  description: string;
  quantity: number;
  value: number;
  date: string;
}

export interface ExpenseDialogProps {
  state: { mode: "create" } | { mode: "edit"; expense: ExpenseDialogItem } | null;
  expenseTypes: ExpenseTypeOption[];
  onClose: () => void;
  onSaved: () => void;
  onOpenTypeDialog?: () => void;
  canManageTypes?: boolean;
}

const expenseFormSchema = z.object({
  expenseTypeId: z.string().uuid("validation.categoryRequired"),
  description: z.string().trim().min(1, "validation.descriptionRequired"),
  quantity: z.coerce.number().int().min(1, "validation.quantityPositive"),
  value: z.coerce.number().positive("validation.valuePositive"),
  date: z.string().min(1, "validation.dateRequired"),
});

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ExpenseDialog({
  state,
  expenseTypes,
  onClose,
  onSaved,
  onOpenTypeDialog,
  canManageTypes = false,
}: ExpenseDialogProps) {
  const t = useTranslations("expenses");

  const isEditing = state?.mode === "edit";
  const editingExpense = isEditing ? state.expense : null;

  return (
    <Dialog open={state !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("dialog.editTitle") : t("dialog.recordTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("dialog.editDesc") : t("dialog.recordDesc")}
          </DialogDescription>
        </DialogHeader>

        {state && (
          <ExpenseForm
            key={editingExpense?.id ?? "new-expense"}
            initial={{
              expenseTypeId: editingExpense?.expenseTypeId ?? "",
              description: editingExpense?.description ?? "",
              quantity: editingExpense ? String(editingExpense.quantity) : "1",
              value: editingExpense ? String(editingExpense.value) : "",
              date: editingExpense
                ? editingExpense.date.split("T")[0]
                : getTodayString(),
            }}
            expenseId={editingExpense?.id}
            expenseTypes={expenseTypes}
            onClose={onClose}
            onSaved={onSaved}
            onOpenTypeDialog={onOpenTypeDialog}
            canManageTypes={canManageTypes}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExpenseForm({
  initial,
  expenseId,
  expenseTypes,
  onClose,
  onSaved,
  onOpenTypeDialog,
  canManageTypes,
}: {
  initial: {
    expenseTypeId: string;
    description: string;
    quantity: string;
    value: string;
    date: string;
  };
  expenseId?: string;
  expenseTypes: ExpenseTypeOption[];
  onClose: () => void;
  onSaved: () => void;
  onOpenTypeDialog?: () => void;
  canManageTypes?: boolean;
}) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");

  const [expenseTypeId, setExpenseTypeId] = useState(initial.expenseTypeId);
  const [description, setDescription] = useState(initial.description);
  const [quantity, setQuantity] = useState(initial.quantity);
  const [value, setValue] = useState(initial.value);
  const [date, setDate] = useState(initial.date);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // If initial type wasn't set and types loaded, keep choice
  useEffect(() => {
    if (!expenseTypeId && expenseTypes.length > 0 && !expenseId) {
      // Keep empty by default so user makes explicit choice
    }
  }, [expenseTypes, expenseTypeId, expenseId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = expenseFormSchema.safeParse({
      expenseTypeId,
      description,
      quantity,
      value,
      date,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0] as string;
        if (fieldName === "expenseTypeId") {
          fieldErrors.expenseTypeId = t("validation.categoryRequired");
        } else if (fieldName === "description") {
          fieldErrors.description = t("validation.descriptionRequired");
        } else if (fieldName === "quantity") {
          fieldErrors.quantity = t("validation.quantityPositive");
        } else if (fieldName === "value") {
          fieldErrors.value = t("validation.valuePositive");
        } else if (fieldName === "date") {
          fieldErrors.date = t("validation.dateRequired");
        } else {
          fieldErrors[fieldName] = t("dialog.error");
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const url = expenseId ? `/api/expenses/${expenseId}` : "/api/expenses";
      const method = expenseId ? "PATCH" : "POST";

      const payload = {
        expenseTypeId: result.data.expenseTypeId,
        description: result.data.description,
        quantity: result.data.quantity,
        value: result.data.value,
        date: result.data.date,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || t("dialog.error"));
      }

      toast.success(
        expenseId ? t("dialog.updatedSuccess") : t("dialog.createdSuccess")
      );
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("dialog.error");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
      {/* Category / Expense Type */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="expense-type-select">{t("dialog.categoryLabel")}</Label>
          {canManageTypes && onOpenTypeDialog && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary hover:text-primary"
              onClick={onOpenTypeDialog}
            >
              <Plus className="h-3.5 w-3.5 me-1" />
              {t("addCategory")}
            </Button>
          )}
        </div>
        <Select
          value={expenseTypeId}
          onValueChange={(val) => {
            setExpenseTypeId(val);
            if (errors.expenseTypeId) {
              setErrors((prev) => ({ ...prev, expenseTypeId: "" }));
            }
          }}
        >
          <SelectTrigger id="expense-type-select" className="w-full">
            <SelectValue placeholder={t("dialog.selectCategory")} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {expenseTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.expenseTypeId && (
          <p role="alert" className="text-destructive text-xs font-medium">
            {errors.expenseTypeId}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="grid gap-2">
        <Label htmlFor="expense-description">{t("dialog.descriptionLabel")}</Label>
        <Input
          id="expense-description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) {
              setErrors((prev) => ({ ...prev, description: "" }));
            }
          }}
          placeholder={t("dialog.descriptionPlaceholder")}
          disabled={saving}
        />
        {errors.description && (
          <p role="alert" className="text-destructive text-xs font-medium">
            {errors.description}
          </p>
        )}
      </div>

      {/* Row: Quantity & Value */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Quantity */}
        <div className="grid gap-2">
          <Label htmlFor="expense-quantity">{t("dialog.quantityLabel")}</Label>
          <Input
            id="expense-quantity"
            type="number"
            min="1"
            step="1"
            dir="ltr"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              if (errors.quantity) {
                setErrors((prev) => ({ ...prev, quantity: "" }));
              }
            }}
            disabled={saving}
          />
          {errors.quantity && (
            <p role="alert" className="text-destructive text-xs font-medium">
              {errors.quantity}
            </p>
          )}
        </div>

        {/* Value */}
        <div className="grid gap-2">
          <Label htmlFor="expense-value">
            {t("dialog.valueLabel")}
          </Label>
          <Input
            id="expense-value"
            type="number"
            min="0.01"
            step="any"
            dir="ltr"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (errors.value) {
                setErrors((prev) => ({ ...prev, value: "" }));
              }
            }}
            placeholder={t("dialog.valuePlaceholder")}
            disabled={saving}
          />
          {errors.value && (
            <p role="alert" className="text-destructive text-xs font-medium">
              {errors.value}
            </p>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="grid gap-2">
        <Label htmlFor="expense-date">{t("dialog.dateLabel")}</Label>
        <Input
          id="expense-date"
          type="date"
          dir="ltr"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            if (errors.date) {
              setErrors((prev) => ({ ...prev, date: "" }));
            }
          }}
          disabled={saving}
        />
        {errors.date && (
          <p role="alert" className="text-destructive text-xs font-medium">
            {errors.date}
          </p>
        )}
      </div>

      <DialogFooter className="gap-2 sm:gap-0 pt-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={saving}
        >
          {tCommon("cancel")}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? t("dialog.saving") : t("dialog.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
