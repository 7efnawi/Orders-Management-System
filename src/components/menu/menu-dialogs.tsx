"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryRow, ProductRow } from "./menu-client";

async function submit(url: string, method: string, body: unknown): Promise<string | null> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { code?: string };
  return data.code ?? "NETWORK";
}

export function CategoryDialog({
  state,
  brandId,
  onClose,
  onSaved,
}: {
  state: { mode: "create" } | { mode: "edit"; category: CategoryRow } | null;
  brandId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("menu");
  const editing = state?.mode === "edit" ? state.category : null;

  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? t("editCategory") : t("addCategory")}</DialogTitle>
        </DialogHeader>
        <CategoryForm
          key={editing?.id ?? "create"}
          initialName={editing?.name ?? ""}
          brandId={brandId}
          categoryId={editing?.id}
          onClose={onClose}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({
  initialName,
  brandId,
  categoryId,
  onClose,
  onSaved,
}: {
  initialName: string;
  brandId: string;
  categoryId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("menu");
  const tCommon = useTranslations("common");
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const err = categoryId
        ? await submit(`/api/menu/categories/${categoryId}`, "PATCH", { name: trimmed })
        : await submit("/api/menu/categories", "POST", { name: trimmed, brandId });
      if (err) {
        toast.error(t("error"));
      } else {
        toast.success(t("saved"));
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="cat-name">{t("categoryName")}</Label>
        <Input
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {tCommon("cancel")}
        </Button>
        <Button onClick={onSave} disabled={saving || !name.trim()}>
          {tCommon("save")}
        </Button>
      </DialogFooter>
    </>
  );
}

const productSchema = z.object({
  name: z.string().trim().min(1),
  price: z.coerce.number().positive(),
  description: z.string().trim().max(500),
  categoryId: z.string().uuid(),
});

export function ProductDialog({
  state,
  categories,
  onClose,
  onSaved,
}: {
  state:
    | { mode: "create"; categoryId: string }
    | { mode: "edit"; product: ProductRow; categoryId: string }
    | null;
  categories: CategoryRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("menu");
  const editing = state?.mode === "edit" ? state.product : null;
  const defaultCategoryId =
    state?.mode === "create" ? state.categoryId : state?.mode === "edit" ? state.categoryId : "";

  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("editProduct") : t("addProduct")}</DialogTitle>
        </DialogHeader>
        <ProductForm
          key={editing?.id ?? `create-${defaultCategoryId}`}
          categories={categories.filter((c) => c.isActive)}
          initial={{
            name: editing?.name ?? "",
            price: editing ? String(Number(editing.price)) : "",
            description: editing?.description ?? "",
            categoryId: defaultCategoryId,
          }}
          productId={editing?.id}
          onClose={onClose}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

function ProductForm({
  categories,
  initial,
  productId,
  onClose,
  onSaved,
}: {
  categories: CategoryRow[];
  initial: { name: string; price: string; description: string; categoryId: string };
  productId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("menu");
  const tCommon = useTranslations("common");
  const [name, setName] = useState(initial.name);
  const [price, setPrice] = useState(initial.price);
  const [description, setDescription] = useState(initial.description);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    const parsed = productSchema.safeParse({ name, price, description, categoryId });
    if (!parsed.success) {
      setError("VALIDATION_ERROR");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: parsed.data.name,
        price: parsed.data.price,
        description: parsed.data.description || null,
        categoryId: parsed.data.categoryId,
      };
      const err = productId
        ? await submit(`/api/menu/products/${productId}`, "PATCH", body)
        : await submit("/api/menu/products", "POST", body);
      if (err) {
        toast.error(t("error"));
      } else {
        toast.success(t("saved"));
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="p-name">{t("productName")}</Label>
          <Input
            id="p-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={error === "VALIDATION_ERROR"}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="p-price">{t("price")}</Label>
            <Input
              id="p-price"
              type="number"
              min="0"
              step="0.5"
              dir="ltr"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-invalid={error === "VALIDATION_ERROR"}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-cat">{t("category")}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="p-cat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-desc">{t("description")}</Label>
          <Textarea
            id="p-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {t("error")}
          </p>
        ) : null}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {tCommon("cancel")}
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {tCommon("save")}
        </Button>
      </DialogFooter>
    </>
  );
}
