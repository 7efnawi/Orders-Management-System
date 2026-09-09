import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { listAuditLogs, getAuditStats } from "@/services/audit";
import { prisma } from "@/lib/prisma";
import { AuditClient } from "@/components/audit/audit-client";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requirePageUser();
  if (user.role !== "OWNER") {
    redirect("/");
  }

  const [initialLogsData, initialStats, rawUsers] = await Promise.all([
    listAuditLogs({ page: 1, limit: 25 }),
    getAuditStats(),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AuditClient
      currentUser={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
      initialData={{
        ...initialLogsData,
        stats: initialStats,
      }}
      users={rawUsers}
    />
  );
}
