"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Users, UserPlus, Crown, AlertTriangle } from "lucide-react";
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
      value: (stats.totalCustomers ?? 0).toLocaleString(isAr ? "ar-EG" : "en-US"),
      icon: Users,
      colorClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/60",
      accentBorder: "hover:border-blue-300 dark:hover:border-blue-800",
    },
    {
      id: "new",
      label: t("newThisMonth"),
      value: (stats.newThisMonth ?? 0).toLocaleString(isAr ? "ar-EG" : "en-US"),
      icon: UserPlus,
      colorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60",
      accentBorder: "hover:border-emerald-300 dark:hover:border-emerald-800",
    },
    {
      id: "vip",
      label: t("vipCount"),
      value: (stats.vipCount ?? 0).toLocaleString(isAr ? "ar-EG" : "en-US"),
      icon: Crown,
      colorClass: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60",
      accentBorder: "hover:border-amber-300 dark:hover:border-amber-800",
    },
    {
      id: "atRisk",
      label: t("atRiskCount"),
      value: (stats.atRiskCount || 0).toLocaleString(isAr ? "ar-EG" : "en-US"),
      icon: AlertTriangle,
      colorClass: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-900/60",
      accentBorder: "hover:border-orange-300 dark:hover:border-orange-800",
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
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                <p className="font-mono text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
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
