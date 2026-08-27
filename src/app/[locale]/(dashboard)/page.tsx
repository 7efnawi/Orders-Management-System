import { setRequestLocale } from "next-intl/server";
import { requirePageUser } from "@/lib/auth";
import { getDashboardOverview } from "@/services/orders";
import { DashboardOverviewClient } from "@/components/dashboard/dashboard-overview";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requirePageUser();
  const overview = await getDashboardOverview(user.id, user.role);

  return (
    <DashboardOverviewClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
      overview={overview}
    />
  );
}
