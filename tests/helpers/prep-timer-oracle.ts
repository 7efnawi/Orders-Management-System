/**
 * Authoritative Oracle for Kitchen Prep Timer & Pulse Alert Calculations
 * Reference: PROJECT.md § Kitchen Prep Timer Contract & ORIGINAL_REQUEST.md § R4
 */

export interface PrepTimeCalculation {
  elapsedSeconds: number;
  formattedTime: string;
  isWarning: boolean;   // >= 10 mins (600s)
  isCritical: boolean;  // >= 15 mins (900s) -> Pulsing warning badge
  badgeAnimationClass: string;
  badgeColorClass: string;
}

export function calculatePrepTime(
  preparingAt: Date | string | null | undefined,
  createdAt: Date | string,
  now: Date | string = new Date()
): PrepTimeCalculation {
  const startTime = preparingAt ? new Date(preparingAt) : new Date(createdAt);
  const currentTime = new Date(now);

  const diffMs = currentTime.getTime() - startTime.getTime();
  const elapsedSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  let formattedTime: string;
  if (hours > 0) {
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    formattedTime = `${hh}:${mm}:${ss}`;
  } else {
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    formattedTime = `${mm}:${ss}`;
  }

  const isCritical = elapsedSeconds >= 900; // 15 minutes threshold
  const isWarning = elapsedSeconds >= 600 && !isCritical; // 10-14 minutes

  let badgeAnimationClass = "";
  let badgeColorClass = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300";

  if (isCritical) {
    badgeAnimationClass = "animate-pulse ring-2 ring-red-500 ring-offset-1";
    badgeColorClass = "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500 font-bold";
  } else if (isWarning) {
    badgeAnimationClass = "";
    badgeColorClass = "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500";
  }

  return {
    elapsedSeconds,
    formattedTime,
    isWarning,
    isCritical,
    badgeAnimationClass,
    badgeColorClass,
  };
}
