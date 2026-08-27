"use client";

import { useEffect, useState } from "react";
import { OrderStatus } from "@prisma/client";

export interface PrepTimerOptions {
  startTime?: Date | string | null;
  status?: OrderStatus | null;
  warningThresholdMinutes?: number; // default: 10 mins
  criticalThresholdMinutes?: number; // default: 15 mins (900 seconds)
}

export interface PrepTimerResult {
  elapsedSeconds: number;
  minutes: number;
  seconds: number;
  formattedTime: string;
  isWarning: boolean;
  isCritical: boolean;
  isDelayed: boolean;
  isActive: boolean;
}

export function formatPrepTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
  const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${paddedMins}:${paddedSecs}`;
}

export function calculateElapsedSeconds(startTime?: Date | string | null): number {
  if (!startTime) return 0;
  const startMs = new Date(startTime).getTime();
  if (isNaN(startMs)) return 0;
  return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
}

const TERMINAL_STATUS_SET = new Set<OrderStatus>([
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
]);

export function usePrepTimer({
  startTime,
  status,
  warningThresholdMinutes = 10,
  criticalThresholdMinutes = 15,
}: PrepTimerOptions): PrepTimerResult {
  const isTerminal = status ? TERMINAL_STATUS_SET.has(status) : false;
  const isActive = !isTerminal && !!startTime;

  const [, setTick] = useState<number>(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isActive]);

  const elapsedSeconds = calculateElapsedSeconds(startTime);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const isWarning = minutes >= warningThresholdMinutes && minutes < criticalThresholdMinutes;
  const isCritical = minutes >= criticalThresholdMinutes;
  const isDelayed = isCritical;

  return {
    elapsedSeconds,
    minutes,
    seconds,
    formattedTime: formatPrepTime(elapsedSeconds),
    isWarning,
    isCritical,
    isDelayed,
    isActive,
  };
}
