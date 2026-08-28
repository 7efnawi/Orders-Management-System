import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { getReportsData } from "@/services/reports";
import { listBrands } from "@/services/menu";
import { listPlatforms } from "@/services/lookups";
import { ReportsClient } from "@/components/reports/reports-client";
import { Role } from "@prisma/client";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requirePageUser();
  if (user.role === Role.CASHIER) {
    redirect(`/${locale}/orders`);
  }

  const [initialData, brands, platforms] = await Promise.all([
    getReportsData(),
    listBrands(),
    listPlatforms(),
  ]);

  return (
    <ReportsClient
      initialData={initialData}
      brands={brands}
      platforms={platforms}
      userRole={user.role}
    />
  );
}
