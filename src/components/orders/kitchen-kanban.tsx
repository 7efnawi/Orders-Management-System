"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertCircle,
  Bike,
  CheckCircle2,
  ChevronRight,
  Eye,
  GripVertical,
  Inbox,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  Percent,
  Truck,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandBadge } from "@/components/ui/brand-badge";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PrepTimerBadge } from "./prep-timer-badge";
import { AssignDriverOrder } from "@/components/delivery/assign-driver-dialog";
import { PendingDiscountOrder } from "./discount-dialog";
import { OrderRowItem } from "./orders-table";
import { OrderStatus, DiscountStatus, Role } from "@/types/enums";
import { ALLOWED_TRANSITIONS } from "@/lib/orderStateMachine";
import { cn } from "@/lib/utils";

export interface KitchenKanbanProps {
  orders: OrderRowItem[];
  userRole: Role;
  advancingOrderId?: string | null;
  onAdvanceStatus: (order: OrderRowItem) => void;
  onTransitionStatus?: (order: OrderRowItem, targetStatus: OrderStatus) => void;
  onOpenDetails: (orderId: string) => void;
  onOpenCancel: (order: { id: string; orderNumber: string }) => void;
  onOpenDriver: (order: AssignDriverOrder, defaultDispatch: boolean) => void;
  onOpenDiscount?: (order: PendingDiscountOrder) => void;
}

export type KanbanColumnId =
  | "new_confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered";

interface KanbanColumnConfig {
  id: KanbanColumnId;
  titleKey: string;
  statuses: OrderStatus[];
  icon: React.ElementType;
  headerColorClass: string;
  badgeColorClass: string;
  borderColorClass: string;
  accentBgClass: string;
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: "new_confirmed",
    titleKey: "columns.newAndConfirmed",
    statuses: [OrderStatus.NEW, OrderStatus.CONFIRMED],
    icon: Inbox,
    headerColorClass: "text-blue-600 dark:text-blue-400",
    badgeColorClass: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    borderColorClass: "border-blue-500/30",
    accentBgClass: "bg-blue-500/5",
  },
  {
    id: "preparing",
    titleKey: "columns.preparing",
    statuses: [OrderStatus.PREPARING],
    icon: UtensilsCrossed,
    headerColorClass: "text-amber-600 dark:text-amber-400",
    badgeColorClass: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
    borderColorClass: "border-amber-500/30",
    accentBgClass: "bg-amber-500/5",
  },
  {
    id: "ready",
    titleKey: "columns.ready",
    statuses: [OrderStatus.READY],
    icon: PackageCheck,
    headerColorClass: "text-emerald-600 dark:text-emerald-400",
    badgeColorClass: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    borderColorClass: "border-emerald-500/30",
    accentBgClass: "bg-emerald-500/5",
  },
  {
    id: "out_for_delivery",
    titleKey: "columns.outForDelivery",
    statuses: [OrderStatus.OUT_FOR_DELIVERY],
    icon: Bike,
    headerColorClass: "text-purple-600 dark:text-purple-400",
    badgeColorClass: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
    borderColorClass: "border-purple-500/30",
    accentBgClass: "bg-purple-500/5",
  },
  {
    id: "delivered",
    titleKey: "columns.delivered",
    statuses: [OrderStatus.DELIVERED],
    icon: CheckCircle2,
    headerColorClass: "text-green-700 dark:text-green-300",
    badgeColorClass: "bg-green-600/20 text-green-800 dark:text-green-200",
    borderColorClass: "border-green-600/30",
    accentBgClass: "bg-green-500/5",
  },
];

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

export function KitchenKanban({
  orders,
  userRole,
  advancingOrderId,
  onAdvanceStatus,
  onTransitionStatus,
  onOpenDetails,
  onOpenCancel,
  onOpenDriver,
  onOpenDiscount,
}: KitchenKanbanProps) {
  const t = useTranslations("orders");
  const isManagerOrOwner = userRole === Role.OWNER || userRole === Role.MANAGER;

  const [draggingOrderId, setDraggingOrderId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<KanbanColumnId | null>(null);

  const COLUMN_TARGET_STATUS: Record<KanbanColumnId, OrderStatus> = {
    new_confirmed: OrderStatus.CONFIRMED,
    preparing: OrderStatus.PREPARING,
    ready: OrderStatus.READY,
    out_for_delivery: OrderStatus.OUT_FOR_DELIVERY,
    delivered: OrderStatus.DELIVERED,
  };

  const handleDropOrder = (orderId: string, targetColId: KanbanColumnId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const currentStatus = order.status;
    const targetStatus = COLUMN_TARGET_STATUS[targetColId];

    // Check if already in this column
    if (
      currentStatus === targetStatus ||
      ((currentStatus === OrderStatus.NEW || currentStatus === OrderStatus.CONFIRMED) &&
        targetColId === "new_confirmed")
    ) {
      return;
    }

    // Direct transition or NEW -> PREPARING
    const isDirectAllowed = ALLOWED_TRANSITIONS[currentStatus]?.includes(targetStatus);
    const isNewToPreparing =
      currentStatus === OrderStatus.NEW && targetStatus === OrderStatus.PREPARING;

    if (!isDirectAllowed && !isNewToPreparing) {
      toast.error(t("kanban.invalidTransition") || "لا يمكن نقل هذا الطلب لهذه الحالة مباشرة");
      return;
    }

    // If moving to OUT_FOR_DELIVERY without a driver assigned
    if (targetStatus === OrderStatus.OUT_FOR_DELIVERY && !order.driver) {
      onOpenDriver(
        {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          driver: null,
        },
        true
      );
      toast.info(
        t("kanban.assignDriverFirst") || "يرجى اختيار وتعيين مندوب التوصيل للطلب أولاً"
      );
      return;
    }

    if (onTransitionStatus) {
      onTransitionStatus(order, targetStatus);
    } else {
      onAdvanceStatus(order);
    }
  };

  // Group orders into columns
  const columnOrders = useMemo(() => {
    const grouped: Record<KanbanColumnId, OrderRowItem[]> = {
      new_confirmed: [],
      preparing: [],
      ready: [],
      out_for_delivery: [],
      delivered: [],
    };

    orders.forEach((order) => {
      if (order.status === OrderStatus.NEW || order.status === OrderStatus.CONFIRMED) {
        grouped.new_confirmed.push(order);
      } else if (order.status === OrderStatus.PREPARING) {
        grouped.preparing.push(order);
      } else if (order.status === OrderStatus.READY) {
        grouped.ready.push(order);
      } else if (order.status === OrderStatus.OUT_FOR_DELIVERY) {
        grouped.out_for_delivery.push(order);
      } else if (order.status === OrderStatus.DELIVERED) {
        grouped.delivered.push(order);
      }
    });

    return grouped;
  }, [orders]);

  return (
    <div className="w-full">
      {/* 5-Column Kanban Board Grid / Scroll Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
        {KANBAN_COLUMNS.map((col) => {
          const colList = columnOrders[col.id] || [];
          const Icon = col.icon;
          const isDragOver = dragOverColumnId === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverColumnId !== col.id) {
                  setDragOverColumnId(col.id);
                }
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setDragOverColumnId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverColumnId(null);
                const orderId = e.dataTransfer.getData("text/plain");
                if (orderId) {
                  handleDropOrder(orderId, col.id);
                }
              }}
              className={cn(
                "flex flex-col rounded-2xl border bg-card/50 shadow-2xs transition-all",
                col.borderColorClass,
                isDragOver &&
                  "border-2 border-dashed border-primary bg-primary/10 ring-2 ring-primary/20 scale-[1.01]",
                "min-h-[500px] max-h-[calc(100vh-210px)] overflow-hidden"
              )}
            >
              {/* Column Header */}
              <div
                className={cn(
                  "flex items-center justify-between px-3.5 py-3 border-b bg-card sticky top-0 z-10",
                  col.accentBgClass
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg border",
                      col.headerColorClass,
                      col.borderColorClass,
                      "bg-background/80"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <h3 className={cn("text-xs font-bold tracking-tight", col.headerColorClass)}>
                    {t(`kanban.${col.titleKey}`)}
                  </h3>
                </div>

                <Badge
                  variant="secondary"
                  className={cn(
                    "px-2 py-0.5 text-xs font-mono font-bold rounded-full",
                    col.badgeColorClass
                  )}
                >
                  {colList.length}
                </Badge>
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {colList.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-4 text-center">
                    <Package className="size-6 text-muted-foreground/40 mb-1.5" />
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("kanban.emptyColumn")}
                    </p>
                  </div>
                ) : (
                  colList.map((order) => {
                    const subtotal = Number(order.subtotal) || 0;
                    const discount = Number(order.discount) || 0;
                    const deliveryFee = Number(order.deliveryFee) || 0;
                    const total = Math.max(0, subtotal - discount + deliveryFee);
                    const nextConfig = NEXT_STATUS_MAP[order.status];
                    const isAdvancing = advancingOrderId === order.id;
                    const isCardDragging = draggingOrderId === order.id;
                    const canDrag =
                      !isAdvancing &&
                      order.status !== OrderStatus.DELIVERED &&
                      order.status !== OrderStatus.CANCELLED;

                    return (
                      <Card
                        key={order.id}
                        draggable={canDrag}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", order.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingOrderId(order.id);
                        }}
                        onDragEnd={() => {
                          setDraggingOrderId(null);
                          setDragOverColumnId(null);
                        }}
                        className={cn(
                          "group relative overflow-hidden border shadow-2xs hover:shadow-sm transition-all rounded-xl bg-card",
                          order.status === OrderStatus.PREPARING
                            ? "border-amber-500/40 hover:border-amber-500"
                            : "hover:border-primary/40",
                          isCardDragging && "opacity-40 scale-95 border-dashed",
                          canDrag && "cursor-grab active:cursor-grabbing"
                        )}
                      >
                        <CardContent className="p-3 space-y-2.5">
                          {/* Card Header: Drag Handle, Order #, Badges, Prep Timer */}
                          <div className="flex items-start justify-between gap-2 border-b pb-2">
                            <div className="flex items-center gap-1 min-w-0">
                              {canDrag && (
                                <GripVertical className="size-3 text-muted-foreground/30 group-hover:text-muted-foreground/70 shrink-0" />
                              )}
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  onClick={() => onOpenDetails(order.id)}
                                  className="text-start font-mono text-xs font-bold text-primary hover:underline"
                                >
                                  #{order.orderNumber}
                                </button>
                                {order.externalId && (
                                  <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[90px]">
                                    {order.externalId}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              {/* Live Prep Timer Badge (Active on NEW, CONFIRMED, PREPARING, READY) */}
                              <PrepTimerBadge
                                startTime={order.createdAt}
                                status={order.status}
                                size="sm"
                                showDelayText={order.status === OrderStatus.PREPARING}
                              />
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {formatOrderTime(order.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Brand & Platform Badges */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <BrandBadge brandName={order.brand.name} size="sm" />
                            <PlatformBadge platformName={order.platform.name} size="sm" />
                          </div>

                          {/* Customer & Zone Info */}
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span className="font-semibold text-foreground truncate max-w-[130px]">
                                {order.customer.name}
                              </span>
                              <span className="font-mono text-[11px] dir-ltr text-muted-foreground">
                                {order.customer.phone}
                              </span>
                            </div>

                            {order.zone && (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <MapPin className="size-3 text-primary shrink-0" />
                                <span className="truncate">{order.zone.name}</span>
                              </div>
                            )}
                          </div>

                          {/* Items Summary (Clear quantities for kitchen staff) */}
                          <div className="rounded-lg bg-muted/40 p-2 space-y-1 text-xs border border-border/50">
                            {order.items.slice(0, 3).map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-1 text-[11px]"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-mono font-bold text-primary shrink-0">
                                    {item.quantity}×
                                  </span>
                                  <span className="truncate text-foreground">
                                    {item.product.name}
                                  </span>
                                </div>
                              </div>
                            ))}

                            {order.items.length > 3 && (
                              <div className="text-[10px] font-medium text-muted-foreground pt-0.5 text-end">
                                {t("kanban.moreItems", {
                                  count: order.items.length - 3,
                                })}
                              </div>
                            )}
                          </div>

                          {/* Order Notes / Allergy Warning (High Visibility!) */}
                          {order.notes && (
                            <div className="rounded-lg bg-amber-500/15 border border-amber-500/30 p-2 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                              <AlertCircle className="size-3.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                              <span className="font-medium text-[11px] leading-tight">
                                {order.notes}
                              </span>
                            </div>
                          )}

                          {/* Price & Payment & Driver Details */}
                          <div className="space-y-1.5 pt-1 text-xs border-t">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                                {t(`paymentMethods.${order.paymentMethod}`)}
                              </Badge>
                              <span className="font-mono font-bold text-sm text-foreground tabular-nums">
                                {total.toFixed(2)} {t("currency")}
                              </span>
                            </div>

                            {/* Driver Badge / Prompt */}
                            {order.driver ? (
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/30 rounded-md px-2 py-1">
                                <span className="flex items-center gap-1 font-medium text-foreground">
                                  <Truck className="size-3 text-primary shrink-0" />
                                  <span className="truncate max-w-[120px]">{order.driver.name}</span>
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    onOpenDriver(
                                      {
                                        id: order.id,
                                        orderNumber: order.orderNumber,
                                        status: order.status,
                                        driver: order.driver,
                                      },
                                      false
                                    )
                                  }
                                  className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                                >
                                  {t("actions.reassignDriver")}
                                </Button>
                              </div>
                            ) : (
                              (order.status === OrderStatus.READY ||
                                order.status === OrderStatus.OUT_FOR_DELIVERY) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenDriver(
                                      {
                                        id: order.id,
                                        orderNumber: order.orderNumber,
                                        status: order.status,
                                        driver: null,
                                      },
                                      true
                                    )
                                  }
                                  className="w-full flex items-center justify-center gap-1 rounded-md border border-dashed border-purple-400 bg-purple-500/10 py-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 transition-colors"
                                >
                                  <Truck className="size-3 shrink-0" />
                                  {t("kanban.noDriverAssigned")} — {t("actions.assignDriver")}
                                </button>
                              )
                            )}

                            {/* Pending Discount Banner */}
                            {order.discountStatus === DiscountStatus.PENDING && (
                              <div className="flex items-center justify-between rounded-md bg-amber-500/10 border border-amber-500/30 p-1.5 text-[10px]">
                                <span className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-300">
                                  <Percent className="size-2.5" />
                                  {t("discountStatuses.PENDING")}: {Number(order.discount)} {t("currency")}
                                </span>
                                {isManagerOrOwner && onOpenDiscount && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      onOpenDiscount({
                                        id: order.id,
                                        orderNumber: order.orderNumber,
                                        discount: order.discount,
                                        discountReason: order.discountReason,
                                      })
                                    }
                                    className="h-5 px-1.5 text-[10px] text-amber-600 border-amber-500/40 hover:bg-amber-500/20"
                                  >
                                    {t("actions.decideDiscount")}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons: 1-Click State Advance + Secondary Actions */}
                          <div className="pt-2 border-t space-y-2">
                            {/* Primary 1-Click Status Advance */}
                            {nextConfig && (
                              <Button
                                type="button"
                                size="sm"
                                variant="default"
                                onClick={() => onAdvanceStatus(order)}
                                disabled={isAdvancing}
                                className="w-full h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                              >
                                {isAdvancing ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <span>{t(`actions.${nextConfig.actionKey}`)}</span>
                                    <ChevronRight className="ms-1 size-3.5 rtl:rotate-180" />
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Secondary Quick Action Icons */}
                            <div className="flex items-center justify-between gap-1 pt-0.5">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => onOpenDetails(order.id)}
                                className="h-7 flex-1 text-xs px-2"
                              >
                                <Eye className="me-1 size-3.5" />
                                {t("actions.details")}
                              </Button>

                              {order.status !== OrderStatus.DELIVERED &&
                                order.status !== OrderStatus.CANCELLED && (
                                  <>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        onOpenDriver(
                                          {
                                            id: order.id,
                                            orderNumber: order.orderNumber,
                                            status: order.status,
                                            driver: order.driver,
                                          },
                                          false
                                        )
                                      }
                                      className={cn(
                                        "h-7 size-7 p-0",
                                        order.driver
                                          ? "text-primary hover:bg-primary/10"
                                          : "text-muted-foreground hover:text-foreground"
                                      )}
                                      title={
                                        order.driver
                                          ? t("actions.reassignDriver")
                                          : t("actions.assignDriver")
                                      }
                                    >
                                      <Truck className="size-3.5" />
                                    </Button>

                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        onOpenCancel({
                                          id: order.id,
                                          orderNumber: order.orderNumber,
                                        })
                                      }
                                      className="h-7 size-7 p-0 text-destructive hover:bg-destructive/10"
                                      title={t("actions.cancel")}
                                    >
                                      <XCircle className="size-3.5" />
                                    </Button>
                                  </>
                                )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
