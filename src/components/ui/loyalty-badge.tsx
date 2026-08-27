"use client";

import * as React from "react";
import { Crown, Star, Smile, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLoyaltyTier, LoyaltyTierInfo } from "@/lib/visualTokens";
import { useLocale } from "next-intl";

export interface LoyaltyTierBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  totalOrders?: number | null;
  tierInfo?: LoyaltyTierInfo;
  size?: "sm" | "md" | "lg";
  variant?: "subtle" | "solid" | "outline";
  showIcon?: boolean;
  showOrderCount?: boolean;
  className?: string;
}

const TIER_ICONS = {
  Crown,
  Star,
  Smile,
  UserPlus,
};

export function LoyaltyTierBadge({
  totalOrders,
  tierInfo,
  size = "md",
  variant = "subtle",
  showIcon = true,
  showOrderCount = false,
  className,
  ...props
}: LoyaltyTierBadgeProps) {
  let locale = "ar";
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    locale = useLocale();
  } catch {
    locale = "ar";
  }

  const info = tierInfo ?? getLoyaltyTier(totalOrders);
  const count = Math.max(0, Math.floor(Number(totalOrders) || 0));

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2.5 py-0.5 gap-1.5",
    lg: "text-sm px-3 py-1 gap-2",
  };

  const iconSizes = {
    sm: "size-3",
    md: "size-3.5",
    lg: "size-4",
  };

  const variantStyles = {
    subtle: cn(info.bgClass, info.colorClass),
    solid: cn(
      info.tier === "legend" && "bg-purple-600 text-white border-purple-600",
      info.tier === "vip" && "bg-amber-500 text-white border-amber-500",
      info.tier === "regular" && "bg-blue-600 text-white border-blue-600",
      info.tier === "new" && "bg-muted text-muted-foreground border-border"
    ),
    outline: cn("bg-transparent", info.colorClass, "border-current"),
  };

  const IconComponent = TIER_ICONS[info.iconName as keyof typeof TIER_ICONS] ?? Smile;
  const label = locale === "en" ? info.labelEn : info.labelAr;

  return (
    <span
      data-slot="loyalty-badge"
      data-tier={info.tier}
      className={cn(
        "inline-flex items-center rounded-full font-semibold border transition-colors select-none",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {showIcon && <IconComponent className={cn("shrink-0", iconSizes[size])} />}
      <span className="truncate">{label}</span>
      {showOrderCount && count > 0 && (
        <span
          className="ms-1 rounded-full bg-background/80 px-1.5 py-0.2 font-mono text-[10px] tabular-nums text-foreground border border-border/50"
          dir="ltr"
        >
          {count} {locale === "en" ? (count === 1 ? "order" : "orders") : (count === 1 ? "طلب" : "طلبات")}
        </span>
      )}
    </span>
  );
}
