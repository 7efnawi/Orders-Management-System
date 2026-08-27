"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LockOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export interface ReopenShiftDialogProps {
  shiftId: string | null;
  cashierName?: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReopenShiftDialog({
  shiftId,
  cashierName,
  open,
  onClose,
  onSuccess,
}: ReopenShiftDialogProps) {
  const t = useTranslations("closing");
  const tCommon = useTranslations("common");

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReopen = async () => {
    if (!shiftId) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/shifts/${shiftId}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to reopen shift");
      }

      toast.success(
        t("reopenSuccess") || "تمت إعادة فتح الشيفت بنجاح واستئناف تسجيل الأوردرات"
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error reopening shift";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <LockOpen className="size-5" />
            <span>{t("reopenShiftTitle") || "إعادة فتح الشيفت"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs pt-1">
            {t("reopenShiftDesc") ||
              "سيتم إلغاء التقفيل السابق وإعادة الشيفت لحالة (مفتوح) لتمكين الكاشير أو المدير من تعديل وإضافة الطلبات والمصروفات."}
          </DialogDescription>
        </DialogHeader>

        {cashierName && (
          <div className="rounded-lg border bg-muted/50 p-3 text-xs">
            <span className="text-muted-foreground block mb-0.5">
              {t("cashier") || "الكاشير المسئول"}:
            </span>
            <span className="font-semibold text-foreground">{cashierName}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            {t("reopenReasonLabel") || "سبب إعادة الفتح (اختياري)"}
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              t("reopenReasonPlaceholder") || "مثال: مراجعة عجز خزينة، تسجيل طلب متأخر..."
            }
            className="min-h-[80px] text-xs resize-none"
            disabled={loading}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="text-xs"
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleReopen}
            disabled={loading}
            className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <LockOpen className="size-3.5" />
            )}
            <span>{t("confirmReopen") || "تأكيد إعادة الفتح"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
