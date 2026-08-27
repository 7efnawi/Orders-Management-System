import * as React from "react";
import { cn } from "@/lib/utils";
import { PhoneCall } from "lucide-react";

export interface PlatformLogoProps extends React.SVGProps<SVGSVGElement> {
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
    sm: "size-3.5",
    md: "size-4",
    lg: "size-5",
    xl: "size-6",
  };

  const currentSizeClass = sizeClasses[size];

  // 1. TALABAT (Vibrant Orange with stylized 't' & smile)
  if (normalized.includes("talabat") || normalized.includes("طلبات")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={cn(currentSizeClass, "text-[#ff5a00] shrink-0", className)}
        aria-label="Talabat"
        {...props}
      >
        <rect width="24" height="24" rx="6" fill="#ff5a00" />
        <path
          d="M7 6.5h10v3h-3.5v8h-3v-8H7v-3z"
          fill="#ffffff"
        />
        <circle cx="16.5" cy="16.5" r="1.5" fill="#ffffff" />
      </svg>
    );
  }

  // 2. INSTASHOP (Teal Shopping Basket with Handle)
  if (normalized.includes("instashop") || normalized.includes("انستاشوب") || normalized.includes("إنستاشوب")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(currentSizeClass, "text-[#00a699] shrink-0", className)}
        aria-label="InstaShop"
        {...props}
      >
        <rect width="24" height="24" rx="6" fill="#00a699" stroke="none" />
        <path d="M6 10h12l-1.5 9h-9L6 10z" fill="#ffffff" stroke="none" />
        <path d="M9 10V7a3 3 0 0 1 6 0v3" stroke="#ffffff" strokeWidth="2" fill="none" />
      </svg>
    );
  }

  // 3. HARRY APP (Indigo Chef Hat / Food Delivery)
  if (normalized.includes("harry") || normalized.includes("هاري")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={cn(currentSizeClass, "text-[#4f46e5] shrink-0", className)}
        aria-label="Harry App"
        {...props}
      >
        <rect width="24" height="24" rx="6" fill="#4f46e5" />
        {/* Chef Hat / Cloche Silhouette */}
        <path
          d="M6 17h12v1.5H6V17zm1-2c0-.55.45-1 1-1h8c.55 0 1 .45 1 1v1H7v-1zm5-8.5c1.93 0 3.5 1.57 3.5 3.5 0 .28-.03.55-.1.81.99.35 1.7 1.28 1.7 2.39 0 1.38-1.12 2.5-2.5 2.5H8.4c-1.38 0-2.5-1.12-2.5-2.5 0-1.11.71-2.04 1.7-2.39-.07-.26-.1-.53-.1-.81 0-1.93 1.57-3.5 3.5-3.5.76 0 1.47.25 2.05.67.58-.42 1.29-.67 2.05-.67z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 4. ELMENUS (Crimson Red with white 'm' fork)
  if (normalized.includes("elmenus") || normalized.includes("المنيوز")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={cn(currentSizeClass, "text-[#e21b1b] shrink-0", className)}
        aria-label="elmenus"
        {...props}
      >
        <rect width="24" height="24" rx="6" fill="#e21b1b" />
        <path
          d="M7 16V9.5c0-.83.67-1.5 1.5-1.5S10 8.67 10 9.5V16h1.5V9.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V16H16V9.5A3.5 3.5 0 0 0 12.5 6a3.48 3.48 0 0 0-2.5 1.07A3.48 3.48 0 0 0 7.5 6 3.5 3.5 0 0 0 4 9.5V16h3z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 5. FACEBOOK (Official Blue with 'f')
  if (normalized.includes("facebook") || normalized.includes("فيسبوك") || normalized.includes("fb")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={cn(currentSizeClass, "text-[#1877f2] shrink-0", className)}
        aria-label="Facebook"
        {...props}
      >
        <rect width="24" height="24" rx="6" fill="#1877f2" />
        <path
          d="M13.5 20v-6.5h2.2l.33-2.5h-2.53V9.4c0-.73.2-1.22 1.24-1.22H16V5.94c-.23-.03-1.02-.1-1.95-.1-1.93 0-3.25 1.18-3.25 3.34V11H8.7v2.5h2.1V20h2.7z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 6. PHONE / DIRECT (Sky Blue with Phone Receiver)
  return (
    <div
      className={cn(
        currentSizeClass,
        "flex items-center justify-center rounded-md bg-[#0284c7] text-white shrink-0",
        className
      )}
      title="Phone Direct"
    >
      <PhoneCall className="size-[70%] stroke-[2.5]" />
    </div>
  );
}
