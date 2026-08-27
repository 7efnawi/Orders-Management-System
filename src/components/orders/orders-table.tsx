"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import {
  ChevronRight,
  Clock,
  Eye,
  Kanban,
  LayoutGrid,
  Loader2,
  Package,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandBadge } from "@/components/ui/brand-badge";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent } from "@/components/ui/card";
import { CancelDialog } from "./cancel-dialog";
import { DiscountDialog, type PendingDiscountOrder } from "./discount-dialog";
import { OrderDetailsModal } from "./order-details-modal";
import { AssignDriverDialog, type AssignDriverOrder } from "@/components/delivery/assign-driver-dialog";
import { KitchenKanban } from "./kitchen-kanban";
import { PrepTimerBadge } from "./prep-timer-badge";
import { OrderStatus, DiscountStatus, PaymentMethod, Role, CancelReason } from "@prisma/client";
import { cn } from "@/lib/utils";

export interface OrderRowItem {
  id: string;
  orderNumber: string;
  externalId?: string | null;
  status: OrderStatus;
  subtotal: number | string;
  discount: number | string;
  deliveryFee: number | string;
  discountStatus: DiscountStatus;
  discountReason?: string | null;
  paymentMethod: PaymentMethod;
  cancelReason?: CancelReason | null;
  createdAt: string;
  notes?: string | null;
  brand: { id: string; name: string };
  platform: { id: string; name: string };
  customer: {
    id: string;
    name: string;
    phone: string;
    address?: string | null;
  };
  driver?: { id: string; name: string; type: string } | null;
  zone?: { id: string; name: string; fee: number | string } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number | string;
    totalPrice: number | string;
    product: { id: string; name: string };
  }>;
}

interface OrdersTableProps {
  userRole: Role;
  initialBrands?: { id: string; name: string }[];
  initialPlatforms?: { id: string; name: string; isActive: boolean }[];
}

type TabType = "all" | "active" | "delivered" | "cancelled";

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.NEW]: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  [OrderStatus.CONFIRMED]: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  [OrderStatus.PREPARING]: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  [OrderStatus.READY]: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  [OrderStatus.OUT_FOR_DELIVERY]: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  [OrderStatus.DELIVERED]: "bg-green-600/15 text-green-700 dark:text-green-300 border-green-600/30 font-semibold",
  [OrderStatus.CANCELLED]: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};

const NEXT_STATUS_MAP: Record<
  OrderStatus,
  { nextStatus: OrderStatus; actionKey: string; variant: "default" | "outline" | "secondary" } | null
> = {
  [OrderStatus.NEW]: {
    nextStatus: OrderStatus.CONFIRMED,
    actionKey: "confirm",
    variant: "default",
  },
  [OrderStatus.CONFIRMED]: {
    nextStatus: OrderStatus.PREPARING,
    actionKey: "startPreparing",
    variant: "default",
  },
  [OrderStatus.PREPARING]: {
    nextStatus: OrderStatus.READY,
    actionKey: "ready",
    variant: "default",
  },
  [OrderStatus.READY]: {
    nextStatus: OrderStatus.OUT_FOR_DELIVERY,
    actionKey: "outForDelivery",
    variant: "default",
  },
  [OrderStatus.OUT_FOR_DELIVERY]: {
    nextStatus: OrderStatus.DELIVERED,
    actionKey: "deliver",
    variant: "default",
  },
  [OrderStatus.DELIVERED]: null,
  [OrderStatus.CANCELLED]: null,
};

function formatOrderTime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function OrdersTable({
  userRole,
  initialBrands = [],
  initialPlatforms = [],
}: OrdersTableProps) {
  const t = useTranslations("orders");

  // Filter state
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedBrandId, setSelectedBrandId] = useState<string>("ALL");
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("ALL");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // View mode state (Table vs Kitchen Kanban)
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  // Orders data state
  const [orders, setOrders] = useState<OrderRowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [advancingOrderId, setAdvancingOrderId] = useState<string | null>(null);

  // Modals state
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<{
    id: string;
    orderNumber: string;
  } | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const [selectedOrderForDiscount, setSelectedOrderForDiscount] = useState<PendingDiscountOrder | null>(null);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);

  const [selectedOrderForDriver, setSelectedOrderForDriver] = useState<AssignDriverOrder | null>(null);
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [advanceOnDriverAssign, setAdvanceOnDriverAssign] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load orders helper
  const loadOrders = useCallback(
    async (brandId: string, platformId: string, date: string, search: string) => {
      const params = new URLSearchParams();
      if (brandId !== "ALL") params.set("brandId", brandId);
      if (platformId !== "ALL") params.set("platformId", platformId);
      if (date) params.set("date", date);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json() as Promise<OrderRowItem[]>;
    },
    []
  );

  // Manual refresh trigger
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders(selectedBrandId, selectedPlatformId, selectedDate, debouncedSearch)
      .then((data) => {
        setOrders(data);
      })
      .catch(() => {
        toast.error(t("detailsModal.error"));
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [loadOrders, selectedBrandId, selectedPlatformId, selectedDate, debouncedSearch, t]);

  // Initial and filter changes fetch
  useEffect(() => {
    let active = true;
    loadOrders(selectedBrandId, selectedPlatformId, selectedDate, debouncedSearch)
      .then((data) => {
        if (active) {
          setOrders(data);
        }
      })
      .catch(() => {
        if (active) {
          toast.error(t("detailsModal.error"));
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
  }, [loadOrders, selectedBrandId, selectedPlatformId, selectedDate, debouncedSearch, t]);

  // Auto-refresh polling interval (every 15s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadOrders(selectedBrandId, selectedPlatformId, selectedDate, debouncedSearch)
        .then((data) => {
          setOrders(data);
        })
        .catch(() => {
          // Ignore background errors
        });
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadOrders, selectedBrandId, selectedPlatformId, selectedDate, debouncedSearch]);

  // Tab filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeTab === "all") return true;
      if (activeTab === "active") {
        return (
          order.status === OrderStatus.NEW ||
          order.status === OrderStatus.CONFIRMED ||
          order.status === OrderStatus.PREPARING ||
          order.status === OrderStatus.READY ||
          order.status === OrderStatus.OUT_FOR_DELIVERY
        );
      }
      if (activeTab === "delivered") return order.status === OrderStatus.DELIVERED;
      if (activeTab === "cancelled") return order.status === OrderStatus.CANCELLED;
      return true;
    });
  }, [orders, activeTab]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    let active = 0;
    let delivered = 0;
    let cancelled = 0;

    orders.forEach((o) => {
      if (
        o.status === OrderStatus.NEW ||
        o.status === OrderStatus.CONFIRMED ||
        o.status === OrderStatus.PREPARING ||
        o.status === OrderStatus.READY ||
        o.status === OrderStatus.OUT_FOR_DELIVERY
      ) {
        active++;
      } else if (o.status === OrderStatus.DELIVERED) {
        delivered++;
      } else if (o.status === OrderStatus.CANCELLED) {
        cancelled++;
      }
    });

    return { all: orders.length, active, delivered, cancelled };
  }, [orders]);

  // Advance order status handler
  const handleAdvanceStatus = async (order: OrderRowItem) => {
    const nextConfig = NEXT_STATUS_MAP[order.status];
    if (!nextConfig) return;

    // If order is READY and next status is OUT_FOR_DELIVERY, check if driver is assigned
    if (nextConfig.nextStatus === OrderStatus.OUT_FOR_DELIVERY && !order.driver) {
      setSelectedOrderForDriver({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        driver: order.driver,
      });
      setAdvanceOnDriverAssign(true);
      setDriverModalOpen(true);
      return;
    }

    setAdvancingOrderId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextConfig.nextStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update status");
      }

      toast.success(
        `${t(`statuses.${nextConfig.nextStatus}`)} — #${order.orderNumber}`
      );
      handleRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating status";
      toast.error(msg);
    } finally {
      setAdvancingOrderId(null);
    }
  };

  const isManagerOrOwner = userRole === Role.OWNER || userRole === Role.MANAGER;

  return (
    <div className="space-y-6">
      {/* Top Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("liveDashboard")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("dashboardSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Switcher: Table vs Kitchen Kanban */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 shadow-2xs">
            <Button
              type="button"
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={cn(
                "h-7 px-2.5 text-xs font-semibold gap-1.5 rounded-md transition-all",
                viewMode === "table"
                  ? "bg-background text-foreground shadow-xs dark:bg-muted dark:text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-3.5" />
              <span>{t("viewSwitcher.table")}</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "h-7 px-2.5 text-xs font-semibold gap-1.5 rounded-md transition-all",
                viewMode === "kanban"
                  ? "bg-background text-foreground shadow-xs dark:bg-muted dark:text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Kanban className="size-3.5" />
              <span>{t("viewSwitcher.kanban")}</span>
            </Button>
          </div>

          {/* Auto Refresh Toggle */}
          <Button
            type="button"
            variant={autoRefresh ? "secondary" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh((prev) => !prev)}
            className="text-xs"
          >
            <Clock className="me-1.5 size-3.5" />
            {t("autoRefresh")}: {autoRefresh ? "ON" : "OFF"}
          </Button>

          {/* Manual Refresh */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="text-xs"
          >
            <RefreshCw
              className={cn("me-1.5 size-3.5", (loading || refreshing) && "animate-spin")}
            />
            {t("refresh")}
          </Button>

          {/* New Order CTA */}
          <Button asChild size="sm" className="font-semibold shadow-sm">
            <Link href="/orders/new">
              <Plus className="me-1.5 size-4" />
              {t("newOrder")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 border-b pb-4">
          <Button
            type="button"
            variant={activeTab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("all")}
            className="rounded-full px-4 text-xs font-semibold"
          >
            {t("tabs.all")}{" "}
            <Badge
              variant="secondary"
              className={cn(
                "ms-1.5 px-1.5 py-0 text-[10px]",
                activeTab === "all" ? "bg-primary-foreground text-primary" : ""
              )}
            >
              {tabCounts.all}
            </Badge>
          </Button>

          <Button
            type="button"
            variant={activeTab === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("active")}
            className="rounded-full px-4 text-xs font-semibold"
          >
            {t("tabs.active")}{" "}
            <Badge
              variant="secondary"
              className={cn(
                "ms-1.5 px-1.5 py-0 text-[10px]",
                activeTab === "active" ? "bg-primary-foreground text-primary" : ""
              )}
            >
              {tabCounts.active}
            </Badge>
          </Button>

          <Button
            type="button"
            variant={activeTab === "delivered" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("delivered")}
            className="rounded-full px-4 text-xs font-semibold"
          >
            {t("tabs.delivered")}{" "}
            <Badge
              variant="secondary"
              className={cn(
                "ms-1.5 px-1.5 py-0 text-[10px]",
                activeTab === "delivered" ? "bg-primary-foreground text-primary" : ""
              )}
            >
              {tabCounts.delivered}
            </Badge>
          </Button>

          <Button
            type="button"
            variant={activeTab === "cancelled" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("cancelled")}
            className="rounded-full px-4 text-xs font-semibold"
          >
            {t("tabs.cancelled")}{" "}
            <Badge
              variant="secondary"
              className={cn(
                "ms-1.5 px-1.5 py-0 text-[10px]",
                activeTab === "cancelled" ? "bg-primary-foreground text-primary" : ""
              )}
            >
              {tabCounts.cancelled}
            </Badge>
          </Button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("searchOrders")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 h-9 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Brand Filter */}
          <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={t("filterBrand")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("filterBrand")}</SelectItem>
              {initialBrands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Platform Filter */}
          <Select value={selectedPlatformId} onValueChange={setSelectedPlatformId}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={t("filterPlatform")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("filterPlatform")}</SelectItem>
              {initialPlatforms.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Picker Filter */}
          <div className="flex gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 text-xs flex-1"
            />
            {selectedDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate("")}
                className="h-9 px-2 text-xs"
              >
                {t("allDates")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Orders List / Kanban */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border bg-card text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm">{t("detailsModal.loading")}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-6 text-center">
          <Package className="size-10 text-muted-foreground/60" />
          <h3 className="text-base font-semibold text-foreground">{t("table.noOrders")}</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            {t("table.noOrdersDesc")}
          </p>
        </div>
      ) : viewMode === "kanban" ? (
        <KitchenKanban
          orders={filteredOrders}
          userRole={userRole}
          advancingOrderId={advancingOrderId}
          onAdvanceStatus={handleAdvanceStatus}
          onOpenDetails={(id) => {
            setSelectedOrderForDetails(id);
            setDetailsModalOpen(true);
          }}
          onOpenCancel={(o) => {
            setSelectedOrderForCancel(o);
            setCancelModalOpen(true);
          }}
          onOpenDriver={(o, dispatch) => {
            setSelectedOrderForDriver(o);
            setAdvanceOnDriverAssign(dispatch);
            setDriverModalOpen(true);
          }}
          onOpenDiscount={(o) => {
            setSelectedOrderForDiscount(o);
            setDiscountModalOpen(true);
          }}
        />
      ) : (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-bold text-xs">{t("table.orderNumber")}</TableHead>
                  <TableHead className="font-bold text-xs">{t("table.brand")} / {t("table.platform")}</TableHead>
                  <TableHead className="font-bold text-xs">{t("table.customer")}</TableHead>
                  <TableHead className="font-bold text-xs">{t("table.status")}</TableHead>
                  <TableHead className="font-bold text-xs">{t("table.payment")}</TableHead>
                  <TableHead className="font-bold text-xs text-end">{t("table.total")}</TableHead>
                  <TableHead className="font-bold text-xs text-center">{t("table.time")}</TableHead>
                  <TableHead className="font-bold text-xs text-center">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const subtotal = Number(order.subtotal) || 0;
                  const discount = Number(order.discount) || 0;
                  const deliveryFee = Number(order.deliveryFee) || 0;
                  const total = Math.max(0, subtotal - discount + deliveryFee);
                  const nextConfig = NEXT_STATUS_MAP[order.status];
                  const isAdvancing = advancingOrderId === order.id;

                  return (
                    <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                      {/* Order Number & External ID */}
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrderForDetails(order.id);
                              setDetailsModalOpen(true);
                            }}
                            className="font-bold text-primary hover:underline text-start font-mono text-xs"
                          >
                            #{order.orderNumber}
                          </button>
                          {order.externalId && (
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {order.externalId}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Brand & Platform */}
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <BrandBadge brandName={order.brand.name} size="sm" />
                          <PlatformBadge platformName={order.platform.name} size="sm" />
                        </div>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground">
                            {order.customer.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono dir-ltr text-start">
                            {order.customer.phone}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status & Prep Timer & Discount Alert */}
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className={cn("text-[11px] font-semibold", STATUS_COLORS[order.status])}
                            >
                              {t(`statuses.${order.status}`)}
                            </Badge>
                            <PrepTimerBadge
                              startTime={order.createdAt}
                              status={order.status}
                              size="sm"
                              showDelayText={order.status === OrderStatus.PREPARING}
                            />
                          </div>

                          {order.driver && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                              <Truck className="size-2.5 text-primary shrink-0" />
                              <span className="truncate max-w-[100px]">{order.driver.name}</span>
                            </span>
                          )}

                          {order.discountStatus === DiscountStatus.PENDING && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isManagerOrOwner) {
                                  setSelectedOrderForDiscount({
                                    id: order.id,
                                    orderNumber: order.orderNumber,
                                    discount: order.discount,
                                    discountReason: order.discountReason,
                                  });
                                  setDiscountModalOpen(true);
                                }
                              }}
                              className={cn(
                                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30",
                                isManagerOrOwner && "hover:bg-amber-500/25 cursor-pointer"
                              )}
                            >
                              <Percent className="size-2.5" />
                              {t("discountStatuses.PENDING")} ({Number(order.discount)} {t("currency")})
                            </button>
                          )}
                        </div>
                      </TableCell>

                      {/* Payment */}
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {t(`paymentMethods.${order.paymentMethod}`)}
                        </span>
                      </TableCell>

                      {/* Total */}
                      <TableCell className="text-end">
                        <span className="font-mono font-bold text-xs text-foreground">
                          {total.toFixed(2)} {t("currency")}
                        </span>
                      </TableCell>

                      {/* Created Time */}
                      <TableCell className="text-center">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {formatOrderTime(order.createdAt)}
                        </span>
                      </TableCell>

                      {/* Action Buttons */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1-Click Status Advance */}
                          {nextConfig && (
                            <Button
                              type="button"
                              size="sm"
                              variant={nextConfig.variant}
                              onClick={() => handleAdvanceStatus(order)}
                              disabled={isAdvancing}
                              className="h-7 text-xs px-2.5 font-semibold bg-primary hover:bg-primary/90"
                            >
                              {isAdvancing ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <>
                                  {t(`actions.${nextConfig.actionKey}`)}
                                  <ChevronRight className="ms-1 size-3.5 rtl:rotate-180" />
                                </>
                              )}
                            </Button>
                          )}

                          {/* Manager Discount Decision Button */}
                          {isManagerOrOwner && order.discountStatus === DiscountStatus.PENDING && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrderForDiscount({
                                  id: order.id,
                                  orderNumber: order.orderNumber,
                                  discount: order.discount,
                                  discountReason: order.discountReason,
                                });
                                setDiscountModalOpen(true);
                              }}
                              className="h-7 text-xs px-2 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                              title={t("actions.decideDiscount")}
                            >
                              <Percent className="size-3.5" />
                            </Button>
                          )}

                          {/* Driver Assignment Button (if non-terminal) */}
                          {order.status !== OrderStatus.DELIVERED &&
                            order.status !== OrderStatus.CANCELLED && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedOrderForDriver({
                                    id: order.id,
                                    orderNumber: order.orderNumber,
                                    status: order.status,
                                    driver: order.driver,
                                  });
                                  setAdvanceOnDriverAssign(false);
                                  setDriverModalOpen(true);
                                }}
                                className={cn(
                                  "h-7 size-7 p-0",
                                  order.driver
                                    ? "text-primary hover:text-primary hover:bg-primary/10"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                                title={order.driver ? t("actions.reassignDriver") : t("actions.assignDriver")}
                              >
                                <Truck className="size-3.5" />
                              </Button>
                            )}

                          {/* Details Button */}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedOrderForDetails(order.id);
                              setDetailsModalOpen(true);
                            }}
                            className="h-7 size-7 p-0"
                            title={t("actions.details")}
                          >
                            <Eye className="size-3.5" />
                          </Button>

                          {/* Cancel Button (if non-terminal) */}
                          {order.status !== OrderStatus.DELIVERED &&
                            order.status !== OrderStatus.CANCELLED && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedOrderForCancel({
                                    id: order.id,
                                    orderNumber: order.orderNumber,
                                  });
                                  setCancelModalOpen(true);
                                }}
                                className="h-7 size-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title={t("actions.cancel")}
                              >
                                <XCircle className="size-3.5" />
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

          {/* Mobile / Tablet Cards View */}
          <div className="grid grid-cols-1 gap-3 p-3 lg:hidden sm:grid-cols-2">
            {filteredOrders.map((order) => {
              const subtotal = Number(order.subtotal) || 0;
              const discount = Number(order.discount) || 0;
              const deliveryFee = Number(order.deliveryFee) || 0;
              const total = Math.max(0, subtotal - discount + deliveryFee);
              const nextConfig = NEXT_STATUS_MAP[order.status];
              const isAdvancing = advancingOrderId === order.id;

              return (
                <Card key={order.id} className="overflow-hidden border shadow-none">
                  <CardContent className="p-3.5 space-y-3">
                    {/* Header: Number, Badges, Time */}
                    <div className="flex items-center justify-between gap-2 border-b pb-2">
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderForDetails(order.id);
                            setDetailsModalOpen(true);
                          }}
                          className="font-bold text-primary hover:underline font-mono text-sm"
                        >
                          #{order.orderNumber}
                        </button>
                        {order.externalId && (
                          <span className="block text-[11px] text-muted-foreground font-mono">
                            {order.externalId}
                          </span>
                        )}
                      </div>
                      <div className="text-end flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className={cn("text-xs font-semibold", STATUS_COLORS[order.status])}
                          >
                            {t(`statuses.${order.status}`)}
                          </Badge>
                          <PrepTimerBadge
                            startTime={order.createdAt}
                            status={order.status}
                            size="sm"
                            showDelayText={order.status === OrderStatus.PREPARING}
                          />
                        </div>
                        <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">
                          {formatOrderTime(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Meta: Brand, Customer, Payment */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t("table.brand")}:</span>
                        <div className="flex gap-1.5 items-center">
                          <BrandBadge brandName={order.brand.name} size="sm" />
                          <PlatformBadge platformName={order.platform.name} size="sm" />
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t("table.customer")}:</span>
                        <span className="font-semibold text-foreground">
                          {order.customer.name} ({order.customer.phone})
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t("table.payment")}:</span>
                        <span>{t(`paymentMethods.${order.paymentMethod}`)}</span>
                      </div>

                      <div className="flex justify-between items-center border-t pt-1.5 font-bold text-sm">
                        <span>{t("table.total")}:</span>
                        <span className="font-mono text-primary">
                          {total.toFixed(2)} {t("currency")}
                        </span>
                      </div>

                      {order.discountStatus === DiscountStatus.PENDING && (
                        <div className="flex justify-between items-center pt-1">
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px]"
                          >
                            <Percent className="size-2.5 me-1" />
                            {t("discountStatuses.PENDING")}: {Number(order.discount)} {t("currency")}
                          </Badge>
                          {isManagerOrOwner && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrderForDiscount({
                                  id: order.id,
                                  orderNumber: order.orderNumber,
                                  discount: order.discount,
                                  discountReason: order.discountReason,
                                });
                                setDiscountModalOpen(true);
                              }}
                              className="h-6 text-[10px] px-2 text-amber-600 border-amber-500/30"
                            >
                              {t("actions.decideDiscount")}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="flex items-center justify-between gap-2 border-t pt-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrderForDetails(order.id);
                            setDetailsModalOpen(true);
                          }}
                          className="h-8 text-xs px-2.5"
                        >
                          <Eye className="me-1 size-3.5" />
                          {t("actions.details")}
                        </Button>

                        {order.status !== OrderStatus.DELIVERED &&
                          order.status !== OrderStatus.CANCELLED && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrderForDriver({
                                  id: order.id,
                                  orderNumber: order.orderNumber,
                                  status: order.status,
                                  driver: order.driver,
                                });
                                setAdvanceOnDriverAssign(false);
                                setDriverModalOpen(true);
                              }}
                              className={cn(
                                "h-8 text-xs px-2",
                                order.driver
                                  ? "text-primary border-primary/30"
                                  : "text-muted-foreground"
                              )}
                              title={order.driver ? t("actions.reassignDriver") : t("actions.assignDriver")}
                            >
                              <Truck className="me-1 size-3.5" />
                              <span className="max-w-[70px] truncate">
                                {order.driver ? order.driver.name : t("actions.assignDriver")}
                              </span>
                            </Button>
                          )}

                        {order.status !== OrderStatus.DELIVERED &&
                          order.status !== OrderStatus.CANCELLED && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedOrderForCancel({
                                  id: order.id,
                                  orderNumber: order.orderNumber,
                                });
                                setCancelModalOpen(true);
                              }}
                              className="h-8 text-xs px-2 text-destructive hover:bg-destructive/10"
                            >
                              <XCircle className="size-3.5" />
                            </Button>
                          )}
                      </div>

                      {nextConfig && (
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          onClick={() => handleAdvanceStatus(order)}
                          disabled={isAdvancing}
                          className="h-8 text-xs px-3 font-semibold"
                        >
                          {isAdvancing ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <>
                              {t(`actions.${nextConfig.actionKey}`)}
                              <ChevronRight className="ms-1 size-3.5 rtl:rotate-180" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancel Order Dialog */}
      <CancelDialog
        orderId={selectedOrderForCancel?.id || null}
        orderNumber={selectedOrderForCancel?.orderNumber}
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        onSuccess={handleRefresh}
      />

      {/* Discount Decision Dialog */}
      <DiscountDialog
        order={selectedOrderForDiscount}
        open={discountModalOpen}
        onOpenChange={setDiscountModalOpen}
        onSuccess={handleRefresh}
      />

      {/* Assign Driver Dialog */}
      <AssignDriverDialog
        order={selectedOrderForDriver}
        open={driverModalOpen}
        onOpenChange={setDriverModalOpen}
        defaultDispatch={advanceOnDriverAssign}
        onSuccess={handleRefresh}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        orderId={selectedOrderForDetails}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />
    </div>
  );
}
