import { setRequestLocale } from "next-intl/server";
import { ExpensesClient } from "@/components/expenses/expenses-client";
import { requirePageUser } from "@/lib/auth";
import { listExpenseTypes, listExpenses } from "@/services/expenses";

function formatDateToIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requirePageUser();

  // Current month default range for initial server-side render
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDate = formatDateToIso(firstOfMonth);
  const endDate = formatDateToIso(now);

  const [rawTypes, rawExpensesResult] = await Promise.all([
    listExpenseTypes(),
    listExpenses({ startDate, endDate }),
  ]);

  const initialTypes = rawTypes.map((t) => ({
    id: t.id,
    name: t.name,
    isDefault: t.isDefault,
    createdBy: t.createdBy,
  }));

  const initialExpenses = rawExpensesResult.expenses.map((e) => ({
    id: e.id,
    expenseTypeId: e.expenseTypeId,
    description: e.description,
    quantity: e.quantity,
    value: Number(e.value),
    date: e.date instanceof Date ? e.date.toISOString() : String(e.date),
    createdBy: e.createdBy,
    createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
    expenseType: {
      id: e.expenseType.id,
      name: e.expenseType.name,
      isDefault: e.expenseType.isDefault,
    },
    user: {
      id: e.user.id,
      name: e.user.name,
      role: e.user.role,
    },
  }));

  const canEdit = user.role === "OWNER" || user.role === "MANAGER";
  const canManageTypes = user.role === "OWNER" || user.role === "MANAGER";

  return (
    <ExpensesClient
      initialExpenses={initialExpenses}
      initialTypes={initialTypes}
      initialTotalAmount={rawExpensesResult.totalAmount}
      initialTotalCount={rawExpensesResult.totalCount}
      canEdit={canEdit}
      canManageTypes={canManageTypes}
      userRole={user.role}
    />
  );
}
