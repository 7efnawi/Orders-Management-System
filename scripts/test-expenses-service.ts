import "dotenv/config";
import assert from "node:assert";
import { Role, AuditAction } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import {
  DEFAULT_EXPENSE_TYPES,
  seedDefaultExpenseTypes,
  listExpenseTypes,
  createExpenseType,
  createExpense,
  updateExpense,
  deleteExpense,
  listExpenses,
  getExpenseById,
} from "../src/services/expenses";

console.log("================================================================================");
console.log("🚀 STARTING EXPENSE SERVICE LAYER VERIFICATION TESTS");
console.log("================================================================================\n");

async function runExpenseServiceTests() {
  const testAdminId = "user-admin-test-expenses";
  const testCashierId = "user-cashier-test-expenses";

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: Unit Validation Tests (Input validation without relying on valid DB records)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("📍 [Step 1/4] Testing input validations for Expense Types & Expenses...");

  // Expense Type: empty name
  await assert.rejects(
    async () => {
      await createExpenseType(testAdminId, "   ");
    },
    /INVALID_NAME/
  );

  // Expense Type: empty userId
  await assert.rejects(
    async () => {
      await createExpenseType("", "Custom Category");
    },
    /INVALID_USER_ID/
  );

  // Expense: empty userId
  await assert.rejects(
    async () => {
      await createExpense("", {
        expenseTypeId: "et-1",
        description: "Test",
        value: 100,
      });
    },
    /INVALID_USER_ID/
  );

  // Expense: empty expenseTypeId
  await assert.rejects(
    async () => {
      await createExpense(testCashierId, {
        expenseTypeId: "",
        description: "Test",
        value: 100,
      });
    },
    /INVALID_EXPENSE_TYPE_ID/
  );

  // Expense: empty description
  await assert.rejects(
    async () => {
      await createExpense(testCashierId, {
        expenseTypeId: "et-1",
        description: "   ",
        value: 100,
      });
    },
    /INVALID_DESCRIPTION/
  );

  // Expense: invalid value (0 or negative)
  await assert.rejects(
    async () => {
      await createExpense(testCashierId, {
        expenseTypeId: "et-1",
        description: "Zero value test",
        value: 0,
      });
    },
    /INVALID_VALUE/
  );

  await assert.rejects(
    async () => {
      await createExpense(testCashierId, {
        expenseTypeId: "et-1",
        description: "Negative value test",
        value: -50,
      });
    },
    /INVALID_VALUE/
  );

  // Expense: invalid quantity (< 1 or float)
  await assert.rejects(
    async () => {
      await createExpense(testCashierId, {
        expenseTypeId: "et-1",
        description: "Zero quantity test",
        quantity: 0,
        value: 50,
      });
    },
    /INVALID_QUANTITY/
  );

  await assert.rejects(
    async () => {
      await createExpense(testCashierId, {
        expenseTypeId: "et-1",
        description: "Fractional quantity test",
        quantity: 1.5,
        value: 50,
      });
    },
    /INVALID_QUANTITY/
  );

  // Expense: invalid date
  await assert.rejects(
    async () => {
      await createExpense(testCashierId, {
        expenseTypeId: "et-1",
        description: "Invalid date test",
        value: 50,
        date: "not-a-real-date",
      });
    },
    /INVALID_DATE/
  );

  // Update Expense: invalid fields
  await assert.rejects(
    async () => {
      await updateExpense("", "exp-1", { description: "New" });
    },
    /INVALID_USER_ID/
  );

  await assert.rejects(
    async () => {
      await updateExpense(testCashierId, "", { description: "New" });
    },
    /INVALID_EXPENSE_ID/
  );

  await assert.rejects(
    async () => {
      await updateExpense(testCashierId, "exp-1", { description: "   " });
    },
    /INVALID_DESCRIPTION/
  );

  await assert.rejects(
    async () => {
      await updateExpense(testCashierId, "exp-1", { value: -10 });
    },
    /INVALID_VALUE/
  );

  await assert.rejects(
    async () => {
      await updateExpense(testCashierId, "exp-1", { quantity: 0 });
    },
    /INVALID_QUANTITY/
  );

  // Delete Expense: missing arguments
  await assert.rejects(
    async () => {
      await deleteExpense("", "exp-1");
    },
    /INVALID_USER_ID/
  );

  await assert.rejects(
    async () => {
      await deleteExpense(testCashierId, "");
    },
    /INVALID_EXPENSE_ID/
  );

  console.log("✓ All unit validations passed successfully!");

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2: Database Setup & Seed Default Expense Types
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 2/4] Setting up test users & seeding default expense types...");

  const userAdmin = await prisma.user.upsert({
    where: { email: "admin-expenses-test@sushi.local" },
    update: { role: Role.OWNER, isActive: true },
    create: {
      email: "admin-expenses-test@sushi.local",
      name: "Expenses Test Admin",
      role: Role.OWNER,
      isActive: true,
    },
  });

  const userCashier = await prisma.user.upsert({
    where: { email: "cashier-expenses-test@sushi.local" },
    update: { role: Role.CASHIER, isActive: true },
    create: {
      email: "cashier-expenses-test@sushi.local",
      name: "Expenses Test Cashier",
      role: Role.CASHIER,
      isActive: true,
    },
  });

  const seededCount = await seedDefaultExpenseTypes();
  console.log(`  - Seeded default expense types (newly inserted: ${seededCount})`);

  const allTypes = await listExpenseTypes();
  assert(allTypes.length >= 20, "Should have at least 20 default expense types");
  for (const defaultName of DEFAULT_EXPENSE_TYPES) {
    const found = allTypes.find((t) => t.name === defaultName);
    assert(found, `Default type "${defaultName}" must exist`);
    assert.strictEqual(found.isDefault, true, `Default type "${defaultName}" must have isDefault = true`);
  }
  console.log("✓ 20 default preset expense types verified in DB!");

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3: Custom Expense Type Creation & Duplicate Prevention
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 3/4] Testing custom expense type creation & audit logs...");

  const uniqueCustomTypeName = `مصروف مخصص تجريبي ${Date.now()}`;
  const customType = await createExpenseType(userAdmin.id, uniqueCustomTypeName);
  assert.strictEqual(customType.name, uniqueCustomTypeName);
  assert.strictEqual(customType.isDefault, false);
  assert.strictEqual(customType.createdBy, userAdmin.id);

  // Verify AuditLog for custom type creation
  const typeAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: "ExpenseType",
      entityId: customType.id,
      action: AuditAction.CREATE,
    },
  });
  assert(typeAudit, "AuditLog for ExpenseType CREATE must exist");
  assert.strictEqual(typeAudit.userId, userAdmin.id);

  // Duplicate rejection
  await assert.rejects(
    async () => {
      await createExpenseType(userAdmin.id, uniqueCustomTypeName);
    },
    /DUPLICATE_NAME/
  );
  console.log("✓ Custom expense type creation, duplicate guard, and audit log verified!");

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 4: Full Expense Lifecycle (Create, Query/Filter, Update, Delete, Audit)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 4/4] Testing Expense CRUD lifecycle, filters & audit logging...");

  // 1. Create Expense
  const testDate = "2026-08-26";
  const createdExpense = await createExpense(userCashier.id, {
    expenseTypeId: customType.id,
    description: "شراء مستلزمات طارئة",
    quantity: 2,
    value: 175.5,
    date: testDate,
  });

  assert.strictEqual(createdExpense.description, "شراء مستلزمات طارئة");
  assert.strictEqual(createdExpense.quantity, 2);
  assert.strictEqual(Number(createdExpense.value), 175.5);
  assert.strictEqual(createdExpense.createdBy, userCashier.id);
  assert.strictEqual(createdExpense.expenseTypeId, customType.id);

  // Check audit for CREATE
  const createAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: "Expense",
      entityId: createdExpense.id,
      action: AuditAction.CREATE,
    },
  });
  assert(createAudit, "AuditLog for Expense CREATE must exist");
  assert.strictEqual(createAudit.userId, userCashier.id);

  // 2. Query & Filter Expenses
  const fetchedById = await getExpenseById(createdExpense.id);
  assert(fetchedById, "getExpenseById must return the created expense");
  assert.strictEqual(fetchedById.id, createdExpense.id);

  const listResult = await listExpenses({
    date: testDate,
    expenseTypeId: customType.id,
  });
  assert(listResult.totalCount >= 1, "List result must contain at least 1 expense");
  assert(listResult.totalAmount >= 175.5, "Total amount aggregation must be accurate");
  const foundInList = listResult.expenses.find((e) => e.id === createdExpense.id);
  assert(foundInList, "Created expense must appear in filtered list");

  // Search filter
  const searchResult = await listExpenses({
    search: "مستلزمات طارئة",
  });
  assert(searchResult.expenses.some((e) => e.id === createdExpense.id), "Search filter must match description");

  // 3. Update Expense
  const updatedExpense = await updateExpense(userAdmin.id, createdExpense.id, {
    description: "شراء مستلزمات معدلة",
    value: 200,
    quantity: 3,
  });
  assert.strictEqual(updatedExpense.description, "شراء مستلزمات معدلة");
  assert.strictEqual(Number(updatedExpense.value), 200);
  assert.strictEqual(updatedExpense.quantity, 3);

  // Check audit for UPDATE
  const updateAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: "Expense",
      entityId: createdExpense.id,
      action: AuditAction.UPDATE,
    },
  });
  assert(updateAudit, "AuditLog for Expense UPDATE must exist");
  assert.strictEqual(updateAudit.userId, userAdmin.id);

  // 4. Delete Expense
  const deleteResult = await deleteExpense(userAdmin.id, createdExpense.id);
  assert.strictEqual(deleteResult.success, true);
  assert.strictEqual(deleteResult.id, createdExpense.id);

  const deletedCheck = await getExpenseById(createdExpense.id);
  assert.strictEqual(deletedCheck, null, "Expense should no longer exist after deletion");

  // Check audit for CANCEL / DELETE
  const deleteAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: "Expense",
      entityId: createdExpense.id,
      action: AuditAction.CANCEL,
    },
  });
  assert(deleteAudit, "AuditLog for Expense CANCEL/DELETE must exist");
  assert.strictEqual(deleteAudit.userId, userAdmin.id);

  console.log("✓ Full Expense CRUD lifecycle, filters, aggregation, and atomic audit logging verified!");

  console.log("\n================================================================================");
  console.log("🎉 ALL EXPENSE SERVICE LAYER TESTS PASSED SUCCESSFULLY! (4/4)");
  console.log("================================================================================");
}

runExpenseServiceTests()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\n❌ Expense Service Layer Tests FAILED:\n", err);
    await prisma.$disconnect();
    process.exit(1);
  });
