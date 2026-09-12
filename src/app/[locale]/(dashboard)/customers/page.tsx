import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { listCustomers } from "@/services/customers";
import { CustomersClient } from "@/components/customers/customers-client";

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requirePageUser();
  const allowedRoles = ["OWNER", "MANAGER", "CASHIER"];
  if (!allowedRoles.includes(user.role)) {
    redirect("/");
  }

  const initialData = await listCustomers({ page: 1, limit: 25 });

  // Safe serialization for Next.js App Router boundary
  const serialized = JSON.parse(JSON.stringify(initialData));

  return <CustomersClient initialData={serialized} />;
}
