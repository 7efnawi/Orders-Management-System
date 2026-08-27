import "dotenv/config";
import assert from "node:assert";
import { prisma } from "../src/lib/prisma";
import {
  createExpenseType,
  updateExpenseType,
  deleteExpenseType,
  createExpense,
} from "../src/services/expenses";

async function testExpenseTypesCrud() {
  console.log("▶ Testing Expense Types CRUD (Add, Rename, Delete) with Audit Log...");

  // 1. Get or create test owner user
  let owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        email: "test-owner-types@sushi.local",
        name: "Test Owner Types",
        role: "OWNER",
      },
    });
  }

  // 2. Create custom expense type
  const uniqueName = `نوع تجريبي ${Date.now()}`;
  const createdType = await createExpenseType(owner.id, uniqueName);
  assert.strictEqual(createdType.name, uniqueName, "Created type must match name");
  assert.strictEqual(createdType.isDefault, false, "Custom type must have isDefault=false");
  console.log("✔ createExpenseType successful:", createdType.name);

  // 3. Rename custom expense type
  const updatedName = `${uniqueName} - معدل`;
  const renamedType = await updateExpenseType(owner.id, createdType.id, updatedName);
  assert.strictEqual(renamedType.name, updatedName, "Renamed type must match new name");

  // Verify AuditLog for rename
  const auditUpdate = await prisma.auditLog.findFirst({
    where: {
      entityType: "ExpenseType",
      entityId: createdType.id,
      action: "UPDATE",
    },
    orderBy: { timestamp: "desc" },
  });
  assert.ok(auditUpdate, "AuditLog for ExpenseType UPDATE must exist");
  console.log("✔ updateExpenseType (Rename) successful with AuditLog.");

  // 4. Try deleting when an expense is linked (should fail safely)
  const linkedExpense = await createExpense(owner.id, {
    expenseTypeId: createdType.id,
    description: "مصروف تجريبي لاختبار منع الحذف",
    value: 50,
  });

  let threwExpected = false;
  try {
    await deleteExpenseType(owner.id, createdType.id);
  } catch (err: unknown) {
    threwExpected = true;
    const msg = err instanceof Error ? err.message : "";
    assert.ok(
      msg.includes("CANNOT_DELETE_EXPENSE_TYPE_IN_USE"),
      "Must throw CANNOT_DELETE_EXPENSE_TYPE_IN_USE when expenses exist"
    );
  }
  assert.ok(threwExpected, "Must not allow deleting expense type with linked expenses");
  console.log("✔ Deletion correctly blocked when expenses are associated.");

  // 5. Delete linked expense and then delete the expense type
  await prisma.expense.delete({ where: { id: linkedExpense.id } });
  const deletedResult = await deleteExpenseType(owner.id, createdType.id);
  assert.ok(deletedResult.success, "Deletion must succeed when no expenses linked");

  // Verify type no longer in DB
  const verifyDeleted = await prisma.expenseType.findUnique({
    where: { id: createdType.id },
  });
  assert.strictEqual(verifyDeleted, null, "Deleted expense type must be gone from DB");

  // Verify AuditLog for delete
  const auditDelete = await prisma.auditLog.findFirst({
    where: {
      entityType: "ExpenseType",
      entityId: createdType.id,
      action: "CANCEL",
    },
    orderBy: { timestamp: "desc" },
  });
  assert.ok(auditDelete, "AuditLog for ExpenseType CANCEL must exist");
  console.log("✔ deleteExpenseType successful with AuditLog.");

  console.log("🎉 All Expense Types CRUD tests PASSED 100%!");
}

testExpenseTypesCrud()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
