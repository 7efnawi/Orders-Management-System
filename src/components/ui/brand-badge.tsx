import * as React from "react";
import { cn } from "@/lib/utils";
import { getBrandToken } from "@/lib/visualTokens";

export interface BrandBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  brandName?: string | null;
  showKanji?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "subtle" | "outline";
  className?: string;
}

export function BrandBadge({
  brandName,
  showKanji = true,
  size = "md",
  variant = "subtle",
  className,
  ...props
}: BrandBadgeProps) {
  const token = getBrandToken(brandName);

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2.5 py-0.5 gap-1.5",
    lg: "text-sm px-3 py-1 gap-2",
  };

  const kanjiSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  const variantStyles = {
    subtle: cn(token.bgClass, token.textClass, token.borderClass),
    solid: "text-white font-semibold shadow-xs",
    outline: cn("bg-transparent", token.textClass, token.borderClass),
  };

  const solidStyle =
    variant === "solid"
      ? { backgroundColor: token.hex, borderColor: token.hex }
      : undefined;

  return (
    <span
      data-slot="brand-badge"
      data-brand={token.name}
      className={cn(
        "inline-flex items-center rounded-full font-medium border transition-colors select-none",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      style={solidStyle}
      {...props}
    >
      {showKanji && (
        <span
          data-slot="brand-kanji"
          className={cn(
            "font-bold font-mono leading-none shrink-0 opacity-90",
            kanjiSizes[size]
          )}
        >
          {token.kanji}
        </span>
      )}
      <span className="truncate">{token.name}</span>
    </span>
  );
}
