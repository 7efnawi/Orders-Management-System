"use client";

import * as React from "react";
import { Clock, Flame, AlertTriangle } from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { usePrepTimer } from "@/hooks/use-prep-timer";
import { cn } from "@/lib/utils";

export interface PrepTimerBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  startTime?: Date | string | null;
  status?: OrderStatus | null;
  warningThresholdMinutes?: number;
  criticalThresholdMinutes?: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showDelayText?: boolean;
  className?: string;
}

export function PrepTimerBadge({
  startTime,
  status,
  warningThresholdMinutes = 10,
  criticalThresholdMinutes = 15,
  size = "md",
  showIcon = true,
  showDelayText = false,
  className,
  ...props
}: PrepTimerBadgeProps) {
  const { formattedTime, minutes, isWarning, isCritical, isActive } = usePrepTimer({
    startTime,
    status,
    warningThresholdMinutes,
    criticalThresholdMinutes,
  });

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-0.5 gap-1.5",
    lg: "text-sm px-2.5 py-1 gap-2",
  };

  const iconSizes = {
    sm: "size-2.5",
    md: "size-3",
    lg: "size-3.5",
  };

  if (!startTime) {
    return null;
  }

  // Determine state styles
  let badgeStyle = "bg-muted/80 text-muted-foreground border-border";
  if (isActive) {
    if (isCritical) {
      badgeStyle =
        "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40 ring-1 ring-red-500/30 animate-pulse font-bold shadow-xs";
    } else if (isWarning) {
      badgeStyle =
        "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 font-semibold";
    } else if (status === OrderStatus.PREPARING) {
      badgeStyle =
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium";
    }
  }

  return (
    <span
      data-slot="prep-timer-badge"
      data-critical={isCritical ? "true" : "false"}
      data-warning={isWarning ? "true" : "false"}
      title={
        isCritical
          ? `Preparation delayed (${minutes}m >= ${criticalThresholdMinutes}m)`
          : `Elapsed prep time: ${formattedTime}`
      }
      className={cn(
        "inline-flex items-center rounded-full border select-none transition-colors",
        sizeStyles[size],
        badgeStyle,
        className
      )}
      {...props}
    >
      {/* Flashing ping dot for critical delays */}
      {isActive && isCritical && (
        <span className="relative flex size-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full size-2 bg-red-500" />
        </span>
      )}

      {/* Icon */}
      {showIcon && (
        <>
          {isActive && isCritical ? (
            <Flame className={cn("shrink-0 text-red-600 dark:text-red-400", iconSizes[size])} />
          ) : isActive && isWarning ? (
            <AlertTriangle className={cn("shrink-0 text-amber-600 dark:text-amber-400", iconSizes[size])} />
          ) : (
            <Clock className={cn("shrink-0 opacity-80", iconSizes[size])} />
          )}
        </>
      )}

      {/* Ticking time */}
      <span className="font-mono tabular-nums font-semibold tracking-tight">
        {formattedTime}
      </span>

      {/* Optional Delay Label */}
      {showDelayText && isCritical && (
        <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
          (+{criticalThresholdMinutes}m)
        </span>
      )}
    </span>
  );
}
