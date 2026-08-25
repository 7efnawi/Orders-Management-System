import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePageUser } from "@/lib/auth";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requirePageUser();
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-bold">{t("welcome", { name: user.name })}</h1>
      <p className="text-muted-foreground">Phase 2 — Authentication &amp; Roles ✓</p>
    </main>
  );
}
