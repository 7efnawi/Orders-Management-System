import { setRequestLocale } from "next-intl/server";
import { requirePageUser } from "@/lib/auth";
import { OrdersTable } from "@/components/orders/orders-table";
import { listBrands } from "@/services/menu";
import { listPlatforms } from "@/services/lookups";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requirePageUser();

  const [brands, platforms] = await Promise.all([
    listBrands(),
    listPlatforms(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col p-4 sm:p-6 lg:p-8">
      <OrdersTable
        userRole={user.role}
        initialBrands={brands}
        initialPlatforms={platforms}
      />
    </div>
  );
}
