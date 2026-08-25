import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/logout-button";
import { Link } from "@/i18n/navigation";
import { requirePageUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requirePageUser();
  const t = await getTranslations({ locale, namespace: "roles" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-sm font-semibold">{tCommon("appName")}</span>
            <Badge variant="secondary">{t(user.role)}</Badge>
            <span className="truncate text-sm text-muted-foreground">{user.name}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              className="text-sm text-muted-foreground underline"
              href="/login"
              locale={locale === "ar" ? "en" : "ar"}
              hrefLang={locale === "ar" ? "en" : "ar"}
            >
              {tCommon("language")}
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
