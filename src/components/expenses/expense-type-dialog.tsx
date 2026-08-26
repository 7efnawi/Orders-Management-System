"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
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

export interface ExpenseTypeOption {
  id: string;
  name: string;
  isDefault: boolean;
}

const typeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});

export interface ExpenseTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (newType?: ExpenseTypeOption) => void;
}

export function ExpenseTypeDialog({
  open,
  onClose,
  onCreated,
}: ExpenseTypeDialogProps) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setName("");
    setError(null);
    setSaving(false);
  }

  function handleClose() {
    if (saving) return;
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = typeSchema.safeParse({ name });
    if (!parsed.success) {
      setError(t("validation.typeNameRequired"));
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/expenses/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: parsed.data.name }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || t("typeDialog.error"));
      }

      const created: ExpenseTypeOption = await res.json();
      toast.success(t("typeDialog.createdSuccess"));
      resetForm();
      onCreated(created);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("typeDialog.error");
      toast.error(msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("typeDialog.title")}</DialogTitle>
          <DialogDescription>{t("typeDialog.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="expense-type-name">{t("typeDialog.nameLabel")}</Label>
            <Input
              id="expense-type-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t("typeDialog.namePlaceholder")}
              autoFocus
              disabled={saving}
            />
            {error && (
              <p role="alert" className="text-destructive text-xs font-medium">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? t("typeDialog.saving") : t("typeDialog.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
