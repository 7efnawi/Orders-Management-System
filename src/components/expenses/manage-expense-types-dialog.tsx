"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Check,
  Edit2,
  FolderCog,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface ExpenseTypeItem {
  id: string;
  name: string;
  isDefault: boolean;
  createdBy?: string | null;
}

export interface ManageExpenseTypesDialogProps {
  types: ExpenseTypeItem[];
  open: boolean;
  onClose: () => void;
  onTypesUpdated: () => void;
}

export function ManageExpenseTypesDialog({
  types,
  open,
  onClose,
  onTypesUpdated,
}: ManageExpenseTypesDialogProps) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");

  const [newTypeName, setNewTypeName] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add new type
  const handleAdd = async () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    setAdding(true);

    try {
      const res = await fetch("/api/expenses/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add expense type");
      }

      toast.success(t("categoryAddedSuccess") || "تمت إضافة نوع المصروف بنجاح");
      setNewTypeName("");
      onTypesUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error adding type";
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  // Rename type
  const handleSaveRename = async (typeId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    setSavingId(typeId);

    try {
      const res = await fetch(`/api/expenses/types/${typeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to rename expense type");
      }

      toast.success(t("categoryUpdatedSuccess") || "تم تعديل نوع المصروف بنجاح");
      setEditingId(null);
      onTypesUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error renaming type";
      toast.error(msg);
    } finally {
      setSavingId(null);
    }
  };

  // Delete type
  const handleDelete = async (typeId: string) => {
    setDeletingId(typeId);

    try {
      const res = await fetch(`/api/expenses/types/${typeId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete expense type");
      }

      toast.success(t("categoryDeletedSuccess") || "تم حذف نوع المصروف بنجاح");
      onTypesUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting type";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FolderCog className="size-5 text-primary" />
            <span>{t("manageCategoriesTitle") || "إدارة أنواع وتصنيفات المصاريف"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t("manageCategoriesDesc") ||
              "يمكن للمدير والمالك إضافة أنواع مصاريف جديدة، إعادة تسميتها، أو حذفها."}
          </DialogDescription>
        </DialogHeader>

        {/* Quick Add Bar */}
        <div className="flex items-center gap-2 pt-3">
          <Input
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            placeholder={t("newCategoryPlaceholder") || "أدخل اسم نوع المصروف الجديد..."}
            className="text-xs h-9"
            disabled={adding}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAdd}
            disabled={adding || !newTypeName.trim()}
            className="h-9 gap-1 text-xs shrink-0"
          >
            {adding ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            <span>{t("addCategory") || "إضافة نوع"}</span>
          </Button>
        </div>

        {/* Scrollable Types List */}
        <div className="flex-1 overflow-y-auto divide-y rounded-md border mt-3 max-h-[380px]">
          {types.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              {t("noCategories") || "لا توجد أنواع مصاريف مسجلة"}
            </div>
          ) : (
            types.map((item) => {
              const isEditing = editingId === item.id;
              const isSaving = savingId === item.id;
              const isDeleting = deletingId === item.id;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 hover:bg-muted/40 transition-colors gap-2"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="text-xs h-8 flex-1"
                        autoFocus
                        disabled={isSaving}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveRename(item.id);
                          } else if (e.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="default"
                        size="icon"
                        onClick={() => handleSaveRename(item.id)}
                        disabled={isSaving || !editingName.trim()}
                        className="size-8 text-xs shrink-0"
                      >
                        {isSaving ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingId(null)}
                        disabled={isSaving}
                        className="size-8 text-xs shrink-0"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-foreground truncate">
                          {item.name}
                        </span>
                        {item.isDefault && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-normal bg-muted text-muted-foreground shrink-0"
                          >
                            {t("defaultTypeBadge") || "افتراضي"}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditingName(item.name);
                          }}
                          className="size-7 text-muted-foreground hover:text-foreground"
                          title={t("rename") || "تعديل الاسم"}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting}
                          className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title={t("deleteCategory") || "حذف"}
                        >
                          {isDeleting ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            {tCommon("close") || "إغلاق"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
