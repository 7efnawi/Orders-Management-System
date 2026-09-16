"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CancelReason } from "@/types/enums";

interface CancelDialogProps {
  orderId: string | null;
  orderNumber?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CANCEL_REASONS: CancelReason[] = [
  CancelReason.CUSTOMER_CHANGED_MIND,
  CancelReason.DELIVERY_ISSUE,
  CancelReason.QUALITY_ISSUE,
  CancelReason.NO_ANSWER,
  CancelReason.ITEM_UNAVAILABLE,
  CancelReason.OTHER,
];

export function CancelDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
  onSuccess,
}: CancelDialogProps) {
  const t = useTranslations("orders");
  const [reason, setReason] = useState<CancelReason | "">("");
  const [loading, setLoading] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!loading) {
      if (!nextOpen) setReason("");
      onOpenChange(nextOpen);
    }
  };

  const handleConfirm = async () => {
    if (!orderId || !reason) {
      toast.error(t("cancelDialog.selectReason"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          cancelReason: reason,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || t("cancelDialog.error"));
      }

      toast.success(t("cancelDialog.success"));
      setReason("");
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("cancelDialog.error");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5 shrink-0" />
            <DialogTitle>
              {t("cancelDialog.title", { orderNumber: orderNumber ? `#${orderNumber}` : "" })}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm leading-relaxed text-muted-foreground">
            {t("cancelDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3">
          <Label htmlFor="cancel-reason-select" className="text-sm font-semibold">
            {t("cancelDialog.reasonLabel")}{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Select
            value={reason}
            onValueChange={(val) => setReason(val as CancelReason)}
            disabled={loading}
          >
            <SelectTrigger id="cancel-reason-select" className="w-full">
              <SelectValue placeholder={t("cancelDialog.selectReason")} />
            </SelectTrigger>
            <SelectContent>
              {CANCEL_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {t(`cancelReasons.${r}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            {t("cancelDialog.back")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason || loading}
          >
            {loading && <Loader2 className="me-2 size-4 animate-spin" />}
            {loading ? t("cancelDialog.cancelling") : t("cancelDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
