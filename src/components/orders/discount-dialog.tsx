"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Loader2, Percent, User, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface PendingDiscountOrder {
  id: string;
  orderNumber: string;
  discount: number | string;
  discountReason?: string | null;
  cashier?: { name: string | null; email: string } | null;
  requester?: { name: string | null; email: string } | null;
}

interface DiscountDialogProps {
  order: PendingDiscountOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DiscountDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: DiscountDialogProps) {
  const t = useTranslations("orders");
  const [loadingDecision, setLoadingDecision] = useState<"APPROVED" | "REJECTED" | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!loadingDecision) {
      onOpenChange(nextOpen);
    }
  };

  const handleDecide = async (decision: "APPROVED" | "REJECTED") => {
    if (!order) return;

    setLoadingDecision(decision);
    try {
      const res = await fetch(`/api/orders/${order.id}/discount/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || t("discountDialog.error"));
      }

      if (decision === "APPROVED") {
        toast.success(t("discountDialog.successApprove"));
      } else {
        toast.info(t("discountDialog.successReject"));
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("discountDialog.error");
      toast.error(msg);
    } finally {
      setLoadingDecision(null);
    }
  };

  if (!order) return null;

  const requesterName =
    order.requester?.name ||
    order.cashier?.name ||
    order.requester?.email ||
    order.cashier?.email ||
    t("table.customer");

  const discountAmount = Number(order.discount) || 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Percent className="size-5 shrink-0" />
            <DialogTitle>
              {t("discountDialog.title")} (#{order.orderNumber})
            </DialogTitle>
          </div>
          <DialogDescription className="pt-1 text-sm text-muted-foreground">
            {t("discountDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Discount details card */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("discountDialog.requestedAmount")}
              </span>
              <Badge variant="secondary" className="px-3 py-1 text-base font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20">
                {discountAmount.toFixed(2)} {t("currency")}
              </Badge>
            </div>

            <div className="flex items-center justify-between border-t pt-2.5">
              <span className="text-sm text-muted-foreground">
                {t("discountDialog.requester")}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <User className="size-3.5 text-muted-foreground" />
                {requesterName}
              </span>
            </div>

            <div className="border-t pt-2.5 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                {t("discountDialog.reason")}
              </span>
              <p className="rounded-lg bg-background p-2.5 text-sm leading-relaxed border">
                {order.discountReason || (
                  <span className="italic text-muted-foreground">
                    {t("discountDialog.noReason")}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() => handleDecide("REJECTED")}
            disabled={loadingDecision !== null}
            className="flex-1"
          >
            {loadingDecision === "REJECTED" ? (
              <Loader2 className="me-2 size-4 animate-spin" />
            ) : (
              <X className="me-2 size-4" />
            )}
            {t("discountDialog.reject")}
          </Button>

          <Button
            type="button"
            variant="default"
            onClick={() => handleDecide("APPROVED")}
            disabled={loadingDecision !== null}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loadingDecision === "APPROVED" ? (
              <Loader2 className="me-2 size-4 animate-spin" />
            ) : (
              <Check className="me-2 size-4" />
            )}
            {t("discountDialog.approve")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
