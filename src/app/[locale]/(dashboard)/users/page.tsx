import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { listUsers } from "@/services/users";
import { UsersClient } from "@/components/users/users-client";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requirePageUser();
  if (user.role !== "OWNER" && user.role !== "MANAGER") {
    redirect("/");
  }

  const rawUsers = await listUsers(
    user.role === "MANAGER" ? { role: "CASHIER" } : undefined
  );
  const users = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <UsersClient
      currentUser={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
      initialUsers={users}
    />
  );
}
