"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Users, UserPlus, Crown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerListStats } from "@/services/customers";

interface CustomerKpiCardsProps {
  stats: CustomerListStats;
  isLoading?: boolean;
}

export function CustomerKpiCards({ stats, isLoading }: CustomerKpiCardsProps) {
  const t = useTranslations("customers.kpis");
  const locale = useLocale();
  const isAr = locale === "ar";

  const cards = [
    {
      id: "total",
      label: t("totalCustomers"),
      value: stats.totalCustomers.toLocaleString(isAr ? "ar-EG" : "en-US"),
      icon: Users,
      colorClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/60",
      accentBorder: "hover:border-blue-300 dark:hover:border-blue-800",
    },
    {
      id: "new",
      label: t("newThisMonth"),
      value: stats.newThisMonth.toLocaleString(isAr ? "ar-EG" : "en-US"),
      icon: UserPlus,
      colorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60",
      accentBorder: "hover:border-emerald-300 dark:hover:border-emerald-800",
    },
    {
      id: "vip",
      label: t("vipCount"),
      value: stats.vipCount.toLocaleString(isAr ? "ar-EG" : "en-US"),
      icon: Crown,
      colorClass: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60",
      accentBorder: "hover:border-amber-300 dark:hover:border-amber-800",
    },
    {
      id: "spent",
      label: t("avgSpent"),
      value: `${stats.avgSpent.toLocaleString(isAr ? "ar-EG" : "en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })} ${isAr ? "ج.م" : "EGP"}`,
      icon: TrendingUp,
      colorClass: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900/60",
      accentBorder: "hover:border-purple-300 dark:hover:border-purple-800",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.id}
            className={`border border-border/70 bg-card transition-all duration-200 shadow-xs ${card.accentBorder} ${
              isLoading ? "opacity-60" : ""
            }`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold tracking-tight font-mono tabular-nums text-foreground">
                  {card.value}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl border ${card.colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
