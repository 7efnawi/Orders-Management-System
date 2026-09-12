"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { FileText, Save, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CustomerNotesEditorProps {
  customerId: string;
  initialNotes: string | null;
  onNotesSaved?: (newNotes: string) => void;
}

export function CustomerNotesEditor({
  customerId,
  initialNotes,
  onNotesSaved,
}: CustomerNotesEditorProps) {
  const t = useTranslations("customers.profile");

  const [notes, setNotes] = React.useState<string>(initialNotes ?? "");
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [status, setStatus] = React.useState<"idle" | "saved" | "error">("idle");
  const [hasChanged, setHasChanged] = React.useState<boolean>(false);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setNotes(e.target.value);
    setHasChanged(e.target.value !== (initialNotes ?? ""));
    if (status !== "idle") setStatus("idle");
  }

  async function handleSave() {
    setIsSaving(true);
    setStatus("idle");
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) {
        throw new Error("Failed to save notes");
      }

      setStatus("saved");
      setHasChanged(false);
      onNotesSaved?.(notes);
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("Error saving customer notes:", err);
      setStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border/70 p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">{t("notesTitle")}</h3>
        </div>

        {status === "saved" && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
            <Check className="w-3.5 h-3.5" />
            <span>{t("notesSaved")}</span>
          </span>
        )}

        {status === "error" && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{t("notesError")}</span>
          </span>
        )}
      </div>

      <Textarea
        value={notes}
        onChange={handleChange}
        placeholder={t("notesPlaceholder")}
        rows={4}
        className="text-sm resize-y min-h-[90px] bg-background/60 focus-visible:bg-background"
      />

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !hasChanged}
          className="gap-1.5 text-xs h-8 px-3"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{t("savingNotes")}</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>{t("saveNotes")}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
