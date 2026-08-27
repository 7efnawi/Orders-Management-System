import { setRequestLocale } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { DashboardHeader } from "@/components/layout/dashboard-header";
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

  return (
    <>
      <DashboardHeader user={user} locale={locale} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Toaster position="top-center" richColors />
    </>
  );
}
