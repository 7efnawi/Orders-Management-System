"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import type { DayHourCell, HourlyRow } from "@/lib/reports";

interface PeakHoursHeatmapProps {
  heatmap: DayHourCell[];
  hourly: HourlyRow[];
  formatCurrency: (v: number) => string;
}

const DAY_NAMES_AR = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function intensityClass(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-muted/30";
  const p = value / max;
  if (p >= 0.8) return "bg-rose-500/90 text-white dark:bg-rose-500/80";
  if (p >= 0.6) return "bg-orange-500/80 text-white dark:bg-orange-500/70";
  if (p >= 0.4) return "bg-amber-400/80 text-zinc-900 dark:bg-amber-500/60";
  if (p >= 0.2) return "bg-yellow-300/80 text-zinc-900 dark:bg-yellow-400/40";
  return "bg-yellow-100 text-zinc-800 dark:bg-yellow-500/20";
}

export function PeakHoursHeatmap({ heatmap, hourly, formatCurrency }: PeakHoursHeatmapProps) {
  const t = useTranslations("reports.peakHours");

  const maxCell = Math.max(...heatmap.map((c) => c.orders), 1);
  const maxHour = Math.max(...hourly.map((h) => h.orders), 1);

  const grid: number[][] = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  for (const c of heatmap) {
    grid[c.day][c.hour] = c.orders;
  }

  const peak = hourly.reduce(
    (best, h) => (h.orders > (best?.orders ?? 0) ? h : best),
    hourly[0]
  );

  return (
    <Card className="border-border/70 shadow-xs">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <Flame className="size-4 text-orange-500" />
            <span>{t("title")}</span>
          </CardTitle>
          {peak && peak.orders > 0 && (
            <span className="text-xs text-muted-foreground">
              {t("peakAt")}{" "}
              <strong className="font-mono text-foreground font-bold">
                {String(peak.hour).padStart(2, "0")}:00
              </strong>{" "}
              ({peak.orders} {t("orders")})
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Hour labels row */}
            <div className="flex ms-14 mb-1.5">
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  className="flex-1 text-center text-[10px] text-muted-foreground font-mono"
                >
                  {h % 3 === 0 ? `${String(h).padStart(2, "0")}` : ""}
                </div>
              ))}
            </div>

            {/* Day rows */}
            {Array.from({ length: 7 }, (_, day) => (
              <div key={day} className="flex items-center mb-1 gap-1">
                <div className="w-12 text-xs font-medium text-muted-foreground text-end pe-2 shrink-0">
                  {DAY_NAMES_AR[day]}
                </div>
                {Array.from({ length: 24 }, (_, hour) => {
                  const count = grid[day][hour];
                  return (
                    <div
                      key={hour}
                      title={`${DAY_NAMES_EN[day]} ${String(hour).padStart(2, "0")}:00 — ${count} ${t("orders")}`}
                      className={`flex-1 h-7 rounded-sm flex items-center justify-center text-[10px] font-mono transition-colors cursor-default ${intensityClass(
                        count,
                        maxCell
                      )}`}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 justify-end">
              <span className="text-[11px] text-muted-foreground">{t("low")}</span>
              <div className="flex items-center gap-1">
                <div className="w-5 h-3.5 rounded-xs bg-muted/40" />
                <div className="w-5 h-3.5 rounded-xs bg-yellow-100 dark:bg-yellow-500/20" />
                <div className="w-5 h-3.5 rounded-xs bg-yellow-300/80 dark:bg-yellow-400/40" />
                <div className="w-5 h-3.5 rounded-xs bg-amber-400/80 dark:bg-amber-500/60" />
                <div className="w-5 h-3.5 rounded-xs bg-orange-500/80 dark:bg-orange-500/70" />
                <div className="w-5 h-3.5 rounded-xs bg-rose-500/90 dark:bg-rose-500/80" />
              </div>
              <span className="text-[11px] text-muted-foreground">{t("high")}</span>
            </div>
          </div>
        </div>

        {/* Hourly distribution bars */}
        <div className="mt-6 border-t border-border/40 pt-5">
          <p className="text-xs font-semibold text-muted-foreground mb-3">
            {t("hourlyDistribution")}
          </p>
          <div className="flex items-end gap-1 h-20">
            {hourly.map((h) => {
              const pct = maxHour > 0 ? (h.orders / maxHour) * 100 : 0;
              const isPeak = peak && h.hour === peak.hour && h.orders > 0;
              return (
                <div
                  key={h.hour}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  title={`${String(h.hour).padStart(2, "0")}:00 — ${h.orders} ${t("orders")} · ${formatCurrency(
                    h.revenue
                  )}`}
                >
                  <div
                    className={`w-full rounded-t-xs transition-all ${
                      isPeak
                        ? "bg-orange-500 shadow-sm"
                        : "bg-primary/50 group-hover:bg-primary"
                    }`}
                    style={{ height: `${Math.max(pct, 3)}%` }}
                  />
                  <span className="text-[9px] text-muted-foreground mt-1 font-mono">
                    {h.hour % 3 === 0 ? String(h.hour).padStart(2, "0") : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
