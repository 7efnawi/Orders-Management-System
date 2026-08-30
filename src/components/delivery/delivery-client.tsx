"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { DriverType } from "@prisma/client";
import {
  Bike,
  MapPin,
  Pencil,
  Plus,
  PowerOff,
  RefreshCw,
  Search,
  Truck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ZoneDialog, type DeliveryZoneRow } from "./zone-dialog";
import { DriverDialog, type DeliveryDriverRow } from "./driver-dialog";
import { cn } from "@/lib/utils";

export interface DeliveryClientProps {
  initialZones: DeliveryZoneRow[];
  initialDrivers: DeliveryDriverRow[];
  canEdit: boolean;
}

type TabType = "zones" | "drivers";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

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
    labelKey: "drivers.types.OWN",
    className: "hidden",
  },
};

export function DeliveryClient({
  initialZones,
  initialDrivers,
  canEdit,
}: DeliveryClientProps) {
  const t = useTranslations("delivery");

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>("zones");

  // Data State
  const [zones, setZones] = useState<DeliveryZoneRow[]>(initialZones);
  const [drivers, setDrivers] = useState<DeliveryDriverRow[]>(initialDrivers);
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [zoneSearch, setZoneSearch] = useState("");
  const [driverSearch, setDriverSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [driverTypeFilter, setDriverTypeFilter] = useState<"ALL" | DriverType>(
    "ALL"
  );

  // Dialog State
  const [zoneDialog, setZoneDialog] = useState<
    { mode: "create" } | { mode: "edit"; zone: DeliveryZoneRow } | null
  >(null);
  const [driverDialog, setDriverDialog] = useState<
    { mode: "create" } | { mode: "edit"; driver: DeliveryDriverRow } | null
  >(null);

  // Fetch / Refresh Handlers
  const refreshZones = useCallback(async () => {
    try {
      const res = await fetch("/api/delivery/zones?includeInactive=true");
      if (!res.ok) throw new Error("Failed to fetch zones");
      const data = (await res.json()) as { zones: DeliveryZoneRow[] };
      setZones(data.zones);
    } catch {
      toast.error(t("error"));
    }
  }, [t]);

  const refreshDrivers = useCallback(async () => {
    try {
      const res = await fetch("/api/delivery/drivers?includeInactive=true");
      if (!res.ok) throw new Error("Failed to fetch drivers");
      const data = (await res.json()) as { drivers: DeliveryDriverRow[] };
      setDrivers(data.drivers);
    } catch {
      toast.error(t("error"));
    }
  }, [t]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshZones(), refreshDrivers()]);
    } finally {
      setRefreshing(false);
    }
  };

  // Toggle Zone Status
  const toggleZone = async (zone: DeliveryZoneRow, isActive: boolean) => {
    // Optimistic update
    setZones((prev) =>
      prev.map((z) => (z.id === zone.id ? { ...z, isActive } : z))
    );
    try {
      const res = await fetch(`/api/delivery/zones/${zone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle zone status");
      toast.success(t("status.updatedSuccess"));
      void refreshZones();
    } catch {
      toast.error(t("error"));
      void refreshZones();
    }
  };

  // Toggle Driver Status
  const toggleDriver = async (driver: DeliveryDriverRow, isActive: boolean) => {
    // Optimistic update
    setDrivers((prev) =>
      prev.map((d) => (d.id === driver.id ? { ...d, isActive } : d))
    );
    try {
      const res = await fetch(`/api/delivery/drivers/${driver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle driver status");
      toast.success(t("status.updatedSuccess"));
      void refreshDrivers();
    } catch {
      toast.error(t("error"));
      void refreshDrivers();
    }
  };

  // Filtered Zones
  const filteredZones = useMemo(() => {
    return zones.filter((zone) => {
      // Search
      if (
        zoneSearch.trim() &&
        !zone.name.toLowerCase().includes(zoneSearch.trim().toLowerCase())
      ) {
        return false;
      }
      // Status
      if (statusFilter === "ACTIVE" && !zone.isActive) return false;
      if (statusFilter === "INACTIVE" && zone.isActive) return false;
      return true;
    });
  }, [zones, zoneSearch, statusFilter]);

  // Filtered Drivers
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      // Search
      if (
        driverSearch.trim() &&
        !driver.name.toLowerCase().includes(driverSearch.trim().toLowerCase())
      ) {
        return false;
      }
      // Status
      if (statusFilter === "ACTIVE" && !driver.isActive) return false;
      if (statusFilter === "INACTIVE" && driver.isActive) return false;
      // Type
      if (driverTypeFilter !== "ALL" && driver.type !== driverTypeFilter) {
        return false;
      }
      return true;
    });
  }, [drivers, driverSearch, statusFilter, driverTypeFilter]);

  return (
    <div className="mx-auto w-full max-w-[1440px] flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className="h-10 text-xs sm:text-sm font-medium"
          >
            <RefreshCw
              className={cn("me-1.5 size-4", refreshing && "animate-spin")}
            />
            {t("actions.search")}
          </Button>

          {canEdit && activeTab === "zones" && (
            <Button
              size="sm"
              onClick={() => setZoneDialog({ mode: "create" })}
              className="h-10 font-semibold shadow-xs text-xs sm:text-sm"
            >
              <Plus className="me-1.5 size-4" />
              {t("zones.add")}
            </Button>
          )}

          {canEdit && activeTab === "drivers" && (
            <Button
              size="sm"
              onClick={() => setDriverDialog({ mode: "create" })}
              className="h-10 font-semibold shadow-xs text-xs sm:text-sm"
            >
              <Plus className="me-1.5 size-4" />
              {t("drivers.add")}
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Button
          type="button"
          variant={activeTab === "zones" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("zones")}
          className="rounded-full px-4 text-xs font-semibold"
        >
          <MapPin className="me-1.5 size-3.5" />
          {t("tabs.zones")}
          <Badge
            variant="secondary"
            className={cn(
              "ms-1.5 px-1.5 py-0 text-[10px]",
              activeTab === "zones" ? "bg-primary-foreground text-primary" : ""
            )}
          >
            {zones.length}
          </Badge>
        </Button>

        <Button
          type="button"
          variant={activeTab === "drivers" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("drivers")}
          className="rounded-full px-4 text-xs font-semibold"
        >
          <Bike className="me-1.5 size-3.5" />
          {t("tabs.drivers")}
          <Badge
            variant="secondary"
            className={cn(
              "ms-1.5 px-1.5 py-0 text-[10px]",
              activeTab === "drivers"
                ? "bg-primary-foreground text-primary"
                : ""
            )}
          >
            {drivers.length}
          </Badge>
        </Button>
      </div>

      {/* ZONES TAB CONTENT */}
      {activeTab === "zones" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative max-w-sm flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("zones.search")}
                  value={zoneSearch}
                  onChange={(e) => setZoneSearch(e.target.value)}
                  className="ps-9 h-10 text-sm"
                />
                {zoneSearch && (
                  <button
                    type="button"
                    onClick={() => setZoneSearch("")}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  variant={statusFilter === "ALL" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("ALL")}
                  className="h-8 text-xs px-2.5"
                >
                  {t("status.filterAll")}
                </Button>
                <Button
                  type="button"
                  variant={statusFilter === "ACTIVE" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("ACTIVE")}
                  className="h-8 text-xs px-2.5"
                >
                  {t("status.filterActive")}
                </Button>
                <Button
                  type="button"
                  variant={statusFilter === "INACTIVE" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("INACTIVE")}
                  className="h-8 text-xs px-2.5"
                >
                  {t("status.filterInactive")}
                </Button>
              </div>
            </div>
          </div>

          {/* Zones Table / List */}
          {filteredZones.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-6 text-center shadow-sm">
              <MapPin className="size-10 text-muted-foreground/50" />
              <h3 className="text-base font-semibold text-foreground">
                {t("zones.empty")}
              </h3>
              <p className="max-w-sm text-xs text-muted-foreground">
                {t("zones.emptyDesc")}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="font-bold text-xs">
                        {t("zones.name")}
                      </TableHead>
                      <TableHead className="font-bold text-xs text-center">
                        {t("zones.fee")}
                      </TableHead>
                      <TableHead className="font-bold text-xs text-center">
                        {t("status.filterAll")}
                      </TableHead>
                      <TableHead className="font-bold text-xs text-end">
                        {canEdit ? t("actions.edit") : ""}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredZones.map((zone) => {
                      const feeNumber = Number(zone.fee) || 0;
                      return (
                        <TableRow
                          key={zone.id}
                          className={cn(
                            "hover:bg-muted/30 transition-colors",
                            !zone.isActive && "opacity-60"
                          )}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin className="size-4 text-muted-foreground shrink-0" />
                              <span className="font-semibold text-sm">
                                {zone.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-sm">
                            {feeNumber.toFixed(2)} {t("zones.currency")}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={zone.isActive ? "default" : "secondary"}
                              className={cn(
                                "text-[11px]",
                                zone.isActive
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                  : ""
                              )}
                            >
                              {!zone.isActive && (
                                <PowerOff className="me-1 size-3" />
                              )}
                              {zone.isActive
                                ? t("status.active")
                                : t("status.inactive")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-end">
                            <div className="flex items-center justify-end gap-2">
                              <Switch
                                checked={zone.isActive}
                                onCheckedChange={(v) => toggleZone(zone, v)}
                                disabled={!canEdit}
                                aria-label={zone.name}
                              />
                              {canEdit && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  onClick={() =>
                                    setZoneDialog({ mode: "edit", zone })
                                  }
                                  title={t("actions.edit")}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards View */}
              <div className="grid grid-cols-1 gap-3 p-3 sm:hidden">
                {filteredZones.map((zone) => {
                  const feeNumber = Number(zone.fee) || 0;
                  return (
                    <Card
                      key={zone.id}
                      className={cn(
                        "overflow-hidden border shadow-none",
                        !zone.isActive && "opacity-60"
                      )}
                    >
                      <CardContent className="p-3.5 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-semibold text-sm">
                            <MapPin className="size-4 text-muted-foreground" />
                            {zone.name}
                          </div>
                          <Badge
                            variant={zone.isActive ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {zone.isActive
                              ? t("status.active")
                              : t("status.inactive")}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2.5">
                          <div>
                            <span className="text-xs text-muted-foreground me-1">
                              {t("zones.fee")}:
                            </span>
                            <span className="font-mono font-bold text-sm">
                              {feeNumber.toFixed(2)} {t("zones.currency")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={zone.isActive}
                              onCheckedChange={(v) => toggleZone(zone, v)}
                              disabled={!canEdit}
                              aria-label={zone.name}
                            />
                            {canEdit && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() =>
                                  setZoneDialog({ mode: "edit", zone })
                                }
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DRIVERS TAB CONTENT */}
      {activeTab === "drivers" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative max-w-sm flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("drivers.search")}
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  className="ps-9 h-10 text-sm"
                />
                {driverSearch && (
                  <button
                    type="button"
                    onClick={() => setDriverSearch("")}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Type Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  variant={driverTypeFilter === "ALL" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setDriverTypeFilter("ALL")}
                  className="h-8 text-xs px-2.5"
                >
                  {t("drivers.filterAllTypes")}
                </Button>
                <Button
                  type="button"
                  variant={
                    driverTypeFilter === DriverType.OWN ? "secondary" : "ghost"
                  }
                  size="sm"
                  onClick={() => setDriverTypeFilter(DriverType.OWN)}
                  className="h-8 text-xs px-2.5"
                >
                  {t("drivers.types.OWN")}
                </Button>
                <Button
                  type="button"
                  variant={
                    driverTypeFilter === DriverType.APP ? "secondary" : "ghost"
                  }
                  size="sm"
                  onClick={() => setDriverTypeFilter(DriverType.APP)}
                  className="h-8 text-xs px-2.5"
                >
                  {t("drivers.types.APP")}
                </Button>
                <Button
                  type="button"
                  variant={
                    driverTypeFilter === DriverType.EXTERNAL
                      ? "secondary"
                      : "ghost"
                  }
                  size="sm"
                  onClick={() => setDriverTypeFilter(DriverType.EXTERNAL)}
                  className="h-8 text-xs px-2.5"
                >
                  {t("drivers.types.EXTERNAL")}
                </Button>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 border-t pt-2 lg:border-t-0 lg:pt-0">
                <Button
                  type="button"
                  variant={statusFilter === "ALL" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("ALL")}
                  className="h-8 text-xs px-2"
                >
                  {t("status.filterAll")}
                </Button>
                <Button
                  type="button"
                  variant={statusFilter === "ACTIVE" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("ACTIVE")}
                  className="h-8 text-xs px-2"
                >
                  {t("status.filterActive")}
                </Button>
                <Button
                  type="button"
                  variant={statusFilter === "INACTIVE" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("INACTIVE")}
                  className="h-8 text-xs px-2"
                >
                  {t("status.filterInactive")}
                </Button>
              </div>
            </div>
          </div>

          {/* Drivers Table / List */}
          {filteredDrivers.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-6 text-center shadow-sm">
              <Truck className="size-10 text-muted-foreground/50" />
              <h3 className="text-base font-semibold text-foreground">
                {t("drivers.empty")}
              </h3>
              <p className="max-w-sm text-xs text-muted-foreground">
                {t("drivers.emptyDesc")}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="font-bold text-xs">
                        {t("drivers.name")}
                      </TableHead>
                      <TableHead className="font-bold text-xs text-center">
                        {t("drivers.type")}
                      </TableHead>
                      <TableHead className="font-bold text-xs text-center">
                        {t("status.filterAll")}
                      </TableHead>
                      <TableHead className="font-bold text-xs text-end">
                        {canEdit ? t("actions.edit") : ""}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrivers.map((driver) => {
                      const typeBadge = DRIVER_TYPE_BADGES[driver.type];
                      return (
                        <TableRow
                          key={driver.id}
                          className={cn(
                            "hover:bg-muted/30 transition-colors",
                            !driver.isActive && "opacity-60"
                          )}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Bike className="size-4 text-muted-foreground shrink-0" />
                              <span className="font-semibold text-sm">
                                {driver.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={cn("text-[11px]", typeBadge.className)}
                            >
                              {t(typeBadge.labelKey)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={driver.isActive ? "default" : "secondary"}
                              className={cn(
                                "text-[11px]",
                                driver.isActive
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                  : ""
                              )}
                            >
                              {!driver.isActive && (
                                <PowerOff className="me-1 size-3" />
                              )}
                              {driver.isActive
                                ? t("status.active")
                                : t("status.inactive")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-end">
                            <div className="flex items-center justify-end gap-2">
                              <Switch
                                checked={driver.isActive}
                                onCheckedChange={(v) =>
                                  toggleDriver(driver, v)
                                }
                                disabled={!canEdit}
                                aria-label={driver.name}
                              />
                              {canEdit && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  onClick={() =>
                                    setDriverDialog({ mode: "edit", driver })
                                  }
                                  title={t("actions.edit")}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards View */}
              <div className="grid grid-cols-1 gap-3 p-3 sm:hidden">
                {filteredDrivers.map((driver) => {
                  const typeBadge = DRIVER_TYPE_BADGES[driver.type];
                  return (
                    <Card
                      key={driver.id}
                      className={cn(
                        "overflow-hidden border shadow-none",
                        !driver.isActive && "opacity-60"
                      )}
                    >
                      <CardContent className="p-3.5 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-semibold text-sm">
                            <Bike className="size-4 text-muted-foreground" />
                            {driver.name}
                          </div>
                          <Badge
                            variant={driver.isActive ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {driver.isActive
                              ? t("status.active")
                              : t("status.inactive")}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2.5">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px]", typeBadge.className)}
                          >
                            {t(typeBadge.labelKey)}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={driver.isActive}
                              onCheckedChange={(v) => toggleDriver(driver, v)}
                              disabled={!canEdit}
                              aria-label={driver.name}
                            />
                            {canEdit && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() =>
                                  setDriverDialog({ mode: "edit", driver })
                                }
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <ZoneDialog
        state={zoneDialog}
        onClose={() => setZoneDialog(null)}
        onSaved={() => {
          setZoneDialog(null);
          void refreshZones();
        }}
      />
      <DriverDialog
        state={driverDialog}
        onClose={() => setDriverDialog(null)}
        onSaved={() => {
          setDriverDialog(null);
          void refreshDrivers();
        }}
      />
    </div>
  );
}
