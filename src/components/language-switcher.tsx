"use client";

// مهم: نسخة next-intl بترجّع المسار بدون prefix اللغة — نسخة next/navigation بتضاعفه
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

/** يبدّل اللغة مع الحفاظ على نفس الصفحة — بدل الرجوع لـ /login */
export function LanguageSwitcher({ locale }: { locale: string }) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const other = locale === "ar" ? "en" : "ar";

  return (
    <Link
      className="text-sm text-muted-foreground underline"
      href={pathname}
      locale={other}
      hrefLang={other}
      aria-label={t("language")}
    >
      {t("language")}
    </Link>
  );
}
