"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DeliveryZoneRow {
  id: string;
  name: string;
  fee: number | string;
  isActive: boolean;
}

const zoneSchema = z.object({
  name: z.string().trim().min(1),
  fee: z.coerce.number().min(0),
});

export function ZoneDialog({
  state,
  onClose,
  onSaved,
}: {
  state: { mode: "create" } | { mode: "edit"; zone: DeliveryZoneRow } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("delivery");
  const editing = state?.mode === "edit" ? state.zone : null;

  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("zones.edit") : t("zones.add")}</DialogTitle>
        </DialogHeader>
        <ZoneForm
          key={editing?.id ?? "create"}
          initial={{
            name: editing?.name ?? "",
            fee: editing ? String(Number(editing.fee)) : "0",
          }}
          zoneId={editing?.id}
          onClose={onClose}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

function ZoneForm({
  initial,
  zoneId,
  onClose,
  onSaved,
}: {
  initial: { name: string; fee: string };
  zoneId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("delivery");
  const [name, setName] = useState(initial.name);
  const [fee, setFee] = useState(initial.fee);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const parsed = zoneSchema.safeParse({ name, fee });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue?.path[0] === "name") {
        setError(t("validation.nameRequired"));
      } else {
        setError(t("validation.feeRequired"));
      }
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const url = zoneId ? `/api/delivery/zones/${zoneId}` : "/api/delivery/zones";
      const method = zoneId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.data.name,
          fee: parsed.data.fee,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || t("error"));
      }

      toast.success(zoneId ? t("zones.updatedSuccess") : t("zones.createdSuccess"));
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("error");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="zone-name">{t("zones.name")}</Label>
        <Input
          id="zone-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("zones.namePlaceholder")}
          autoFocus
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="zone-fee">
          {t("zones.fee")} ({t("zones.currency")})
        </Label>
        <Input
          id="zone-fee"
          type="number"
          min="0"
          step="0.5"
          dir="ltr"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          placeholder={t("zones.feePlaceholder")}
        />
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      ) : null}

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          {t("actions.cancel")}
        </Button>
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? t("actions.saving") : t("actions.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
