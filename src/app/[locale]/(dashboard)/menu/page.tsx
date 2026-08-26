import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { MenuClient } from "@/components/menu/menu-client";
import { requirePageUser } from "@/lib/auth";
import { listBrands } from "@/services/menu";

export default async function MenuPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requirePageUser();
  // المنيو Owner/Manager فقط — الكاشير يرجع للداشبورد (FR-MENU-05)
  if (user.role === "CASHIER") redirect("/");

  const brands = await listBrands();

  return <MenuClient brands={brands} canEdit />;
}
