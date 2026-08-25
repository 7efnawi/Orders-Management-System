import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (user) redirect("/");

  const t = await getTranslations("common");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <LoginForm />
      <Link
        className="text-sm text-muted-foreground underline"
        href="/login"
        locale={locale === "ar" ? "en" : "ar"}
        hrefLang={locale === "ar" ? "en" : "ar"}
      >
        {t("language")}
      </Link>
    </main>
  );
}
