import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { DeliveryClient } from "@/components/delivery/delivery-client";
import { requirePageUser } from "@/lib/auth";
import { listDeliveryZones, listDeliveryDrivers } from "@/services/delivery";

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requirePageUser();
  // التوصيل Owner/Manager فقط — الكاشير يرجع للداشبورد (FR-DEL)
  if (user.role === "CASHIER") redirect("/");

  const [rawZones, rawDrivers] = await Promise.all([
    listDeliveryZones(true),
    listDeliveryDrivers(true),
  ]);

  const initialZones = rawZones.map((z) => ({
    id: z.id,
    name: z.name,
    fee: Number(z.fee),
    isActive: z.isActive,
  }));

  const initialDrivers = rawDrivers.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    isActive: d.isActive,
  }));

  return (
    <DeliveryClient
      initialZones={initialZones}
      initialDrivers={initialDrivers}
      canEdit={user.role === "OWNER" || user.role === "MANAGER"}
    />
  );
}
