"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { DriverType } from "@/types/enums";
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
  name: z.string().trim().optional(),
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
  const [type, setType] = useState<DriverType>(
    initial.type === DriverType.PICKUP ? DriverType.OWN : initial.type
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleTypeChange = (newType: DriverType) => {
    setType(newType);
    if (!driverId) {
      if (newType === DriverType.APP && (!name || name === t("drivers.types.EXTERNAL") || name === t("drivers.types.OWN"))) {
        setName(t("drivers.types.APP"));
      } else if (newType === DriverType.EXTERNAL && (!name || name === t("drivers.types.APP") || name === t("drivers.types.OWN"))) {
        setName(t("drivers.types.EXTERNAL"));
      } else if (newType === DriverType.OWN && (name === t("drivers.types.APP") || name === t("drivers.types.EXTERNAL"))) {
        setName("");
      }
    }
  };

  async function onSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    
    let resolvedName = name.trim();
    if (!resolvedName) {
      if (type === DriverType.APP) {
        resolvedName = t("drivers.types.APP");
      } else if (type === DriverType.EXTERNAL) {
        resolvedName = t("drivers.types.EXTERNAL");
      } else {
        setError(t("validation.nameRequired"));
        return;
      }
    }

    const parsed = driverSchema.safeParse({ name: resolvedName, type });
    if (!parsed.success) {
      setError(t("validation.nameRequired"));
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
        <Label htmlFor="driver-type">{t("drivers.type")}</Label>
        <Select value={type} onValueChange={(val) => handleTypeChange(val as DriverType)}>
          <SelectTrigger id="driver-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DriverType.OWN}>{t("drivers.types.OWN")}</SelectItem>
            <SelectItem value={DriverType.APP}>{t("drivers.types.APP")}</SelectItem>
            <SelectItem value={DriverType.EXTERNAL}>{t("drivers.types.EXTERNAL")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="driver-name">
          {t("drivers.name")}{" "}
          {type === DriverType.OWN ? (
            <span className="text-destructive">*</span>
          ) : (
            <span className="text-xs text-muted-foreground font-normal">
              ({t("drivers.nameOptional") || "اختياري"})
            </span>
          )}
        </Label>
        <Input
          id="driver-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            type === DriverType.APP
              ? t("drivers.types.APP")
              : type === DriverType.EXTERNAL
              ? t("drivers.types.EXTERNAL")
              : t("drivers.namePlaceholder")
          }
          autoFocus={type === DriverType.OWN}
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
        <Button
          type="submit"
          disabled={saving || (type === DriverType.OWN && !name.trim())}
        >
          {saving ? t("actions.saving") : t("actions.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
