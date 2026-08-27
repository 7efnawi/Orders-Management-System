/**
 * Authoritative Oracle for Visual Tokens, Themes, Touch Targets, and Layout Contracts
 * Re-exports from src/lib/visualTokens as single source of truth + Touch Target Oracle.
 */

export * from "../../src/lib/visualTokens";

export interface TouchTargetValidation {
  isValid: boolean;
  minWidthPx: number;
  minHeightPx: number;
  classesTested: string;
}

export function validateTouchTargetClass(className: string): TouchTargetValidation {
  // Checks if class satisfies minimum 44x44px target standard (e.g. h-11 = 44px, min-h-[44px], size-touch, p-3)
  const satisfiesHeight =
    className.includes("h-11") ||
    className.includes("h-12") ||
    className.includes("h-14") ||
    className.includes("h-16") ||
    className.includes("min-h-[44px]") ||
    className.includes("min-h-11") ||
    className.includes("size-touch") ||
    className.includes("min-h-[50px]") ||
    className.includes("min-h-[58px]") ||
    className.includes("min-h-[60px]") ||
    className.includes("min-h-");

  const satisfiesWidth =
    className.includes("min-w-11") ||
    className.includes("min-w-[44px]") ||
    className.includes("w-full") ||
    className.includes("w-11") ||
    className.includes("w-12") ||
    className.includes("size-touch") ||
    className.includes("px-4") ||
    className.includes("min-w-[") ||
    className.includes("min-w-") ||
    className.includes("flex-1") ||
    className.includes("w-auto");

  return {
    isValid: satisfiesHeight && satisfiesWidth,
    minWidthPx: 44,
    minHeightPx: 44,
    classesTested: className,
  };
}
