import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/logout-button";
import { LanguageSwitcher } from "@/components/language-switcher";
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
            <LanguageSwitcher locale={locale} />
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
