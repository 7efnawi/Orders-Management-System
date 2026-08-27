/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PhoneCall } from "lucide-react";

export interface PlatformLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  platformName?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
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
    xs: "size-4 min-w-4 rounded-xs",
    sm: "size-5 min-w-5 rounded-md",
    md: "size-6 min-w-6 rounded-md",
    lg: "size-7 min-w-7 rounded-md",
    xl: "size-9 min-w-9 rounded-lg",
  };

  const currentSizeClass = sizeClasses[size];

  // 1. TALABAT (Vector mark extracted from /Talabat_logo.svg)
  if (normalized.includes("talabat") || normalized.includes("طلبات")) {
    return (
      <div
        className={cn(
          currentSizeClass,
          "relative flex items-center justify-center bg-[#ff5a00] text-white shrink-0 shadow-2xs overflow-hidden p-0.5 select-none",
          className
        )}
        title="Talabat"
        {...props}
      >
        <svg viewBox="10 24 52 74" fill="currentColor" className="size-full">
          <path d="M55.81 83.02c-1.05.36-2.17.56-3.34.56-3.65 0-5.41-1.92-7.01-4.8-.53-.91-.82-2.91-.82-2.91V60.08h13.5l-.71-6.3c-.35-3.1-2.98-5.45-6.1-5.45h-6.68V28.8s-4.04.27-5.39.37c-6.91.54-11.58 5.14-11.58 10.52l.03 9.08-11.95.44v4.54c0 3.49 2.83 6.32 6.31 6.32h5.63v16.17l.08 2.36c.05 10.07 8.22 18.2 18.3 18.2 3.58 0 6.92-1.03 9.74-2.81V83.02Z" />
        </svg>
      </div>
    );
  }

  // 2. ELMENUS (Official book mark extracted from /Elmenus_logo.svg)
  if (normalized.includes("elmenus") || normalized.includes("المنيوز") || normalized.includes("menus")) {
    return (
      <div
        className={cn(
          currentSizeClass,
          "relative flex items-center justify-center bg-[#F02A00] text-white shrink-0 shadow-2xs overflow-hidden select-none",
          className
        )}
        title="elmenus"
        {...props}
      >
        <svg viewBox="0 0 277 277" fill="none" className="size-full">
          <rect width="277" height="277" rx="67" fill="#F02A00" />
          <path
            d="M216.942 60.8262C216.565 60.8262 216.188 60.8262 215.811 61.0159L138.679 86.6262V215.247C139.433 215.247 140.187 215.057 140.753 214.867L218.262 189.257C219.771 188.688 220.903 187.17 220.714 185.463V64.81C220.903 62.5335 219.017 60.8262 216.942 60.8262Z"
            fill="white"
          />
          <path
            d="M138.49 86.4399L61.3575 60.8296C59.283 60.0708 57.2086 61.209 56.4542 63.2958C56.4542 63.4855 56.2656 63.6752 56.2656 63.8649C56.2656 64.0546 56.2656 64.0546 56.2656 64.2443C56.2656 64.434 56.2656 64.434 56.2656 64.6237V185.466C56.2656 186.794 57.02 188.122 58.1515 188.881C58.3401 189.071 58.5287 189.071 58.7173 189.261L136.415 214.871C136.604 214.871 136.792 214.871 136.792 215.061H136.981C137.547 215.061 137.924 215.25 138.49 215.25V86.4399Z"
            fill="white"
          />
        </svg>
      </div>
    );
  }

  // 3. INSTASHOP (Official bag mark extracted from /instashop-logo.svg)
  if (
    normalized.includes("instashop") ||
    normalized.includes("انستاشوب") ||
    normalized.includes("إنستاشوب")
  ) {
    return (
      <div
        className={cn(
          currentSizeClass,
          "relative flex items-center justify-center bg-[#00A896] text-white shrink-0 shadow-2xs overflow-hidden p-0.5 select-none",
          className
        )}
        title="InstaShop"
        {...props}
      >
        <svg viewBox="45 180 75 75" fill="white" className="size-full">
          <path d="M87.1,249.2l-18.2,0c-2.5,0-4.7-1.7-5.3-4.1c-2-7.6-4-15.1-6-22.6c-0.2-0.6-0.3-1.2-0.4-1.7c-0.1-0.5-0.3-0.7-0.9-0.7c-0.6,0-1.3-0.1-1.8-0.4c-1.4-0.6-2.2-2.2-1.9-3.7c0.2-1.5,1.5-2.7,3.1-2.8c0.8,0,1.6,0,2.3,0c1.6,0,3.3,0,5,0c0.5,0,0.7,0.1,0.6,0.7c-0.5,3.3,1.8,6.5,5.1,7c2.6,0.4,5.1-0.7,6.5-2.9c0.9-1.5,1.7-2.9,2.5-4.3c0.1-0.3,0.5-0.5,0.9-0.5c5.8,0,11.6,0,17.4,0c0.3,0,0.6,0.1,0.8,0.4c0.8,1.4,1.6,2.8,2.4,4.1c1.5,2.6,4.6,3.8,7.4,2.9c2.9-0.9,4.8-3.8,4.3-6.8c0-0.6,0.1-0.7,0.6-0.7c2.3,0,4.6,0,6.9,0c1.8,0,3.4,1.4,3.5,3.2c0.2,1.8-1.2,3.5-3.1,3.7c0,0,0,0-0.1,0c-1.3,0.1-1.3,0.1-1.6,1.4c-2,7.6-4,15.1-6.1,22.7c-0.4,1.4-0.8,2.8-2,3.8c-1,0.9-2.3,1.4-3.7,1.4L87.1,249.2z M101.3,235c0,2.4,0,4.8,0,7.1c0,1,0.7,1.8,1.7,1.9c0,0,0.1,0,0.1,0c1.1,0,1.8-0.8,1.8-2c0-2.8,0-5.7,0-8.5c0-1.9,0-3.8,0-5.7c0-1-0.8-1.8-1.8-1.8c-0.9,0-1.7,0.7-1.8,1.6c0,0.2,0,0.4,0,0.6C101.3,230.4,101.3,232.7,101.3,235z M69.4,235c0,2.4,0,4.8,0,7.2c0,1,0.7,1.8,1.6,1.9c0.1,0,0.2,0,0.4,0c1-0.1,1.6-0.9,1.6-2c0-4.7,0-9.3,0-13.9c0-1.2-0.8-2-1.8-2.1c-1.1,0-1.8,0.8-1.8,2.1C69.4,230.3,69.4,232.7,69.4,235L69.4,235z M94.3,235c0-2.3,0-4.7,0-7c0-1.2-0.8-2-1.8-2c-1.1,0-1.8,1-1.8,2c0,4.7,0,9.4,0,14.1c0,0.3,0,0.6,0.1,0.8c0.3,0.9,1.2,1.4,2.1,1.2c0.9-0.2,1.5-1,1.5-1.8C94.3,239.8,94.3,237.4,94.3,235z M83.6,235L83.6,235c0-0.7,0-1.5,0-2.2c0-1.7,0-3.4,0-5.1c0-1-0.8-1.7-1.8-1.7c-0.9,0-1.7,0.8-1.8,1.7c0,0.2,0,0.3,0,0.5c0,4.5,0,9.1,0,13.6c0,0.2,0,0.4,0,0.6c0.1,0.9,0.9,1.6,1.8,1.6c1.1,0,1.8-0.8,1.8-2C83.7,239.7,83.7,237.3,83.6,235L83.6,235z" />
          <path d="M66.2,214.4c0.1-0.6,0.3-1.1,0.6-1.6c2.9-5,5.8-10,8.6-15c1.2-2,2.3-4,3.4-6c0.9-1.7,3-2.3,4.7-1.4c0.3,0.2,0.7,0.4,1,0.7c1,1.1,1.2,2.8,0.3,4.3l-4.3,7.5c-2.5,4.4-5,8.8-7.6,13.1c-0.9,1.6-2.3,2.2-4,1.8C67.4,217.4,66.3,216,66.2,214.4z" />
          <path d="M108.1,214.5c0,1.6-1.1,3-2.7,3.4c-1.5,0.4-3.1-0.2-3.9-1.6c-4-7-8.1-14-12.1-20.9c-1.3-2.3-0.1-4.9,2.4-5.3c1.4-0.2,2.8,0.5,3.5,1.7c1.2,2,2.4,4.1,3.5,6.2c2.9,4.9,5.7,9.9,8.5,14.9C107.8,213.3,108,213.9,108.1,214.5z" />
        </svg>
      </div>
    );
  }

  // 4. HARRY APP (Using uploaded /HurryApp_logo.jpeg)
  if (normalized.includes("harry") || normalized.includes("hurry") || normalized.includes("هاري")) {
    return (
      <div
        className={cn(
          currentSizeClass,
          "relative flex items-center justify-center overflow-hidden shrink-0 border border-border/40 shadow-2xs bg-[#881337] select-none",
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
          "flex items-center justify-center bg-[#1877f2] text-white shrink-0 shadow-2xs select-none",
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
        "flex items-center justify-center bg-[#0284c7] text-white shrink-0 shadow-2xs select-none",
        className
      )}
      title="Phone Direct"
      {...props}
    >
      <PhoneCall className="size-3 stroke-[2.5]" />
    </div>
  );
}
