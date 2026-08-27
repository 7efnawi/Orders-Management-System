/**
 * Visual Tokens — Single Source of Truth
 * Brands, Platforms, and Loyalty Tiers for Sushi Dark Kitchen Order Control System.
 */

export interface BrandVisualToken {
  name: string;
  labelAr: string;
  labelEn: string;
  kanji: string;
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  ringClass: string;
}

export interface PlatformVisualToken {
  name: string;
  labelAr: string;
  labelEn: string;
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export type LoyaltyTier = "new" | "regular" | "vip" | "legend";

export interface LoyaltyTierInfo {
  tier: LoyaltyTier;
  labelAr: string;
  labelEn: string;
  colorClass: string;
  bgClass: string;
  iconName: string;
  minOrders: number;
}

export const BRAND_TOKENS: Record<string, BrandVisualToken> = {
  flower: {
    name: "Flower",
    labelAr: "فلاور سوشي",
    labelEn: "Flower Sushi",
    kanji: "花",
    hex: "#f472b6",
    bgClass: "bg-pink-500/10 dark:bg-pink-500/20",
    textClass: "text-pink-600 dark:text-pink-400",
    borderClass: "border-pink-300 dark:border-pink-700",
    ringClass: "ring-pink-400",
  },
  mastery: {
    name: "Mastery",
    labelAr: "ماستري سوشي",
    labelEn: "Mastery Sushi",
    kanji: "匠",
    hex: "#eab308",
    bgClass: "bg-amber-500/10 dark:bg-amber-500/20",
    textClass: "text-amber-600 dark:text-amber-400",
    borderClass: "border-amber-300 dark:border-amber-700",
    ringClass: "ring-amber-400",
  },
  niwa: {
    name: "Niwa",
    labelAr: "نيوا سوشي",
    labelEn: "Niwa Sushi",
    kanji: "庭",
    hex: "#10b981",
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
    textClass: "text-emerald-600 dark:text-emerald-400",
    borderClass: "border-emerald-300 dark:border-emerald-700",
    ringClass: "ring-emerald-400",
  },
  tobiko: {
    name: "Tobiko",
    labelAr: "توبيكو سوشي",
    labelEn: "Tobiko Sushi",
    kanji: "魚子",
    hex: "#f97316",
    bgClass: "bg-orange-500/10 dark:bg-orange-500/20",
    textClass: "text-orange-600 dark:text-orange-400",
    borderClass: "border-orange-300 dark:border-orange-700",
    ringClass: "ring-orange-400",
  },
};

export const PLATFORM_TOKENS: Record<string, PlatformVisualToken> = {
  talabat: {
    name: "Talabat",
    labelAr: "طلبات",
    labelEn: "Talabat",
    hex: "#ff5a00",
    bgClass: "bg-orange-500/10 dark:bg-orange-500/20",
    textClass: "text-orange-600 dark:text-orange-400",
    borderClass: "border-orange-300 dark:border-orange-700",
  },
  elmenus: {
    name: "elmenus",
    labelAr: "المنيوز",
    labelEn: "elmenus",
    hex: "#e21b1b",
    bgClass: "bg-red-500/10 dark:bg-red-500/20",
    textClass: "text-red-600 dark:text-red-400",
    borderClass: "border-red-300 dark:border-red-700",
  },
  instashop: {
    name: "InstaShop",
    labelAr: "إنستاشوب",
    labelEn: "InstaShop",
    hex: "#00a699",
    bgClass: "bg-teal-500/10 dark:bg-teal-500/20",
    textClass: "text-teal-600 dark:text-teal-400",
    borderClass: "border-teal-300 dark:border-teal-700",
  },
  harryapp: {
    name: "HarryApp",
    labelAr: "هاري آب",
    labelEn: "HarryApp",
    hex: "#be123c",
    bgClass: "bg-rose-500/10 dark:bg-rose-500/20",
    textClass: "text-rose-600 dark:text-rose-400",
    borderClass: "border-rose-300 dark:border-rose-700",
  },
  facebook: {
    name: "Facebook",
    labelAr: "فيسبوك",
    labelEn: "Facebook",
    hex: "#1877f2",
    bgClass: "bg-blue-500/10 dark:bg-blue-500/20",
    textClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-300 dark:border-blue-700",
  },
  phone: {
    name: "Phone",
    labelAr: "تليفون مباشر",
    labelEn: "Direct Phone",
    hex: "#0284c7",
    bgClass: "bg-sky-500/10 dark:bg-sky-500/20",
    textClass: "text-sky-600 dark:text-sky-400",
    borderClass: "border-sky-300 dark:border-sky-700",
  },
};

export const DEFAULT_BRAND_TOKEN: BrandVisualToken = {
  name: "Sushi Dark Kitchen",
  labelAr: "مطبخ سوشي",
  labelEn: "Sushi Kitchen",
  kanji: "鮨",
  hex: "#71717a",
  bgClass: "bg-muted",
  textClass: "text-muted-foreground",
  borderClass: "border-border",
  ringClass: "ring-muted",
};

export const DEFAULT_PLATFORM_TOKEN: PlatformVisualToken = {
  name: "Direct",
  labelAr: "مباشر",
  labelEn: "Direct Order",
  hex: "#71717a",
  bgClass: "bg-muted",
  textClass: "text-muted-foreground",
  borderClass: "border-border",
};

/**
 * Resolves a brand name to its visual token with localized labels, Kanji glyph, and color themes.
 */
export function getBrandToken(brandName?: string | null): BrandVisualToken {
  if (!brandName) return DEFAULT_BRAND_TOKEN;
  const key = brandName.trim().toLowerCase();
  if (!key) return DEFAULT_BRAND_TOKEN;

  if (key.includes("flower") || key.includes("فلاور")) return BRAND_TOKENS.flower;
  if (key.includes("mastery") || key.includes("ماستري")) return BRAND_TOKENS.mastery;
  if (key.includes("niwa") || key.includes("نيوا")) return BRAND_TOKENS.niwa;
  if (key.includes("tobiko") || key.includes("توبيكو")) return BRAND_TOKENS.tobiko;

  for (const [k, token] of Object.entries(BRAND_TOKENS)) {
    if (key.includes(k)) return token;
  }

  return {
    ...DEFAULT_BRAND_TOKEN,
    name: brandName.trim(),
    labelAr: brandName.trim(),
    labelEn: brandName.trim(),
  };
}

/**
 * Resolves a platform name to its visual token with brand hex colors and localized labels.
 */
export function getPlatformToken(platformName?: string | null): PlatformVisualToken {
  if (!platformName) return DEFAULT_PLATFORM_TOKEN;
  const key = platformName.trim().toLowerCase();
  if (!key) return DEFAULT_PLATFORM_TOKEN;

  if (key.includes("talabat") || key.includes("طلبات")) return PLATFORM_TOKENS.talabat;
  if (key.includes("elmenus") || key.includes("المنيوز") || key.includes("menus")) return PLATFORM_TOKENS.elmenus;
  if (
    key.includes("instashop") ||
    key.includes("انستاشوب") ||
    key.includes("إنستاشوب") ||
    key.includes("انستا شوب") ||
    key.includes("إنستا شوب")
  ) {
    return PLATFORM_TOKENS.instashop;
  }
  if (
    key.includes("harryapp") ||
    key.includes("هاري اب") ||
    key.includes("هاري آب") ||
    key.includes("harry")
  ) {
    return PLATFORM_TOKENS.harryapp;
  }
  if (
    key.includes("facebook") ||
    key.includes("فيسبوك") ||
    key.includes("فيس بوك") ||
    key.includes("فيس") ||
    key.includes("fb")
  ) {
    return PLATFORM_TOKENS.facebook;
  }
  if (
    key.includes("phone") ||
    key.includes("تليفون") ||
    key.includes("مباشر") ||
    key.includes("direct") ||
    key.includes("هاتف")
  ) {
    return PLATFORM_TOKENS.phone;
  }

  for (const [k, token] of Object.entries(PLATFORM_TOKENS)) {
    if (key.includes(k)) return token;
  }

  return {
    ...DEFAULT_PLATFORM_TOKEN,
    name: platformName.trim(),
    labelAr: platformName.trim(),
    labelEn: platformName.trim(),
  };
}

/**
 * Calculates customer loyalty tier and badge metadata based on total order count.
 */
export function getLoyaltyTier(totalOrders: number | null | undefined): LoyaltyTierInfo {
  const count = Math.max(0, Math.floor(Number(totalOrders) || 0));

  if (count >= 20) {
    return {
      tier: "legend",
      labelAr: "أسطورة بلاتيني 💎",
      labelEn: "Platinum Legend 💎",
      colorClass: "text-purple-600 dark:text-purple-400",
      bgClass: "bg-purple-500/10 border-purple-300 dark:border-purple-700",
      iconName: "Crown",
      minOrders: 20,
    };
  }
  if (count >= 5) {
    return {
      tier: "vip",
      labelAr: "عميل ذهبي VIP 👑",
      labelEn: "Gold VIP 👑",
      colorClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-500/10 border-amber-300 dark:border-amber-700",
      iconName: "Star",
      minOrders: 5,
    };
  }
  if (count >= 1) {
    return {
      tier: "regular",
      labelAr: "عميل دائم 🍣",
      labelEn: "Regular Customer 🍣",
      colorClass: "text-blue-600 dark:text-blue-400",
      bgClass: "bg-blue-500/10 border-blue-300 dark:border-blue-700",
      iconName: "Smile",
      minOrders: 1,
    };
  }
  return {
    tier: "new",
    labelAr: "ضيف جديد 🆕",
    labelEn: "New Guest 🆕",
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted border-border",
    iconName: "UserPlus",
    minOrders: 0,
  };
}
