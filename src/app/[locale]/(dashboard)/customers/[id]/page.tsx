import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { getCustomerProfile } from "@/services/customers";
import { CustomerProfileClient } from "@/components/customers/customer-profile-client";

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await requirePageUser();
  const allowedRoles = ["OWNER", "MANAGER", "CASHIER"];
  if (!allowedRoles.includes(user.role)) {
    redirect("/");
  }

  const customer = await getCustomerProfile(id);
  if (!customer) {
    notFound();
  }

  // Safe serialization for Next.js App Router boundary
  const serialized = JSON.parse(JSON.stringify(customer));

  return <CustomerProfileClient customer={serialized} />;
}
