"use client";

// مهم: نسخة next-intl بترجّع المسار بدون prefix اللغة — نسخة next/navigation بتضاعفه
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** يبدّل اللغة مع الحفاظ على نفس الصفحة — بدل الرجوع لـ /login */
export function LanguageSwitcher({
  locale,
  className,
}: {
  locale: string;
  className?: string;
}) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const other = locale === "ar" ? "en" : "ar";

  return (
    <Link
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg px-3 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      href={pathname}
      locale={other}
      hrefLang={other}
      aria-label={t("language")}
    >
      {t("language")}
    </Link>
  );
}
