"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, PowerOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryDialog, ProductDialog } from "./menu-dialogs";

export interface Brand {
  id: string;
  name: string;
}
export interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: string; // Decimal بيتسلسل كنص في JSON
  isActive: boolean;
}
export interface CategoryRow {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  products: ProductRow[];
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.code ?? "NETWORK");
  return body as T;
}

export function MenuClient({ brands: initialBrands, canEdit }: { brands: Brand[]; canEdit: boolean }) {
  const t = useTranslations("menu");
  const tCommon = useTranslations("common");
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [brandId, setBrandId] = useState(initialBrands[0]?.id ?? "");
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [categoryDialog, setCategoryDialog] = useState<
    { mode: "create" } | { mode: "edit"; category: CategoryRow } | null
  >(null);
  const [productDialog, setProductDialog] = useState<
    { mode: "create"; categoryId: string } | { mode: "edit"; product: ProductRow; categoryId: string } | null
  >(null);

  const fetchCategories = useCallback(async () => {
    return api<{ categories: CategoryRow[] }>(`/api/menu/categories?brandId=${brandId}`);
  }, [brandId]);

  // تحديث بعد العمليات (event handlers — مسموح)
  const refresh = useCallback(async () => {
    try {
      const data = await fetchCategories();
      setCategories(data.categories);
    } catch {
      toast.error(t("error"));
    } finally {
      setLoaded(true);
    }
  }, [fetchCategories, t]);

  // التحميل الأولي عند تغيير البراند — setState داخل callbacks (قاعدة react-hooks v6)
  useEffect(() => {
    if (!brandId) return;
    let active = true;
    fetchCategories()
      .then((data) => {
        if (active) setCategories(data.categories);
      })
      .catch(() => {
        if (active) toast.error(t("error"));
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [fetchCategories, brandId, t]);

  async function toggleCategory(cat: CategoryRow, isActive: boolean) {
    try {
      await api(`/api/menu/categories/${cat.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      toast.success(t("saved"));
      void refresh();
    } catch {
      toast.error(t("error"));
    }
  }

  async function toggleProduct(product: ProductRow, isActive: boolean) {
    try {
      await api(`/api/menu/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      toast.success(t("saved"));
      void refresh();
    } catch {
      toast.error(t("error"));
    }
  }

  async function moveCategory(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= categories.length) return;
    const ordered = [...categories];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    setCategories(ordered); // optimistic
    try {
      await api("/api/menu/categories/reorder", {
        method: "POST",
        body: JSON.stringify({ brandId, orderedIds: ordered.map((c) => c.id) }),
      });
      toast.success(t("saved"));
    } catch {
      toast.error(t("error"));
      void refresh();
    }
  }

  async function addBrand() {
    const name = newBrandName.trim();
    if (!name) return;
    try {
      await api("/api/menu/brands", { method: "POST", body: JSON.stringify({ name }) });
      const data = await api<{ brands: Brand[] }>("/api/menu/brands");
      setBrands(data.brands);
      const created = data.brands.find((b) => b.name === name);
      if (created) setBrandId(created.id);
      setNewBrandName("");
      setShowAddBrand(false);
      toast.success(t("saved"));
    } catch {
      toast.error(t("error"));
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("title")}</h1>
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger className="w-48 h-10" aria-label={t("brand")}>
              <SelectValue placeholder={t("brand")} />
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canEdit && (
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-lg"
              onClick={() => setShowAddBrand((v) => !v)}
              data-testid="add-brand-btn"
            >
              <Plus className="size-4" />
            </Button>
          )}
        </div>
        {canEdit && (
          <Button
            className="h-10 px-4 font-semibold text-sm shadow-xs"
            onClick={() => setCategoryDialog({ mode: "create" })}
            disabled={!brandId}
          >
            <Plus className="size-4 me-1.5" /> {t("addCategory")}
          </Button>
        )}
      </div>

      {showAddBrand && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border p-3">
<Input
                value={newBrandName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBrandName(e.target.value)}
                placeholder={t("brand")}
                className="max-w-xs"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && void addBrand()}
                autoFocus
              />
          <Button size="sm" onClick={() => void addBrand()} disabled={!newBrandName.trim()}>
            {tCommon("save")}
          </Button>
        </div>
      )}
      {!loaded ? (
        <p className="text-center text-muted-foreground">…</p>
      ) : categories.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-4">
          {categories.map((cat, index) => (
            <Card key={cat.id} className={cat.isActive ? "" : "opacity-60"}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {cat.name}
                  {!cat.isActive && (
                    <Badge variant="secondary">
                      <PowerOff className="size-3" /> {t("inactive")}
                    </Badge>
                  )}
                </CardTitle>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("moveUp")}
                      disabled={index === 0}
                      onClick={() => moveCategory(index, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("moveDown")}
                      disabled={index === categories.length - 1}
                      onClick={() => moveCategory(index, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("editCategory")}
                      onClick={() => setCategoryDialog({ mode: "edit", category: cat })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Switch
                      checked={cat.isActive}
                      onCheckedChange={(v) => toggleCategory(cat, v)}
                      aria-label={cat.name}
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                {cat.products.length === 0 ? (
                  <p className="py-3 text-sm text-muted-foreground">{t("noProducts")}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/3">{t("productName")}</TableHead>
                        <TableHead className="w-24">{t("price")}</TableHead>
                        <TableHead>{t("description")}</TableHead>
                        <TableHead className="w-28 text-left">
                          {canEdit ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setProductDialog({ mode: "create", categoryId: cat.id })
                              }
                            >
                              <Plus className="size-4" /> {t("addProduct")}
                            </Button>
                          ) : null}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cat.products.map((p) => (
                        <TableRow key={p.id} className={p.isActive ? "" : "opacity-50"}>
                          <TableCell className="font-medium">
                            {p.name}
                            {!p.isActive && (
                              <Badge variant="secondary" className="ms-2">
                                {t("inactive")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell dir="ltr" className="tabular-nums">
                            {Number(p.price).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {p.description ?? "—"}
                          </TableCell>
                          <TableCell className="text-left">
                            <div className="flex items-center justify-end gap-2">
                              <Switch
                                checked={p.isActive}
                                onCheckedChange={(v) => toggleProduct(p, v)}
                                disabled={!canEdit}
                                aria-label={p.name}
                              />
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={t("editProduct")}
                                  onClick={() =>
                                    setProductDialog({
                                      mode: "edit",
                                      product: p,
                                      categoryId: cat.id,
                                    })
                                  }
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CategoryDialog
        state={categoryDialog}
        brandId={brandId}
        onClose={() => setCategoryDialog(null)}
        onSaved={() => {
          setCategoryDialog(null);
        }}
      />
      <ProductDialog
        state={productDialog}
        categories={categories}
        onClose={() => setProductDialog(null)}
        onSaved={() => {
          setProductDialog(null);
        }}
      />
    </div>
  );
}
