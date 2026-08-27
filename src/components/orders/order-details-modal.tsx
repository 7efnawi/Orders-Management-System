"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  Phone,
  Receipt,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BrandBadge } from "@/components/ui/brand-badge";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AssignDriverDialog } from "@/components/delivery/assign-driver-dialog";
import { OrderStatus, DiscountStatus, PaymentMethod, CancelReason } from "@prisma/client";
import { cn } from "@/lib/utils";

interface OrderDetailsModalProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrderDetailData {
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
  notes?: string | null;
  createdAt: string;
  confirmedAt?: string | null;
  preparingAt?: string | null;
  readyAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  brand: { id: string; name: string };
  platform: { id: string; name: string };
  customer: {
    id: string;
    name: string;
    phone: string;
    address?: string | null;
    notes?: string | null;
  };
  zone?: { id: string; name: string; fee: number | string } | null;
  driver?: { id: string; name: string; type: string } | null;
  cashier?: { id: string; name: string | null; email: string } | null;
  requester?: { id: string; name: string | null; email: string } | null;
  approver?: { id: string; name: string | null; email: string } | null;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number | string;
    totalPrice: number | string;
    product: { id: string; name: string; description?: string | null };
  }>;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { variant: string; className: string }
> = {
  [OrderStatus.NEW]: {
    variant: "outline",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  [OrderStatus.CONFIRMED]: {
    variant: "outline",
    className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  },
  [OrderStatus.PREPARING]: {
    variant: "outline",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  [OrderStatus.READY]: {
    variant: "outline",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  [OrderStatus.OUT_FOR_DELIVERY]: {
    variant: "outline",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
  [OrderStatus.DELIVERED]: {
    variant: "outline",
    className: "bg-green-600/15 text-green-700 dark:text-green-300 border-green-600/30 font-semibold",
  },
  [OrderStatus.CANCELLED]: {
    variant: "outline",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  },
};

function formatTimestamp(isoString?: string | null): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export function OrderDetailsModal({
  orderId,
  open,
  onOpenChange,
}: OrderDetailsModalProps) {
  const t = useTranslations("orders");
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignDriverModalOpen, setAssignDriverModalOpen] = useState(false);

  const fetchOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        throw new Error(t("detailsModal.error"));
      }
      const data = await res.json();
      setOrder(data);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("detailsModal.error");
      setError(msg);
    }
  };

  useEffect(() => {
    if (!open || !orderId) return;

    let isMounted = true;

    fetch(`/api/orders/${orderId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(t("detailsModal.error"));
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setOrder(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || t("detailsModal.error"));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, orderId, t]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setOrder(null);
      setError(null);
      setLoading(false);
    } else {
      setLoading(true);
    }
    onOpenChange(nextOpen);
  };

  const subtotal = Number(order?.subtotal) || 0;
  const discount = Number(order?.discount) || 0;
  const deliveryFee = Number(order?.deliveryFee) || 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[760px] p-4 sm:p-6">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="size-5 text-primary" />
              <DialogTitle className="text-xl font-bold">
                {order ? `#${order.orderNumber}` : t("detailsModal.title")}
              </DialogTitle>
              {order && (
                <Badge
                  variant="outline"
                  className={cn("text-xs font-semibold", STATUS_CONFIG[order.status]?.className)}
                >
                  {t(`statuses.${order.status}`)}
                </Badge>
              )}
            </div>

            {order && (
              <div className="flex items-center gap-2 text-xs">
                <BrandBadge brandName={order.brand.name} size="md" />
                <PlatformBadge platformName={order.platform.name} size="md" />
                {order.externalId && (
                  <Badge variant="outline" className="border-dashed font-mono">
                    {order.externalId}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {loading && (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm">{t("detailsModal.loading")}</p>
          </div>
        )}

        {error && (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-destructive">
            <XCircle className="size-8" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {order && !loading && (
          <div className="space-y-6 pt-2">
            {/* Info Grid: Customer, Cashier/Payment, Delivery */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
              {/* Customer */}
              <div className="rounded-xl border bg-muted/20 p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <User className="size-4 text-primary" />
                  <span>{t("detailsModal.customerInfo")}</span>
                </div>
                <div className="text-foreground font-medium">{order.customer.name}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground dir-ltr text-start">
                  <Phone className="size-3 shrink-0" />
                  <a
                    href={`tel:${order.customer.phone}`}
                    className="hover:underline hover:text-primary font-mono"
                  >
                    {order.customer.phone}
                  </a>
                </div>
                {order.customer.address && (
                  <div className="flex items-start gap-1 text-xs text-muted-foreground pt-1">
                    <MapPin className="size-3 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{order.customer.address}</span>
                  </div>
                )}
              </div>

              {/* Delivery & Driver */}
              <div className="rounded-xl border bg-muted/20 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Truck className="size-4 text-primary" />
                    <span>{t("detailsModal.driver")} / {t("detailsModal.deliveryZone")}</span>
                  </div>
                  {order.status !== OrderStatus.DELIVERED &&
                    order.status !== OrderStatus.CANCELLED && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setAssignDriverModalOpen(true)}
                        className="h-6 text-[11px] px-2 text-primary hover:text-primary hover:bg-primary/10"
                      >
                        {order.driver ? t("actions.reassignDriver") : t("actions.assignDriver")}
                      </Button>
                    )}
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("detailsModal.deliveryZone")}:</span>
                    <span className="font-medium">{order.zone?.name || t("noZone")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t("detailsModal.driver")}:</span>
                    <span className="font-medium">
                      {order.driver ? (
                        <>
                          {order.driver.name}{" "}
                          <span className="text-muted-foreground text-[10px]">
                            ({t(`driverTypes.${order.driver.type as "OWN" | "APP" | "EXTERNAL" | "PICKUP"}`) || order.driver.type})
                          </span>
                        </>
                      ) : (
                        t("noDriver")
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cashier & Payment */}
              <div className="rounded-xl border bg-muted/20 p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <CreditCard className="size-4 text-primary" />
                  <span>{t("detailsModal.paymentMethod")}</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t("detailsModal.paymentMethod")}:</span>
                    <Badge variant="outline" className="text-xs">
                      {t(`paymentMethods.${order.paymentMethod}`)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("detailsModal.cashier")}:</span>
                    <span className="font-medium">
                      {order.cashier?.name || order.cashier?.email || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Clock className="size-4 text-primary" />
                <span>{t("detailsModal.timeline")}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 text-xs">
                <div className="rounded-lg bg-muted/40 p-2 border">
                  <span className="text-muted-foreground block mb-0.5">{t("detailsModal.createdAt")}</span>
                  <span className="font-medium font-mono text-[11px]">{formatTimestamp(order.createdAt)}</span>
                </div>

                {order.confirmedAt && (
                  <div className="rounded-lg bg-muted/40 p-2 border">
                    <span className="text-muted-foreground block mb-0.5">{t("detailsModal.confirmedAt")}</span>
                    <span className="font-medium font-mono text-[11px]">{formatTimestamp(order.confirmedAt)}</span>
                  </div>
                )}

                {order.preparingAt && (
                  <div className="rounded-lg bg-muted/40 p-2 border">
                    <span className="text-muted-foreground block mb-0.5">{t("detailsModal.preparingAt")}</span>
                    <span className="font-medium font-mono text-[11px]">{formatTimestamp(order.preparingAt)}</span>
                  </div>
                )}

                {order.readyAt && (
                  <div className="rounded-lg bg-muted/40 p-2 border">
                    <span className="text-muted-foreground block mb-0.5">{t("detailsModal.readyAt")}</span>
                    <span className="font-medium font-mono text-[11px]">{formatTimestamp(order.readyAt)}</span>
                  </div>
                )}

                {order.outForDeliveryAt && (
                  <div className="rounded-lg bg-muted/40 p-2 border">
                    <span className="text-muted-foreground block mb-0.5">{t("detailsModal.outForDeliveryAt")}</span>
                    <span className="font-medium font-mono text-[11px]">{formatTimestamp(order.outForDeliveryAt)}</span>
                  </div>
                )}

                {order.deliveredAt && (
                  <div className="rounded-lg bg-green-500/10 border-green-500/30 p-2 border text-green-700 dark:text-green-300">
                    <span className="block mb-0.5 font-semibold">{t("detailsModal.deliveredAt")}</span>
                    <span className="font-medium font-mono text-[11px]">{formatTimestamp(order.deliveredAt)}</span>
                  </div>
                )}

                {order.cancelledAt && (
                  <div className="rounded-lg bg-destructive/10 border-destructive/30 p-2 border text-destructive col-span-2">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-semibold">{t("detailsModal.cancelledAt")}</span>
                      <span className="font-mono text-[11px]">{formatTimestamp(order.cancelledAt)}</span>
                    </div>
                    {order.cancelReason && (
                      <div className="text-xs pt-1">
                        <span className="font-medium">{t("detailsModal.cancelReason")}: </span>
                        <span>{t(`cancelReasons.${order.cancelReason}`)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Package className="size-4 text-primary" />
                <span>{t("detailsModal.items")} ({order.items.length})</span>
              </div>

              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="font-bold">{t("detailsModal.item")}</TableHead>
                      <TableHead className="text-center font-bold">{t("detailsModal.qty")}</TableHead>
                      <TableHead className="text-end font-bold">{t("detailsModal.price")}</TableHead>
                      <TableHead className="text-end font-bold">{t("detailsModal.total")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => {
                      const uPrice = Number(item.unitPrice);
                      const lTotal = Number(item.totalPrice);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.product.name}
                            {item.product.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1">
                                {item.product.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-semibold font-mono">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-end font-mono text-xs">
                            {uPrice.toFixed(2)} {t("currency")}
                          </TableCell>
                          <TableCell className="text-end font-mono font-semibold">
                            {lTotal.toFixed(2)} {t("currency")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Financial Breakdown & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Notes */}
              <div className="space-y-3">
                {order.notes && (
                  <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      {t("detailsModal.notes")}
                    </span>
                    <p className="text-sm leading-relaxed">{order.notes}</p>
                  </div>
                )}
                {order.customer.notes && (
                  <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      {t("detailsModal.customerNotes")}
                    </span>
                    <p className="text-sm leading-relaxed">{order.customer.notes}</p>
                  </div>
                )}
              </div>

              {/* Financial Box */}
              <div className="rounded-xl border bg-card p-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("detailsModal.subtotal")}</span>
                  <span className="font-mono">{subtotal.toFixed(2)} {t("currency")}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                    <div className="flex items-center gap-1.5">
                      <span>{t("detailsModal.discount")}</span>
                      <Badge variant="outline" className="text-[10px] py-0 h-4 border-amber-500/30">
                        {t(`discountStatuses.${order.discountStatus}`)}
                      </Badge>
                    </div>
                    <span className="font-mono font-semibold">
                      -{discount.toFixed(2)} {t("currency")}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-muted-foreground">
                  <span>{t("detailsModal.deliveryFee")}</span>
                  <span className="font-mono">{deliveryFee.toFixed(2)} {t("currency")}</span>
                </div>

                <div className="border-t pt-2.5 flex justify-between items-baseline font-bold text-base text-foreground">
                  <span>{t("detailsModal.grandTotal")}</span>
                  <span className="font-mono text-lg text-primary">
                    {total.toFixed(2)} {t("currency")}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {t("detailsModal.close")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Driver Assignment Dialog */}
      <AssignDriverDialog
        order={
          order
            ? {
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                driver: order.driver,
              }
            : null
        }
        open={assignDriverModalOpen}
        onOpenChange={setAssignDriverModalOpen}
        onSuccess={() => {
          if (orderId) fetchOrder(orderId);
        }}
      />
    </Dialog>
  );
}
