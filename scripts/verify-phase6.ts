import "dotenv/config";
import assert from "node:assert";
import { Prisma, Role, AuditAction } from "@prisma/client";
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
console.log("🚀 STARTING PHASE 6 AUTOMATED VERIFICATION & EXPENSE SUBSYSTEM VALIDATION");
console.log("================================================================================\n");

async function runPhase6Verification() {
  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: Check or Seed Lookup Users (Owner, Cashier) & Cleanup Previous Runs
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("📍 [Step 1/6] Checking & seeding test users and cleaning previous test runs...");

  const ownerUser = await prisma.user.upsert({
    where: { email: "owner-verify-phase6@sushi.local" },
    update: { role: Role.OWNER, isActive: true },
    create: {
      email: "owner-verify-phase6@sushi.local",
      name: "Phase 6 Verification Owner",
      role: Role.OWNER,
      isActive: true,
    },
  });

  const cashierUser = await prisma.user.upsert({
    where: { email: "cashier-verify-phase6@sushi.local" },
    update: { role: Role.CASHIER, isActive: true },
    create: {
      email: "cashier-verify-phase6@sushi.local",
      name: "Phase 6 Verification Cashier",
      role: Role.CASHIER,
      isActive: true,
    },
  });

  // Clean up any existing Phase 6 test expenses and custom types for clean test repeatability
  const testDescriptions = [
    "فاتورة كهرباء شهر 8",
    "شاي وقهوة للمطبخ",
    "صيانة طارئة للتكييف",
  ];
  const existingExpenses = await prisma.expense.findMany({
    where: {
      description: { in: testDescriptions },
    },
    select: { id: true },
  });

  if (existingExpenses.length > 0) {
    const expenseIds = existingExpenses.map((e) => e.id);
    await prisma.auditLog.deleteMany({
      where: { entityType: "Expense", entityId: { in: expenseIds } },
    });
    await prisma.expense.deleteMany({
      where: { id: { in: expenseIds } },
    });
  }

  const customTypeName = "صيانة أجهزة كمبيوتر";
  const existingCustomType = await prisma.expenseType.findUnique({
    where: { name: customTypeName },
  });
  if (existingCustomType) {
    // Delete any dependent expenses and audit logs
    const customTypeExpenses = await prisma.expense.findMany({
      where: { expenseTypeId: existingCustomType.id },
      select: { id: true },
    });
    if (customTypeExpenses.length > 0) {
      const ids = customTypeExpenses.map((e) => e.id);
      await prisma.auditLog.deleteMany({
        where: { entityType: "Expense", entityId: { in: ids } },
      });
      await prisma.expense.deleteMany({
        where: { id: { in: ids } },
      });
    }
    await prisma.auditLog.deleteMany({
      where: { entityType: "ExpenseType", entityId: existingCustomType.id },
    });
    await prisma.expenseType.delete({
      where: { id: existingCustomType.id },
    });
  }

  console.log(`✓ Test users ready: Owner (${ownerUser.email}), Cashier (${cashierUser.email})`);
  console.log(`✓ Test workspace cleaned and ready for deterministic execution`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2: Verify Standard 20 Default Expense Categories
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 2/6] Verifying standard 20 preset expense categories...");

  const newlySeeded = await seedDefaultExpenseTypes();
  const allTypes = await listExpenseTypes();

  assert.ok(allTypes.length >= 20, `Expected at least 20 expense categories, found ${allTypes.length}`);

  for (const expectedName of DEFAULT_EXPENSE_TYPES) {
    const found = allTypes.find((t) => t.name === expectedName);
    assert.ok(found, `Default expense type "${expectedName}" must exist in the database`);
    assert.strictEqual(found.isDefault, true, `Default expense type "${expectedName}" must have isDefault = true`);
  }

  console.log(`✓ Standard 20 preset categories verified (newly seeded count: ${newlySeeded}, total in DB: ${allTypes.length})`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3: Owner Creates Custom Expense Type & Verifies AuditLog
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 3/6] Owner creating custom expense type ('صيانة أجهزة كمبيوتر') & verifying audit...");

  const customType = await createExpenseType(ownerUser.id, customTypeName);

  assert.ok(customType.id, "Custom expense type ID must be generated");
  assert.strictEqual(customType.name, customTypeName, "Custom type name must match");
  assert.strictEqual(customType.isDefault, false, "Custom type must have isDefault = false");
  assert.strictEqual(customType.createdBy, ownerUser.id, "Creator must match Owner user ID");

  // Verify AuditLog for ExpenseType creation
  const typeAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: "ExpenseType",
      entityId: customType.id,
      action: AuditAction.CREATE,
    },
  });

  assert.ok(typeAudit, "AuditLog CREATE record must exist for custom expense type");
  assert.strictEqual(typeAudit.userId, ownerUser.id, "AuditLog userId must be the Owner's ID");
  const auditNewValue = typeAudit.newValue as { name: string; isDefault: boolean; createdBy: string };
  assert.strictEqual(auditNewValue.name, customTypeName);
  assert.strictEqual(auditNewValue.isDefault, false);
  assert.strictEqual(auditNewValue.createdBy, ownerUser.id);

  console.log(`✓ Custom expense type created successfully (ID: ${customType.id}, isDefault: false, Owner: ${ownerUser.name})`);
  console.log(`✓ Atomic AuditLog CREATE logged and verified for custom expense type`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 4: Cashier Records Expense 1 and Expense 2 & Verifies AuditLogs
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 4/6] Cashier recording Expense 1 ('كهرباء') & Expense 2 ('مشروبات')...");

  const electricityType = allTypes.find((t) => t.name === "كهرباء");
  assert.ok(electricityType, "Category 'كهرباء' must exist in seeded categories");

  const drinksType = allTypes.find((t) => t.name === "مشروبات");
  assert.ok(drinksType, "Category 'مشروبات' must exist in seeded categories");

  const todayStr = new Date().toISOString().split("T")[0];

  // Record Expense 1
  const expense1 = await createExpense(cashierUser.id, {
    expenseTypeId: electricityType.id,
    description: "فاتورة كهرباء شهر 8",
    quantity: 1,
    value: 1500,
    date: todayStr,
  });

  assert.ok(expense1.id, "Expense 1 ID must be generated");
  assert.strictEqual(expense1.expenseTypeId, electricityType.id);
  assert.strictEqual(expense1.description, "فاتورة كهرباء شهر 8");
  assert.strictEqual(expense1.quantity, 1);
  assert.strictEqual(Number(expense1.value), 1500);
  assert.ok(expense1.value instanceof Prisma.Decimal, "Expense value must be stored as Decimal");
  assert.strictEqual(expense1.createdBy, cashierUser.id);

  // Check AuditLog for Expense 1
  const auditExp1 = await prisma.auditLog.findFirst({
    where: {
      entityType: "Expense",
      entityId: expense1.id,
      action: AuditAction.CREATE,
    },
  });
  assert.ok(auditExp1, "AuditLog CREATE must exist for Expense 1");
  assert.strictEqual(auditExp1.userId, cashierUser.id);
  const exp1AuditVal = auditExp1.newValue as { value: number; description: string; quantity: number };
  assert.strictEqual(exp1AuditVal.value, 1500);
  assert.strictEqual(exp1AuditVal.description, "فاتورة كهرباء شهر 8");
  assert.strictEqual(exp1AuditVal.quantity, 1);

  // Record Expense 2
  const expense2 = await createExpense(cashierUser.id, {
    expenseTypeId: drinksType.id,
    description: "شاي وقهوة للمطبخ",
    quantity: 2,
    value: 120,
    date: todayStr,
  });

  assert.ok(expense2.id, "Expense 2 ID must be generated");
  assert.strictEqual(expense2.expenseTypeId, drinksType.id);
  assert.strictEqual(expense2.description, "شاي وقهوة للمطبخ");
  assert.strictEqual(expense2.quantity, 2);
  assert.strictEqual(Number(expense2.value), 120);
  assert.ok(expense2.value instanceof Prisma.Decimal, "Expense 2 value must be stored as Decimal");
  assert.strictEqual(expense2.createdBy, cashierUser.id);

  // Check AuditLog for Expense 2
  const auditExp2 = await prisma.auditLog.findFirst({
    where: {
      entityType: "Expense",
      entityId: expense2.id,
      action: AuditAction.CREATE,
    },
  });
  assert.ok(auditExp2, "AuditLog CREATE must exist for Expense 2");
  assert.strictEqual(auditExp2.userId, cashierUser.id);
  const exp2AuditVal = auditExp2.newValue as { value: number; description: string; quantity: number };
  assert.strictEqual(exp2AuditVal.value, 120);
  assert.strictEqual(exp2AuditVal.description, "شاي وقهوة للمطبخ");
  assert.strictEqual(exp2AuditVal.quantity, 2);

  console.log(`✓ Expense 1 recorded: 'كهرباء' - 1500 EGP (Decimal), AuditLog CREATE logged`);
  console.log(`✓ Expense 2 recorded: 'مشروبات' - 120 EGP (Qty: 2), AuditLog CREATE logged`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 5: Test listExpenses Filtering & Aggregation
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 5/6] Testing listExpenses with date, category, search filters & aggregation...");

  // 1. Filter by Date
  const dateFiltered = await listExpenses({ date: todayStr });
  assert.ok(dateFiltered.totalCount >= 2, "Date filter should return at least 2 expenses");
  assert.ok(dateFiltered.totalAmount >= 1620, "Total amount for date should be at least 1620 (1500 + 120)");
  assert.ok(dateFiltered.expenses.some((e) => e.id === expense1.id), "Expense 1 must be present in date filter");
  assert.ok(dateFiltered.expenses.some((e) => e.id === expense2.id), "Expense 2 must be present in date filter");

  // 2. Filter by Category ('كهرباء')
  const categoryFiltered = await listExpenses({
    date: todayStr,
    expenseTypeId: electricityType.id,
  });
  assert.strictEqual(categoryFiltered.totalCount, 1, "Only 1 expense should match 'كهرباء' on test date");
  assert.strictEqual(categoryFiltered.totalAmount, 1500, "Total amount should match 1500 EGP");
  assert.strictEqual(categoryFiltered.expenses[0].id, expense1.id);

  // 3. Search Filter ('شاي وقهوة')
  const searchFiltered = await listExpenses({
    search: "شاي وقهوة",
  });
  assert.ok(searchFiltered.totalCount >= 1, "Search filter must return at least 1 matching expense");
  const foundSearch = searchFiltered.expenses.find((e) => e.id === expense2.id);
  assert.ok(foundSearch, "Expense 2 must be returned by search query 'شاي وقهوة'");

  // 4. Combined Filter (Category + Search mismatch check)
  const noMatchFiltered = await listExpenses({
    expenseTypeId: electricityType.id,
    search: "مشروبات غير موجودة",
  });
  assert.strictEqual(noMatchFiltered.totalCount, 0, "No matching expenses should return 0 count");
  assert.strictEqual(noMatchFiltered.totalAmount, 0, "No matching expenses should return 0 amount");

  console.log(`✓ Date filtering verified: totalCount >= 2, totalAmount >= 1620 EGP`);
  console.log(`✓ Category filtering verified: 'كهرباء' returned 1 expense (1500 EGP)`);
  console.log(`✓ Search filtering verified: 'شاي وقهوة' matched Expense 2`);
  console.log(`✓ Aggregations (totalAmount & totalCount) are accurate across all filter combinations`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 6: Owner Updates & Deletes Expense 2 with Full Audit Verification
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 6/6] Owner updates Expense 2 (value: 150) and deletes it with AuditLog verification...");

  // Update Expense 2: value 120 -> 150
  const updatedExp2 = await updateExpense(ownerUser.id, expense2.id, {
    value: 150,
  });

  assert.strictEqual(Number(updatedExp2.value), 150, "Updated expense value must be 150");
  assert.strictEqual(updatedExp2.id, expense2.id);

  // Verify AuditLog for UPDATE
  const updateAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: "Expense",
      entityId: expense2.id,
      action: AuditAction.UPDATE,
    },
    orderBy: { timestamp: "desc" },
  });

  assert.ok(updateAudit, "AuditLog UPDATE must exist for Expense 2");
  assert.strictEqual(updateAudit.userId, ownerUser.id, "AuditLog userId must be the Owner's ID");
  const oldVal = updateAudit.oldValue as { value: number };
  const newVal = updateAudit.newValue as { value: number };
  assert.strictEqual(oldVal.value, 120, "AuditLog oldValue.value must be 120");
  assert.strictEqual(newVal.value, 150, "AuditLog newValue.value must be 150");

  console.log(`✓ Expense 2 updated: value 120 -> 150 EGP`);
  console.log(`✓ AuditLog UPDATE verified: oldValue = 120, newValue = 150 (by Owner)`);

  // Delete Expense 2
  const deleteRes = await deleteExpense(ownerUser.id, expense2.id);
  assert.strictEqual(deleteRes.success, true);
  assert.strictEqual(deleteRes.id, expense2.id);

  // Verify deletion from DB
  const exp2AfterDelete = await getExpenseById(expense2.id);
  assert.strictEqual(exp2AfterDelete, null, "Expense 2 must no longer exist in the database");

  // Verify AuditLog for CANCEL
  const cancelAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: "Expense",
      entityId: expense2.id,
      action: AuditAction.CANCEL,
    },
    orderBy: { timestamp: "desc" },
  });

  assert.ok(cancelAudit, "AuditLog CANCEL must exist for deleted Expense 2");
  assert.strictEqual(cancelAudit.userId, ownerUser.id, "AuditLog userId must be the Owner's ID");
  const cancelOldVal = cancelAudit.oldValue as { value: number; description: string };
  assert.strictEqual(cancelOldVal.value, 150, "AuditLog oldValue before deletion must capture last state (150 EGP)");

  console.log(`✓ Expense 2 deleted successfully and confirmed removed from DB`);
  console.log(`✓ AuditLog CANCEL verified: captured final state and Owner user ID`);

  console.log("\n================================================================================");
  console.log("🎉 ALL PHASE 6 EXPENSE SUBSYSTEM VERIFICATION TESTS PASSED 100% (6/6)!");
  console.log("================================================================================\n");
}

runPhase6Verification()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\n❌ Phase 6 Verification FAILED:\n", err);
    await prisma.$disconnect();
    process.exit(1);
  });
