import * as React from "react";
import { cn } from "@/lib/utils";
import { getPlatformToken } from "@/lib/visualTokens";
import { PlatformLogo } from "@/components/ui/platform-logo";

export interface PlatformBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  platformName?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "subtle" | "outline";
  showLogo?: boolean;
  showDot?: boolean;
  className?: string;
}

export function PlatformBadge({
  platformName,
  size = "md",
  variant = "subtle",
  showLogo = true,
  showDot = false,
  className,
  ...props
}: PlatformBadgeProps) {
  const token = getPlatformToken(platformName);

  const sizeStyles = {
    sm: "text-xs h-6 px-2 gap-1.5",
    md: "text-xs h-7 px-2.5 gap-2",
    lg: "text-sm h-8 px-3 gap-2.5",
  };

  const dotSizes = {
    sm: "size-1.5",
    md: "size-2",
    lg: "size-2.5",
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
      data-slot="platform-badge"
      data-platform={token.name}
      className={cn(
        "inline-flex items-center rounded-full font-medium border transition-colors select-none shrink-0",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      style={solidStyle}
      {...props}
    >
      {showLogo && (
        <PlatformLogo
          platformName={token.name}
          size={size === "lg" ? "sm" : "xs"}
          className="shrink-0"
        />
      )}
      {showDot && !showLogo && (
        <span
          data-slot="platform-dot"
          className={cn("rounded-full shrink-0", dotSizes[size])}
          style={{
            backgroundColor: variant === "solid" ? "currentColor" : token.hex,
          }}
        />
      )}
      <span className="truncate">{token.name}</span>
    </span>
  );
}
