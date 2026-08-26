"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { DriverType, OrderStatus } from "@prisma/client";
import {
  Bike,
  Check,
  Loader2,
  Search,
  Truck,
  UserCheck,
  Users,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface ActiveDriver {
  id: string;
  name: string;
  type: DriverType;
  isActive: boolean;
}

export interface AssignDriverOrder {
  id: string;
  orderNumber: string;
  status?: OrderStatus;
  driver?: { id: string; name: string; type?: string } | null;
}

interface AssignDriverDialogProps {
  order: AssignDriverOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDispatch?: boolean;
  onSuccess?: () => void;
}

const DRIVER_TYPE_BADGES: Record<
  DriverType,
  { labelKey: string; className: string }
> = {
  [DriverType.OWN]: {
    labelKey: "drivers.types.OWN",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium",
  },
  [DriverType.APP]: {
    labelKey: "drivers.types.APP",
    className:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 font-medium",
  },
  [DriverType.EXTERNAL]: {
    labelKey: "drivers.types.EXTERNAL",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-medium",
  },
  [DriverType.PICKUP]: {
    labelKey: "drivers.types.PICKUP",
    className:
      "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 font-medium",
  },
};

export function AssignDriverDialog({
  order,
  open,
  onOpenChange,
  defaultDispatch = false,
  onSuccess,
}: AssignDriverDialogProps) {
  const t = useTranslations("delivery");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Truck className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {t("assignDialog.title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("assignDialog.description", {
                  orderNumber: order?.orderNumber ?? "",
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {open && order && (
          <AssignDriverForm
            key={`${order.id}-${defaultDispatch}`}
            order={order}
            defaultDispatch={defaultDispatch}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AssignDriverForm({
  order,
  defaultDispatch,
  onClose,
  onSuccess,
}: {
  order: AssignDriverOrder;
  defaultDispatch: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const t = useTranslations("delivery");
  const [drivers, setDrivers] = useState<ActiveDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(
    order.driver?.id || null
  );
  const [shouldDispatch, setShouldDispatch] = useState<boolean>(
    defaultDispatch || order.status === OrderStatus.READY
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/delivery/drivers?includeInactive=false")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch drivers");
        return res.json();
      })
      .then((data) => {
        if (active) {
          setDrivers(data.drivers || []);
        }
      })
      .catch(() => {
        if (active) {
          toast.error(t("error"));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [t]);

  const filteredDrivers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter((d) => d.name.toLowerCase().includes(q));
  }, [drivers, search]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedDriverId) return;

    setSubmitting(true);
    try {
      // 1. Assign driver
      const assignRes = await fetch(`/api/orders/${order.id}/driver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: selectedDriverId }),
      });

      if (!assignRes.ok) {
        const errorData = await assignRes.json().catch(() => ({}));
        throw new Error(errorData.message || t("assignDialog.error"));
      }

      // 2. Optionally advance to OUT_FOR_DELIVERY if selected and order is in a valid state
      if (shouldDispatch && order.status === OrderStatus.READY) {
        const statusRes = await fetch(`/api/orders/${order.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: OrderStatus.OUT_FOR_DELIVERY }),
        });

        if (!statusRes.ok) {
          const statusError = await statusRes.json().catch(() => ({}));
          throw new Error(statusError.message || "Failed to update order status");
        }

        toast.success(
          t("assignDialog.successAndDispatched", {
            orderNumber: order.orderNumber,
          })
        );
      } else {
        toast.success(
          t("assignDialog.success", {
            orderNumber: order.orderNumber,
          })
        );
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("assignDialog.error");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isOrderReady = order.status === OrderStatus.READY;
  const canDispatchOption = isOrderReady;

  return (
    <div className="space-y-4 py-2">
      {/* Current Driver Display */}
      {order.driver && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            {t("assignDialog.currentDriver")}:
          </span>
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <UserCheck className="size-3.5 text-primary" />
            <span>{order.driver.name}</span>
            {order.driver.type && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                {t(
                  DRIVER_TYPE_BADGES[order.driver.type as DriverType]?.labelKey ||
                    "drivers.types.OWN"
                )}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Search Box */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t("assignDialog.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-9 h-9 text-xs"
        />
      </div>

      {/* Drivers List */}
      <div className="max-h-56 overflow-y-auto space-y-1.5 pe-1">
        {loading ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" />
            <p className="text-xs">{t("actions.saving")}</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed p-4 text-center">
            <Users className="size-6 text-muted-foreground/60" />
            <p className="text-xs font-semibold text-foreground">
              {t("assignDialog.noDrivers")}
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              {t("assignDialog.noDriversDesc")}
            </p>
          </div>
        ) : (
          filteredDrivers.map((driver) => {
            const isSelected = selectedDriverId === driver.id;
            const badgeInfo = DRIVER_TYPE_BADGES[driver.type];

            return (
              <div
                key={driver.id}
                onClick={() => setSelectedDriverId(driver.id)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border p-2.5 cursor-pointer transition-all text-xs",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg border",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground"
                    )}
                  >
                    {isSelected ? (
                      <Check className="size-4 stroke-[3]" />
                    ) : driver.type === DriverType.OWN ? (
                      <Bike className="size-3.5" />
                    ) : (
                      <Truck className="size-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {driver.name}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={cn("text-[10px] shrink-0", badgeInfo.className)}
                >
                  {t(badgeInfo.labelKey)}
                </Badge>
              </div>
            );
          })
        )}
      </div>

      {/* Dispatch Option Switch (for READY status orders) */}
      {canDispatchOption && (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-primary/5 p-3">
          <Label
            htmlFor="dispatch-switch"
            className="text-xs font-medium cursor-pointer leading-tight text-foreground"
          >
            {t("assignDialog.dispatchCheckbox")}
          </Label>
          <Switch
            id="dispatch-switch"
            checked={shouldDispatch}
            onCheckedChange={(checked: boolean) => setShouldDispatch(checked)}
          />
        </div>
      )}

      <DialogFooter className="gap-2 sm:gap-0 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={submitting}
          className="text-xs"
        >
          {t("actions.cancel")}
        </Button>

        <Button
          type="button"
          onClick={() => handleSubmit()}
          disabled={submitting || !selectedDriverId || loading}
          className="text-xs font-semibold"
        >
          {submitting ? (
            <>
              <Loader2 className="me-1.5 size-3.5 animate-spin" />
              {t("assignDialog.assigning")}
            </>
          ) : shouldDispatch && isOrderReady ? (
            t("assignDialog.confirmAndDispatch")
          ) : (
            t("assignDialog.confirm")
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}
