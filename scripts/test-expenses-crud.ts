import "dotenv/config";
import assert from "node:assert";
import { prisma } from "../src/lib/prisma";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  listExpenses,
  listExpenseTypes,
} from "../src/services/expenses";

async function testExpensesCRUD() {
  console.log("▶ Testing Owner & Manager Expense CRUD Workflows...");

  // 1. Find or create an Owner and Manager user for testing
  let owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        email: "test-owner-exp@sushi.local",
        name: "Test Owner Exp",
        role: "OWNER",
      },
    });
  }

  let manager = await prisma.user.findFirst({ where: { role: "MANAGER" } });
  if (!manager) {
    manager = await prisma.user.create({
      data: {
        email: "test-manager-exp@sushi.local",
        name: "Test Manager Exp",
        role: "MANAGER",
      },
    });
  }

  const types = await listExpenseTypes();
  assert.ok(types.length > 0, "Must have expense types available");
  const testTypeId = types[0].id;

  // 2. Owner creates an expense
  const createdByOwner = await createExpense(owner.id, {
    expenseTypeId: testTypeId,
    description: "فاتورة مياه تجريبية - أونر",
    quantity: 1,
    value: 250,
  });
  assert.ok(createdByOwner.id, "Owner must be able to create expense");
  assert.strictEqual(Number(createdByOwner.value), 250);
  console.log("✔ Owner created expense:", createdByOwner.id);

  // 3. Manager updates the expense
  const updatedByManager = await updateExpense(manager.id, createdByOwner.id, {
    description: "فاتورة مياه تجريبية - معدلة بواسطة المدير",
    value: 300,
    quantity: 2,
  });
  assert.strictEqual(Number(updatedByManager.value), 300);
  assert.strictEqual(updatedByManager.quantity, 2);
  assert.strictEqual(updatedByManager.description, "فاتورة مياه تجريبية - معدلة بواسطة المدير");
  console.log("✔ Manager updated expense value and quantity successfully");

  // 4. Verify in listExpenses
  const listResult = await listExpenses({ search: "معدلة بواسطة المدير" });
  assert.ok(listResult.expenses.some((e) => e.id === createdByOwner.id));
  console.log("✔ Expense found in search filters");

  // 5. Manager deletes the expense
  const deletedResult = await deleteExpense(manager.id, createdByOwner.id);
  assert.ok(deletedResult.success);
  console.log("✔ Manager deleted expense successfully");

  // 6. Verify expense is removed
  const verifyDeleted = await prisma.expense.findUnique({
    where: { id: createdByOwner.id },
  });
  assert.strictEqual(verifyDeleted, null, "Deleted expense must not exist");
  console.log("✔ Expense removal confirmed in database");

  console.log("🎉 Full Owner & Manager Expense CRUD verified 100%!");
}

testExpensesCRUD().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
