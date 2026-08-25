import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getSessionUser } from "@/lib/auth";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <LoginForm />
      <LanguageSwitcher locale={locale} />
    </main>
  );
}
