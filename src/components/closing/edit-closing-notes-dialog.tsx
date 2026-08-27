"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Edit, FileText, Loader2 } from "lucide-react";
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

export interface EditClosingNotesDialogProps {
  closingId: string | null;
  initialNotes?: string | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (newNotes: string) => void;
}

export function EditClosingNotesDialog({
  closingId,
  initialNotes,
  open,
  onClose,
  onSuccess,
}: EditClosingNotesDialogProps) {
  const t = useTranslations("closing");
  const tCommon = useTranslations("common");

  const [notes, setNotes] = useState(initialNotes || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!closingId) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/closing/${closingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() || null }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update closing notes");
      }

      toast.success(
        t("notesUpdatedSuccess") || "تم تعديل ملاحظات الإغلاق بنجاح"
      );
      onSuccess(notes.trim());
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating notes";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileText className="size-5 text-primary" />
            <span>{t("editNotesTitle") || "تعديل ملاحظات الإغلاق"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs pt-1">
            {t("editNotesDesc") ||
              "يمكن للمدير أو الأونر تدوين أي ملاحظات تسوية أو عجز خزانة في سجل الإغلاق."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              t("notesPlaceholder") || "أدخل ملاحظات التسوية الخاصة بهذا الشيفت..."
            }
            className="min-h-[100px] text-xs resize-none"
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
            onClick={handleSave}
            disabled={loading}
            className="text-xs gap-1.5"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Edit className="size-3.5" />
            )}
            <span>{tCommon("save") || "حفظ التعديلات"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
