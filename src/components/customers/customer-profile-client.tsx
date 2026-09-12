"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  Copy,
  Check,
  MapPin,
  Calendar,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Award,
  CircleDollarSign,
  User as UserIcon,
  Star,
  AlertTriangle,
  CheckCircle2,
  UserX,
  Truck,
  Bike,
  Utensils,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerProfileResult } from "@/services/customers";
import { formatCustomerPhone } from "@/lib/customers";
import { CustomerProblemOrdersBanner } from "@/components/customers/customer-problem-orders-banner";
import { CustomerNotesEditor } from "@/components/customers/customer-notes-editor";
import { CustomerOrderHistoryTable } from "@/components/customers/customer-order-history-table";
import { cn } from "@/lib/utils";

interface CustomerProfileClientProps {
  customer: CustomerProfileResult;
}

export function CustomerProfileClient({ customer }: CustomerProfileClientProps) {
  const t = useTranslations("customers.profile");
  const tSegments = useTranslations("customers.segments");
  const locale = useLocale();
  const isAr = locale === "ar";

  const [copiedPhone, setCopiedPhone] = React.useState<boolean>(false);
  const phoneInfo = formatCustomerPhone(customer.phone);

  function handleCopyPhone() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(phoneInfo.raw || customer.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  }

  function formatDisplayDate(date: Date | string | null): string {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function renderSegmentBadge() {
    const seg = customer.segment || "REGULAR";
    const label =
      tSegments(seg as "VIP" | "REGULAR" | "NEW" | "AT_RISK" | "INACTIVE") ||
      customer.segmentInfo?.labelEn ||
      seg;

    if (seg === "VIP") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
          <Star className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500" />
          <span>{label}</span>
        </span>
      );
    }

    if (seg === "REGULAR") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{label}</span>
        </span>
      );
    }

    if (seg === "NEW") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
          <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>{label}</span>
        </span>
      );
    }

    if (seg === "AT_RISK") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-900 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
          <span>{label}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700">
        <UserX className="w-3.5 h-3.5 text-slate-500" />
        <span>{label}</span>
      </span>
    );
  }

  const ArrowIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <div className="mx-auto flex w-full max-w-[1536px] flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Top Bar / Navigation */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ms-2"
        >
          <Link href="/customers">
            <ArrowIcon className="w-4 h-4" />
            <span>{t("backToList")}</span>
          </Link>
        </Button>
      </div>

      {/* Customer Hero Banner */}
      <Card className="border border-border/70 bg-card shadow-xs overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Avatar & Name & Phone */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary font-bold text-xl flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs">
                {customer.name ? customer.name.charAt(0).toUpperCase() : <UserIcon className="w-7 h-7" />}
              </div>
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                    {customer.name || (isAr ? "عميل بدون اسم" : "Unnamed Customer")}
                  </h1>
                  {renderSegmentBadge()}
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  {/* Phone chip */}
                  <div className="inline-flex items-center gap-1.5 bg-muted/60 px-2 py-0.5 rounded-md border border-border/60">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <span
                      dir="ltr"
                      className="font-mono text-xs font-semibold tabular-nums text-foreground select-all"
                    >
                      {phoneInfo.display || customer.phone}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      title={t("copyPhone")}
                    >
                      {copiedPhone ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Direct Call action */}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[11px] gap-1 border-border/60"
                  >
                    <a href={`tel:${phoneInfo.raw || customer.phone}`}>
                      <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{t("call")}</span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Address & Dates Card/Pills */}
            <div className="flex flex-col sm:items-end gap-1.5 text-xs text-muted-foreground border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                <span className="font-medium text-foreground max-w-[260px] truncate">
                  {customer.address || t("noAddress")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {t("firstOrder")}: <strong className="font-mono tabular-nums">{formatDisplayDate(customer.createdAt)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Customer Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border/60">
            {/* Total Orders */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">{t("totalOrders")}</span>
                <ShoppingBag className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-xl font-bold font-mono tabular-nums text-foreground">
                {customer.totalOrders}
              </p>
            </div>

            {/* Lifetime Spent */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">{t("lifetimeSpent")}</span>
                <CircleDollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xl font-bold font-mono tabular-nums text-foreground">
                {customer.metrics.lifetimeSpent.toFixed(2)} {isAr ? "ج.م" : "EGP"}
              </p>
            </div>

            {/* Average Order Value (AOV) */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">{t("aov")}</span>
                <TrendingUp className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-xl font-bold font-mono tabular-nums text-foreground">
                {customer.metrics.aov.toFixed(2)} {isAr ? "ج.م" : "EGP"}
              </p>
            </div>

            {/* Preferred Brand */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">{t("preferredBrand")}</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-lg font-bold text-foreground truncate">
                {customer.metrics.preferredBrand || (isAr ? "لا يوجد بعد" : "None yet")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favorites & Delivery Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Favorites Card */}
        <Card className="border border-border/70 bg-card shadow-xs">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    {t("favoritesTitle")}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? "الأصناف الأكثر طلباً في سجل العميل" : "Most frequently ordered menu items"}
                  </p>
                </div>
              </div>
              {customer.favoriteProducts && customer.favoriteProducts.length > 0 && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {customer.favoriteProducts.length} {isAr ? "أصناف" : "items"}
                </span>
              )}
            </div>

            {customer.favoriteProducts && customer.favoriteProducts.length > 0 ? (
              <div className="space-y-2 pt-1">
                {customer.favoriteProducts.map((prod, idx) => (
                  <div
                    key={prod.productId || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50 hover:border-border transition-colors gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold font-mono flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate" title={prod.productName}>
                          {prod.productName}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground tabular-nums">
                          {prod.price.toFixed(2)} {isAr ? "ج.م" : "EGP"}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-end">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold font-mono bg-primary/10 text-primary border border-primary/20 tabular-nums">
                        {t("timesOrdered", { count: prod.quantity })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-muted-foreground/40" />
                <p>{t("noFavorites")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Insights Card */}
        <Card className="border border-border/70 bg-card shadow-xs">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    {isAr ? "تفضيلات التوصيل والدارك كيتشن" : "Dark Kitchen & Delivery Insights"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? "قناة التوصيل ومنطقة الخدمة المعتادة" : "Preferred ordering channel & usual zone"}
                  </p>
                </div>
              </div>

              {/* 100% Delivery Badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                <Bike className="w-3.5 h-3.5" />
                <span>{t("deliveryOnlyNotice")}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Preferred Platform */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 space-y-2">
                <span className="text-xs font-medium text-muted-foreground block">
                  {t("preferredPlatform")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-background border border-border/70 text-foreground shadow-2xs">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>{customer.preferredPlatform || (isAr ? "لا توجد بعد" : "None yet")}</span>
                  </span>
                </div>
              </div>

              {/* Usual Delivery Zone */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 space-y-2">
                <span className="text-xs font-medium text-muted-foreground block">
                  {t("usualDeliveryZone")}
                </span>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">
                    {customer.usualDeliveryZone || (isAr ? "لا توجد منطقة محددة" : "No specific zone")}
                  </span>
                </div>
              </div>
            </div>

            {/* Dark Kitchen Notice Banner */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/40 flex items-center gap-2.5 text-xs text-muted-foreground">
              <Bike className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                {isAr
                  ? "جميع عمليات هذا الفرع تتبع نموذج المطبخ السحابي (Dark Kitchen) بنظام التوصيل بنسبة 100% دون صالة أو استلام مباشر."
                  : "All operations follow the Dark Kitchen cloud kitchen model with 100% delivery operations."}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Problem Orders Banner */}
      <CustomerProblemOrdersBanner problemSummary={customer.problemSummary} />

      {/* Customer Notes Editor */}
      <CustomerNotesEditor
        customerId={customer.id}
        initialNotes={customer.notes}
      />

      {/* Complete Order History Table */}
      <CustomerOrderHistoryTable orders={customer.orders} />
    </div>
  );
}

