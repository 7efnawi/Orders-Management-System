import * as React from "react";
import { cn } from "@/lib/utils";
import { getPlatformToken } from "@/lib/visualTokens";

export interface PlatformBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  platformName?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "subtle" | "outline";
  showDot?: boolean;
  className?: string;
}

export function PlatformBadge({
  platformName,
  size = "md",
  variant = "subtle",
  showDot = true,
  className,
  ...props
}: PlatformBadgeProps) {
  const token = getPlatformToken(platformName);

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2.5 py-0.5 gap-1.5",
    lg: "text-sm px-3 py-1 gap-2",
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
        "inline-flex items-center rounded-full font-medium border transition-colors select-none",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      style={solidStyle}
      {...props}
    >
      {showDot && (
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
