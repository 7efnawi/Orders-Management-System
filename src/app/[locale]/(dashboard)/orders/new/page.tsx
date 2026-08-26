import { setRequestLocale } from "next-intl/server";
import { requirePageUser } from "@/lib/auth";
import { OrderForm } from "@/components/orders/order-form";
import { listBrands } from "@/services/menu";
import {
  listPlatforms,
  listDeliveryZones,
  listDeliveryDrivers,
} from "@/services/lookups";

export default async function NewOrderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requirePageUser();

  const [brands, platforms, zones, drivers] = await Promise.all([
    listBrands(),
    listPlatforms(),
    listDeliveryZones(),
    listDeliveryDrivers(),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-muted/20 pb-12">
      <OrderForm
        userRole={user.role}
        initialBrands={brands}
        initialPlatforms={platforms}
        initialZones={zones}
        initialDrivers={drivers}
      />
    </div>
  );
}
