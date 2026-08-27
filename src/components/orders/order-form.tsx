"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Globe,
  Minus,
  Percent,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { getBrandToken } from "@/lib/visualTokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentMethod, Role } from "@prisma/client";
import { cn } from "@/lib/utils";

export interface BrandOption {
  id: string;
  name: string;
}

export interface PlatformOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface DeliveryZoneOption {
  id: string;
  name: string;
  fee: number;
  isActive: boolean;
}

export interface DeliveryDriverOption {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  isActive: boolean;
}

export interface CategoryGroup {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  products: ProductItem[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CustomerSearchResult {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  totalOrders: number;
}

interface OrderFormProps {
  userRole: Role;
  initialBrands: BrandOption[];
  initialPlatforms: PlatformOption[];
  initialZones: DeliveryZoneOption[];
  initialDrivers: DeliveryDriverOption[];
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = body?.message || body?.code || "An unexpected error occurred";
    throw new Error(errorMsg);
  }
  return body as T;
}

export function OrderForm({
  userRole,
  initialBrands,
  initialPlatforms,
  initialZones,
  initialDrivers,
}: OrderFormProps) {
  const t = useTranslations("orders");
  const router = useRouter();

  // ────────────────────────── State ──────────────────────────
  const [brands] = useState<BrandOption[]>(initialBrands);
  const [selectedBrandId, setSelectedBrandId] = useState<string>(
    initialBrands[0]?.id ?? ""
  );

  const [platforms] = useState<PlatformOption[]>(initialPlatforms);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>(
    initialPlatforms[0]?.id ?? ""
  );
  const [externalId, setExternalId] = useState<string>("");

  // Customer State
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [customerNotes, setCustomerNotes] = useState<string>("");
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerSearchResult[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState<boolean>(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);
  const [selectedCustomerMeta, setSelectedCustomerMeta] = useState<CustomerSearchResult | null>(null);

  // Menu Categories & Products
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Delivery & Payment Settings
  const [zones] = useState<DeliveryZoneOption[]>(initialZones);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [drivers] = useState<DeliveryDriverOption[]>(initialDrivers);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [discountAmount, setDiscountAmount] = useState<string>("");
  const [discountReason, setDiscountReason] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState<string>("");

  // UI status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdOrderResult, setCreatedOrderResult] = useState<{
    id: string;
    orderNumber: string;
    total: number;
  } | null>(null);

  const customerSearchRef = useRef<HTMLDivElement>(null);

  // ────────────────────────── Fetch Menu Tree ──────────────────────────
  const fetchMenu = useCallback((brandId: string) => {
    return api<{ categories: CategoryGroup[] }>(
      `/api/menu/categories?brandId=${brandId}`
    );
  }, []);

  useEffect(() => {
    if (!selectedBrandId) return;
    let active = true;
    fetchMenu(selectedBrandId)
      .then((data) => {
        if (active) setCategories(data.categories || []);
      })
      .catch(() => {
        if (active) toast.error(t("noProductsInBrand"));
      })
      .finally(() => {
        if (active) setIsLoadingMenu(false);
      });

    return () => {
      active = false;
    };
  }, [selectedBrandId, fetchMenu, t]);

  // ────────────────────────── Customer Search Debounce ──────────────────────────
  useEffect(() => {
    const cleanPhone = customerPhone.trim();
    if (cleanPhone.length < 3) {
      return;
    }

    let active = true;
    const timer = setTimeout(() => {
      setIsSearchingCustomer(true);
      api<CustomerSearchResult[]>(
        `/api/customers/search?q=${encodeURIComponent(cleanPhone)}`
      )
        .then((results) => {
          if (active) {
            setCustomerSuggestions(results || []);
            setShowCustomerDropdown(Boolean(results && results.length > 0));
          }
        })
        .catch(() => {
          if (active) setCustomerSuggestions([]);
        })
        .finally(() => {
          if (active) setIsSearchingCustomer(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [customerPhone]);

  // Close customer dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        customerSearchRef.current &&
        !customerSearchRef.current.contains(event.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCustomer = (c: CustomerSearchResult) => {
    setCustomerPhone(c.phone);
    setCustomerName(c.name);
    if (c.address) setCustomerAddress(c.address);
    setSelectedCustomerMeta(c);
    setShowCustomerDropdown(false);
  };

  // ────────────────────────── Cart Management ──────────────────────────
  const handleAddToCart = (product: ProductItem) => {
    const unitPrice = typeof product.price === "string" ? parseFloat(product.price) : product.price;
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: unitPrice,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // ────────────────────────── Financial Calculations ──────────────────────────
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const rawDeliveryFee = useMemo(() => {
    if (!selectedZoneId) return 0;
    const zone = zones.find((z) => z.id === selectedZoneId);
    return zone ? zone.fee : 0;
  }, [selectedZoneId, zones]);

  const selectedDriver = useMemo(() => {
    if (!selectedDriverId) return null;
    return drivers.find((d) => d.id === selectedDriverId) || null;
  }, [selectedDriverId, drivers]);

  const netDeliveryFee = useMemo(() => {
    if (selectedDriver?.type === "APP" || selectedDriver?.type === "PICKUP") {
      return 0;
    }
    return rawDeliveryFee;
  }, [selectedDriver, rawDeliveryFee]);

  const numericDiscount = useMemo(() => {
    const val = parseFloat(discountAmount);
    return Number.isFinite(val) && val > 0 ? val : 0;
  }, [discountAmount]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - numericDiscount + netDeliveryFee);
  }, [subtotal, numericDiscount, netDeliveryFee]);

  // ────────────────────────── Product Filtering ──────────────────────────
  const displayedProducts = useMemo(() => {
    let list: ProductItem[] = [];
    if (selectedCategoryId === "ALL") {
      list = categories.flatMap((c) => (c.isActive ? c.products.filter((p) => p.isActive) : []));
    } else {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      list = cat && cat.isActive ? cat.products.filter((p) => p.isActive) : [];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [categories, selectedCategoryId, searchQuery]);

  // ────────────────────────── Reset Form ──────────────────────────
  const handleResetForm = () => {
    setCart([]);
    setCustomerPhone("");
    setCustomerName("");
    setCustomerAddress("");
    setCustomerNotes("");
    setSelectedCustomerMeta(null);
    setExternalId("");
    setDiscountAmount("");
    setDiscountReason("");
    setOrderNotes("");
    setSelectedZoneId("");
    setSelectedDriverId("");
    setPaymentMethod(PaymentMethod.CASH);
    setCreatedOrderResult(null);
  };

  // ────────────────────────── Submit Order ──────────────────────────
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBrandId) {
      toast.error(t("validation.selectBrand"));
      return;
    }
    if (!selectedPlatformId) {
      toast.error(t("validation.selectPlatform"));
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 5) {
      toast.error(t("validation.enterCustomerPhone"));
      return;
    }
    if (!customerName.trim()) {
      toast.error(t("validation.enterCustomerName"));
      return;
    }
    if (cart.length === 0) {
      toast.error(t("validation.addItems"));
      return;
    }
    if (numericDiscount > 0 && !discountReason.trim()) {
      toast.error(t("validation.discountReasonRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        platformId: selectedPlatformId,
        brandId: selectedBrandId,
        externalId: externalId.trim() || null,
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          address: customerAddress.trim() || null,
          notes: customerNotes.trim() || null,
        },
        zoneId: selectedZoneId || null,
        driverId: selectedDriverId || null,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod,
        discount: numericDiscount > 0 ? numericDiscount : undefined,
        discountReason: numericDiscount > 0 ? discountReason.trim() : null,
        notes: orderNotes.trim() || null,
      };

      const result = await api<{ id: string; orderNumber: string }>(
        "/api/orders",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      toast.success(
        t("successMessage", { orderNumber: result.orderNumber })
      );

      setCreatedOrderResult({
        id: result.id,
        orderNumber: result.orderNumber,
        total: grandTotal,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t("errorCreating");
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-3 md:p-6">
      {/* ────────────────────────── Top Bar: Brand & Platform Selection ────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground me-2">
            {t("brand")}:
          </span>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => {
              const isSelected = b.id === selectedBrandId;
              const token = getBrandToken(b.name);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    if (b.id !== selectedBrandId) {
                      setIsLoadingMenu(true);
                      setSelectedBrandId(b.id);
                      setSelectedCategoryId("ALL");
                    }
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold border transition-all cursor-pointer min-h-11",
                    isSelected
                      ? cn(
                          token.bgClass,
                          token.textClass,
                          token.borderClass,
                          "ring-2",
                          token.ringClass,
                          "shadow-xs"
                        )
                      : "bg-background hover:bg-muted text-muted-foreground border-border"
                  )}
                >
                  <span className="font-bold font-mono text-sm opacity-90 leading-none">
                    {token.kanji}
                  </span>
                  <span>{b.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Platform Pills / Select */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              {t("platform")}:
            </span>
            <Select
              value={selectedPlatformId}
              onValueChange={setSelectedPlatformId}
            >
              <SelectTrigger className="w-44 h-11">
                <SelectValue placeholder={t("selectPlatform")}>
                  {(() => {
                    const activeP = platforms.find(
                      (p) => p.id === selectedPlatformId
                    );
                    return activeP ? (
                      <PlatformBadge
                        platformName={activeP.name}
                        size="sm"
                      />
                    ) : (
                      t("selectPlatform")
                    );
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <PlatformBadge platformName={p.name} size="sm" />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* External ID */}
          <div className="flex items-center gap-1.5">
            <Input
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder={t("externalIdPlaceholder")}
              className="h-9 w-40 text-xs"
            />
          </div>
        </div>
      </div>

      {/* ────────────────────────── Customer Fast Lookup Row ────────────────────────── */}
      <Card className="shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-start">
            {/* Phone with Auto-Lookup */}
            <div className="relative md:col-span-4" ref={customerSearchRef}>
              <Label className="text-xs font-semibold mb-1 block">
                {t("customerLookup")} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  dir="ltr"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    setSelectedCustomerMeta(null);
                  }}
                  placeholder={t("phonePlaceholder")}
                  className="h-10 text-sm font-mono ps-9"
                  autoComplete="off"
                />
                <div className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  {isSearchingCustomer ? (
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Search className="size-4" />
                  )}
                </div>
              </div>

              {/* Suggestions Dropdown */}
              {showCustomerDropdown && customerSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">
                  {customerSuggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="flex w-full flex-col gap-0.5 rounded-md p-2 text-start text-xs hover:bg-accent focus:bg-accent focus:outline-none transition-colors"
                      onClick={() => handleSelectCustomer(c)}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{c.name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5">
                          {c.totalOrders} {t("itemsCount", { count: c.totalOrders })}
                        </Badge>
                      </div>
                      <span className="font-mono text-muted-foreground" dir="ltr">
                        {c.phone}
                      </span>
                      {c.address && (
                        <span className="truncate text-muted-foreground">
                          {c.address}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Status Badge */}
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                {selectedCustomerMeta ? (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300 dark:text-emerald-400">
                    <User className="size-3 me-1" />
                    {t("returningCustomer", { count: selectedCustomerMeta.totalOrders })}
                  </Badge>
                ) : customerPhone.trim().length >= 5 ? (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400">
                    <Plus className="size-3 me-1" />
                    {t("newCustomer")}
                  </Badge>
                ) : null}
              </div>
            </div>

            {/* Customer Name */}
            <div className="md:col-span-3">
              <Label className="text-xs font-semibold mb-1 block">
                {t("customerName")} <span className="text-destructive">*</span>
              </Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t("customerNamePlaceholder")}
                className="h-10 text-sm"
              />
            </div>

            {/* Customer Address */}
            <div className="md:col-span-5">
              <Label className="text-xs font-semibold mb-1 block">
                {t("customerAddress")}
              </Label>
              <Input
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder={t("customerAddressPlaceholder")}
                className="h-10 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ────────────────────────── Main Layout: Menu (Left/Middle) + Cart (Right) ────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* ── Left/Middle: Menu & Products (7 cols) ── */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          {/* Categories & Search */}
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-xs">
            {/* Search Input */}
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchProducts")}
                className="h-10 ps-9 text-sm"
              />
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Categories Scrollable Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <Button
                type="button"
                size="sm"
                variant={selectedCategoryId === "ALL" ? "default" : "secondary"}
                className="h-8 text-xs shrink-0 rounded-full font-medium"
                onClick={() => setSelectedCategoryId("ALL")}
              >
                {t("allCategories")}
              </Button>
              {categories
                .filter((c) => c.isActive)
                .map((cat) => (
                  <Button
                    key={cat.id}
                    type="button"
                    size="sm"
                    variant={selectedCategoryId === cat.id ? "default" : "secondary"}
                    className="h-8 text-xs shrink-0 rounded-full font-medium"
                    onClick={() => setSelectedCategoryId(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
            </div>
          </div>

          {/* Product Grid */}
          {isLoadingMenu ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed text-muted-foreground">
              <span className="inline-block size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center text-muted-foreground">
              <ShoppingBag className="size-10 mb-2 opacity-40" />
              <p className="font-medium">{t("noProductsFound")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {displayedProducts.map((prod) => {
                const itemInCart = cart.find((item) => item.productId === prod.id);
                const priceNum = typeof prod.price === "string" ? parseFloat(prod.price) : prod.price;

                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleAddToCart(prod)}
                    className={cn(
                      "group relative flex flex-col justify-between rounded-xl border bg-card p-3 text-start transition-all hover:border-primary hover:shadow-md active:scale-[0.98] min-h-[110px]",
                      itemInCart && "border-primary/70 bg-primary/5 ring-1 ring-primary/40"
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold text-sm leading-tight text-foreground line-clamp-2">
                          {prod.name}
                        </span>
                        {itemInCart && (
                          <Badge className="h-5 px-1.5 text-[11px] font-bold shrink-0 bg-primary text-primary-foreground">
                            ×{itemInCart.quantity}
                          </Badge>
                        )}
                      </div>
                      {prod.description && (
                        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                          {prod.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="font-bold text-sm text-primary tabular-nums" dir="ltr">
                        {priceNum.toFixed(2)} {t("currency")}
                      </span>
                      <div className="size-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Plus className="size-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Cart & Summary (5 cols - Sticky) ── */}
        <div className="flex flex-col gap-4 lg:col-span-5 lg:sticky lg:top-4">
          <Card className="shadow-md border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3 pt-4 px-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <ShoppingBag className="size-5 text-primary" />
                {t("cart")}
                {cart.length > 0 && (
                  <Badge variant="secondary" className="ms-1 font-mono text-xs">
                    {cart.reduce((sum, i) => sum + i.quantity, 0)}
                  </Badge>
                )}
              </CardTitle>
              {cart.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCart}
                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5 me-1" />
                  {t("clearCart")}
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Items List */}
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <ShoppingBag className="size-10 mb-2 opacity-30" />
                  <p className="text-sm">{t("cartEmpty")}</p>
                </div>
              ) : (
                <div className="max-h-64 space-y-2.5 overflow-y-auto pe-1 scrollbar-thin">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between rounded-lg border bg-muted/30 p-2.5 text-sm gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs leading-snug truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground tabular-nums" dir="ltr">
                          {item.price.toFixed(2)} × {item.quantity} ={" "}
                          <span className="font-bold text-foreground">
                            {(item.price * item.quantity).toFixed(2)} {t("currency")}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => handleUpdateQuantity(item.productId, -1)}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-6 text-center font-bold text-xs tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => handleUpdateQuantity(item.productId, 1)}
                        >
                          <Plus className="size-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveItem(item.productId)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery Zone & Driver Selectors */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div>
                  <Label className="text-xs font-semibold mb-1 block">
                    {t("deliveryZone")}
                  </Label>
                  <Select
                    value={selectedZoneId || "NONE"}
                    onValueChange={(val) => setSelectedZoneId(val === "NONE" ? "" : val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={t("selectZone")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">{t("noZone")}</SelectItem>
                      {zones.map((z) => (
                        <SelectItem key={z.id} value={z.id}>
                          {z.name} ({z.fee.toFixed(0)} {t("currency")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-1 block">
                    {t("driver")}
                  </Label>
                  <Select
                    value={selectedDriverId || "NONE"}
                    onValueChange={(val) => setSelectedDriverId(val === "NONE" ? "" : val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={t("selectDriver")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">{t("noDriver")}</SelectItem>
                      {drivers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} ({d.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-semibold block">
                  {t("paymentMethod")}
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentMethod === PaymentMethod.CASH ? "default" : "outline"}
                    className="h-8 text-xs font-medium"
                    onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                  >
                    <Banknote className="size-3.5 me-1" />
                    {t("paymentMethods.CASH")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentMethod === PaymentMethod.VISA ? "default" : "outline"}
                    className="h-8 text-xs font-medium"
                    onClick={() => setPaymentMethod(PaymentMethod.VISA)}
                  >
                    <CreditCard className="size-3.5 me-1" />
                    {t("paymentMethods.VISA")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentMethod === PaymentMethod.ONLINE ? "default" : "outline"}
                    className="h-8 text-xs font-medium"
                    onClick={() => setPaymentMethod(PaymentMethod.ONLINE)}
                  >
                    <Globe className="size-3.5 me-1" />
                    {t("paymentMethods.ONLINE")}
                  </Button>
                </div>
              </div>

              {/* Discount Section */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-1/2">
                    <Label className="text-xs font-semibold mb-1 block">
                      {t("discount")}
                    </Label>
                    <div className="relative">
                      <Input
                        dir="ltr"
                        type="number"
                        min="0"
                        step="1"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                        placeholder="0"
                        className="h-8 text-xs font-mono ps-7"
                      />
                      <Percent className="absolute start-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  {numericDiscount > 0 && (
                    <div className="w-1/2">
                      <Label className="text-xs font-semibold mb-1 block text-destructive">
                        {t("discountReason")} *
                      </Label>
                      <Input
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        placeholder={t("discountReasonPlaceholder")}
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                  )}
                </div>

                {numericDiscount > 0 && (
                  <p className="text-[11px] text-muted-foreground italic">
                    {userRole === Role.OWNER || userRole === Role.MANAGER
                      ? t("discountApprovedNotice")
                      : t("discountPendingNotice")}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1 pt-1">
                <Label className="text-xs font-semibold block">
                  {t("orderNotes")}
                </Label>
                <Textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder={t("orderNotesPlaceholder")}
                  className="min-h-14 text-xs resize-none"
                />
              </div>

              {/* Live Financial Breakdown */}
              <div className="space-y-1.5 rounded-lg bg-muted/60 p-3 text-xs border">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("subtotal")}</span>
                  <span className="font-mono tabular-nums" dir="ltr">
                    {subtotal.toFixed(2)} {t("currency")}
                  </span>
                </div>

                {netDeliveryFee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Truck className="size-3" />
                      {t("deliveryFee")}
                    </span>
                    <span className="font-mono tabular-nums" dir="ltr">
                      +{netDeliveryFee.toFixed(2)} {t("currency")}
                    </span>
                  </div>
                )}

                {numericDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>{t("discount")}</span>
                    <span className="font-mono tabular-nums" dir="ltr">
                      -{numericDiscount.toFixed(2)} {t("currency")}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-border text-foreground">
                  <span>{t("total")}</span>
                  <span className="text-base font-extrabold text-primary font-mono tabular-nums" dir="ltr">
                    {grandTotal.toFixed(2)} {t("currency")}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="button"
                size="lg"
                disabled={isSubmitting || cart.length === 0 || !customerPhone.trim() || !customerName.trim()}
                onClick={handleSubmitOrder}
                className="w-full text-base font-bold shadow-md h-12"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    {t("creating")}
                  </span>
                ) : (
                  <span className="flex items-center justify-between w-full px-2">
                    <span>{t("createOrder")}</span>
                    <span className="font-mono tabular-nums" dir="ltr">
                      {grandTotal.toFixed(2)} {t("currency")}
                    </span>
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ────────────────────────── Success Dialog ────────────────────────── */}
      <Dialog
        open={createdOrderResult !== null}
        onOpenChange={(open) => {
          if (!open) handleResetForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 mb-2">
              <CheckCircle2 className="size-8" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              {t("successTitle")}
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              {t("successMessage", {
                orderNumber: createdOrderResult?.orderNumber ?? "",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 rounded-lg bg-muted p-3 text-center">
            <span className="text-xs text-muted-foreground block mb-1">
              {t("total")}
            </span>
            <span className="text-2xl font-extrabold text-primary font-mono" dir="ltr">
              {createdOrderResult?.total.toFixed(2)} {t("currency")}
            </span>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                router.push("/orders");
              }}
              className="flex-1"
            >
              {t("viewOrders")}
            </Button>
            <Button
              type="button"
              onClick={handleResetForm}
              className="flex-1 font-bold"
            >
              <RotateCcw className="size-4 me-1.5" />
              {t("createAnother")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
