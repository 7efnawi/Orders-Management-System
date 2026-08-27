/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PhoneCall } from "lucide-react";

export interface PlatformLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  platformName?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function PlatformLogo({
  platformName,
  size = "md",
  className,
  ...props
}: PlatformLogoProps) {
  const normalized = (platformName || "").toLowerCase().trim().replace(/\s+/g, "");

  const sizeClasses = {
    sm: "size-4 min-w-4",
    md: "size-5 min-w-5",
    lg: "size-6 min-w-6",
    xl: "size-8 min-w-8",
  };

  const currentSizeClass = sizeClasses[size];

  // 1. TALABAT (Using uploaded /Talabat_logo.svg)
  if (normalized.includes("talabat") || normalized.includes("طلبات")) {
    return (
      <div
        className={cn(
          currentSizeClass,
          "relative flex items-center justify-center rounded-sm overflow-hidden shrink-0",
          className
        )}
        title="Talabat"
        {...props}
      >
        <img
          src="/Talabat_logo.svg"
          alt="Talabat"
          className="size-full object-contain"
          loading="eager"
        />
      </div>
    );
  }

  // 2. ELMENUS (Using uploaded /Elmenus_logo.svg)
  if (normalized.includes("elmenus") || normalized.includes("المنيوز") || normalized.includes("menus")) {
    return (
      <div
        className={cn(
          currentSizeClass,
          "relative flex items-center justify-center rounded-sm overflow-hidden shrink-0",
          className
        )}
        title="elmenus"
        {...props}
      >
        <img
          src="/Elmenus_logo.svg"
          alt="elmenus"
          className="size-full object-contain"
          loading="eager"
        />
      </div>
    );
  }

  // 3. INSTASHOP (Using uploaded /instashop-logo.svg)
  if (
    normalized.includes("instashop") ||
    normalized.includes("انستاشوب") ||
    normalized.includes("إنستاشوب")
  ) {
    return (
      <div
        className={cn(
          currentSizeClass,
          "relative flex items-center justify-center rounded-sm overflow-hidden shrink-0",
          className
        )}
        title="InstaShop"
        {...props}
      >
        <img
          src="/instashop-logo.svg"
          alt="InstaShop"
          className="size-full object-contain"
          loading="eager"
        />
      </div>
    );
  }

  // 4. HARRY APP (Using uploaded /HurryApp_logo.jpeg)
  if (normalized.includes("harry") || normalized.includes("hurry") || normalized.includes("هاري")) {
    return (
      <div
        className={cn(
          currentSizeClass,
          "relative flex items-center justify-center rounded-md overflow-hidden shrink-0 border border-border/40 shadow-2xs",
          className
        )}
        title="Harry App"
        {...props}
      >
        <img
          src="/HurryApp_logo.jpeg"
          alt="Harry App"
          className="size-full object-cover"
          loading="eager"
        />
      </div>
    );
  }

  // 5. FACEBOOK (Official Blue with 'f')
  if (normalized.includes("facebook") || normalized.includes("فيسبوك") || normalized.includes("fb")) {
    return (
      <div
        className={cn(
          currentSizeClass,
          "flex items-center justify-center rounded-md bg-[#1877f2] text-white shrink-0 shadow-2xs",
          className
        )}
        title="Facebook"
        {...props}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
          <path d="M13.5 20v-6.5h2.2l.33-2.5h-2.53V9.4c0-.73.2-1.22 1.24-1.22H16V5.94c-.23-.03-1.02-.1-1.95-.1-1.93 0-3.25 1.18-3.25 3.34V11H8.7v2.5h2.1V20h2.7z" />
        </svg>
      </div>
    );
  }

  // 6. PHONE / DIRECT (Sky Blue with Phone Receiver)
  return (
    <div
      className={cn(
        currentSizeClass,
        "flex items-center justify-center rounded-md bg-[#0284c7] text-white shrink-0 shadow-2xs",
        className
      )}
      title="Phone Direct"
      {...props}
    >
      <PhoneCall className="size-3 stroke-[2.5]" />
    </div>
  );
}
