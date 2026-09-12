"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle, Ban, Truck, ShieldAlert } from "lucide-react";
import { ProblemOrderSummary } from "@/lib/customers";

interface CustomerProblemOrdersBannerProps {
  problemSummary: ProblemOrderSummary;
}

export function CustomerProblemOrdersBanner({
  problemSummary,
}: CustomerProblemOrdersBannerProps) {
  const t = useTranslations("customers.profile");

  if (!problemSummary.hasProblems) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>{t("noProblems")}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40 p-4 shadow-xs space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-200/70 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
            {t("problemOrdersTitle")}
          </h3>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
            {t("problemOrdersDesc", { count: problemSummary.totalProblems })}
          </p>
        </div>
      </div>

      {/* Breakdown Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1 ps-11">
        {problemSummary.cancelledCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>
              {t("problemCancelled")}: <strong className="font-mono tabular-nums">{problemSummary.cancelledCount}</strong>
            </span>
          </span>
        )}

        {problemSummary.deliveryIssueCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-900">
            <Truck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>
              {t("problemDelivery")}: <strong className="font-mono tabular-nums">{problemSummary.deliveryIssueCount}</strong>
            </span>
          </span>
        )}

        {problemSummary.qualityIssueCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>
              {t("problemQuality")}: <strong className="font-mono tabular-nums">{problemSummary.qualityIssueCount}</strong>
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
