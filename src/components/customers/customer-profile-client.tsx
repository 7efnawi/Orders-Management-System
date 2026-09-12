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
  const tTiers = useTranslations("customers.tiers");
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

  function renderTierBadge() {
    const tier = customer.loyaltyTier.tier;
    const isNew = customer.loyaltyTier.isFirstTime;

    if (isNew) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
          {tTiers("NEW")}
        </span>
      );
    }

    if (tier === "PLATINUM") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
          {tTiers("PLATINUM")}
        </span>
      );
    }

    if (tier === "GOLD") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          {tTiers("GOLD")}
        </span>
      );
    }

    if (tier === "SILVER") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
          {tTiers("SILVER")}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
        {tTiers("BRONZE")}
      </span>
    );
  }

  const ArrowIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6">
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
                  {renderTierBadge()}
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
