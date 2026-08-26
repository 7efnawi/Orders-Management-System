"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { DriverType } from "@prisma/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DeliveryDriverRow {
  id: string;
  name: string;
  type: DriverType;
  isActive: boolean;
}

const driverSchema = z.object({
  name: z.string().trim().min(1),
  type: z.nativeEnum(DriverType),
});

export function DriverDialog({
  state,
  onClose,
  onSaved,
}: {
  state: { mode: "create" } | { mode: "edit"; driver: DeliveryDriverRow } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("delivery");
  const editing = state?.mode === "edit" ? state.driver : null;

  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("drivers.edit") : t("drivers.add")}</DialogTitle>
        </DialogHeader>
        <DriverForm
          key={editing?.id ?? "create"}
          initial={{
            name: editing?.name ?? "",
            type: editing?.type ?? DriverType.OWN,
          }}
          driverId={editing?.id}
          onClose={onClose}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

function DriverForm({
  initial,
  driverId,
  onClose,
  onSaved,
}: {
  initial: { name: string; type: DriverType };
  driverId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("delivery");
  const [name, setName] = useState(initial.name);
  const [type, setType] = useState<DriverType>(initial.type);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const parsed = driverSchema.safeParse({ name, type });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue?.path[0] === "name") {
        setError(t("validation.nameRequired"));
      } else {
        setError(t("validation.typeRequired"));
      }
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const url = driverId ? `/api/delivery/drivers/${driverId}` : "/api/delivery/drivers";
      const method = driverId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.data.name,
          type: parsed.data.type,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || t("error"));
      }

      toast.success(driverId ? t("drivers.updatedSuccess") : t("drivers.createdSuccess"));
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
        <Label htmlFor="driver-name">{t("drivers.name")}</Label>
        <Input
          id="driver-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("drivers.namePlaceholder")}
          autoFocus
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="driver-type">{t("drivers.type")}</Label>
        <Select value={type} onValueChange={(val) => setType(val as DriverType)}>
          <SelectTrigger id="driver-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DriverType.OWN}>{t("drivers.types.OWN")}</SelectItem>
            <SelectItem value={DriverType.APP}>{t("drivers.types.APP")}</SelectItem>
            <SelectItem value={DriverType.EXTERNAL}>{t("drivers.types.EXTERNAL")}</SelectItem>
            <SelectItem value={DriverType.PICKUP}>{t("drivers.types.PICKUP")}</SelectItem>
          </SelectContent>
        </Select>
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
