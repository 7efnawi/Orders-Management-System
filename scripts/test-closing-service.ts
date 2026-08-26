import "dotenv/config";
import assert from "node:assert";
import { Role, OrderStatus, PaymentMethod, AuditAction } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import {
  getCurrentOpenShift,
  openShift,
  getShiftPreview,
  closeShift,
  listDailyClosings,
  getDailyClosingById,
} from "../src/services/closing";

console.log("================================================================================");
console.log("🚀 STARTING SHIFT & DAILY CLOSING SERVICE LAYER VERIFICATION TESTS");
console.log("================================================================================\n");

async function runClosingServiceTests() {
  const testAdminEmail = "admin-closing-test@sushi.local";
  const testCashierEmail = "cashier-closing-test@sushi.local";

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: Unit Validation Tests (Input validation & guards)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("📍 [Step 1/5] Testing input validations and invalid parameters...");

  // getCurrentOpenShift: empty cashierId
  await assert.rejects(
    async () => {
      await getCurrentOpenShift("   ");
    },
    /INVALID_USER_ID/
  );

  // openShift: empty cashierId
  await assert.rejects(
    async () => {
      await openShift("");
    },
    /INVALID_USER_ID/
  );

  // openShift: non-existent cashier user
  await assert.rejects(
    async () => {
      await openShift("00000000-0000-0000-0000-000000000000");
    },
    /NOT_FOUND/
  );

  // getShiftPreview: empty shiftId
  await assert.rejects(
    async () => {
      await getShiftPreview("");
    },
    /INVALID_SHIFT_ID/
  );

  // getShiftPreview: non-existent shift
  await assert.rejects(
    async () => {
      await getShiftPreview("00000000-0000-0000-0000-000000000000");
    },
    /NOT_FOUND/
  );

  // closeShift: empty userId or shiftId
  await assert.rejects(
    async () => {
      await closeShift("", "shift-id");
    },
    /INVALID_USER_ID/
  );

  await assert.rejects(
    async () => {
      await closeShift("user-id", "");
    },
    /INVALID_SHIFT_ID/
  );

  // closeShift: non-existent shift
  await assert.rejects(
    async () => {
      await closeShift("user-id", "00000000-0000-0000-0000-000000000000");
    },
    /NOT_FOUND/
  );

  console.log("✓ All basic input validations and guards passed!");

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2: Test Data Setup (Users, Brand, Products, Customer, Driver, Expense Type)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 2/5] Setting up test database entities...");

  const userAdmin = await prisma.user.upsert({
    where: { email: testAdminEmail },
    update: { role: Role.OWNER, isActive: true },
    create: {
      email: testAdminEmail,
      name: "Closing Test Admin",
      role: Role.OWNER,
      isActive: true,
    },
  });

  const userCashier = await prisma.user.upsert({
    where: { email: testCashierEmail },
    update: { role: Role.CASHIER, isActive: true },
    create: {
      email: testCashierEmail,
      name: "Closing Test Cashier",
      role: Role.CASHIER,
      isActive: true,
    },
  });

  // Ensure test cashier has no leftover open shifts from prior aborted tests
  const priorOpenShifts = await prisma.shift.findMany({
    where: { cashierId: userCashier.id, closedAt: null },
  });
  for (const s of priorOpenShifts) {
    await prisma.shift.update({
      where: { id: s.id },
      data: { closedAt: new Date() },
    });
  }

  const testBrand = await prisma.brand.upsert({
    where: { name: "Test Brand Closing" },
    update: { isActive: true },
    create: { name: "Test Brand Closing", isActive: true },
  });

  const testPlatform = await prisma.platform.upsert({
    where: { name: "Test Direct Closing" },
    update: { isActive: true },
    create: { name: "Test Direct Closing", isActive: true },
  });

  const testCustomer = await prisma.customer.upsert({
    where: { phone: "01099998888" },
    update: { isActive: true },
    create: {
      name: "Closing Test Customer",
      phone: "01099998888",
      address: "123 Test St",
      isActive: true,
    },
  });

  const testCategory = await prisma.category.upsert({
    where: { id: "cat-test-closing" },
    update: { isActive: true },
    create: {
      id: "cat-test-closing",
      name: "Rolls Test",
      brandId: testBrand.id,
      isActive: true,
    },
  });

  const testProduct = await prisma.product.upsert({
    where: { id: "prod-test-closing" },
    update: { isActive: true, price: 150 },
    create: {
      id: "prod-test-closing",
      name: "Test Sushi Roll",
      price: 150,
      categoryId: testCategory.id,
      isActive: true,
    },
  });

  const testExpenseType = await prisma.expenseType.upsert({
    where: { name: "مصروف تجريبي شيفت" },
    update: {},
    create: {
      name: "مصروف تجريبي شيفت",
      isDefault: false,
      createdBy: userAdmin.id,
    },
  });

  console.log("✓ Test database entities ready!");

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3: Shift Opening & Duplicate Guard Verification
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 3/5] Testing shift opening, active check, and duplicate guard...");

  const openShiftCheckBefore = await getCurrentOpenShift(userCashier.id);
  assert.strictEqual(openShiftCheckBefore, null, "Should not have any open shift initially");

  const openedShift = await openShift(userCashier.id);
  assert(openedShift.id, "Shift must have an ID");
  assert.strictEqual(openedShift.cashierId, userCashier.id);
  assert.strictEqual(openedShift.closedAt, null);
  assert(openedShift.openedAt instanceof Date);
  assert.strictEqual(openedShift.cashier.email, userCashier.email);

  // Check AuditLog for Shift CREATE
  const shiftAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: "Shift",
      entityId: openedShift.id,
      action: AuditAction.CREATE,
    },
  });
  assert(shiftAudit, "AuditLog for Shift CREATE must exist");
  assert.strictEqual(shiftAudit.userId, userCashier.id);

  // Check getCurrentOpenShift returns this shift
  const currentOpen = await getCurrentOpenShift(userCashier.id);
  assert(currentOpen, "getCurrentOpenShift must return the active shift");
  assert.strictEqual(currentOpen.id, openedShift.id);

  // Re-opening while one is open must fail with SHIFT_ALREADY_OPEN
  await assert.rejects(
    async () => {
      await openShift(userCashier.id);
    },
    /SHIFT_ALREADY_OPEN/
  );

  console.log("✓ Shift opening, active shift detection, and duplicate shift guard verified!");

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 4: Live Shift Activity (Orders & Expenses) and Preview Verification
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 4/5] Recording orders & expenses during shift and testing live preview...");

  // Order 1: Cash Order (Subtotal: 300, Discount: 50, DeliveryFee: 30 -> Total: 280)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: `ORD-TEST-CLS-01-${Date.now()}`,
      platformId: testPlatform.id,
      brandId: testBrand.id,
      customerId: testCustomer.id,
      cashierId: userCashier.id,
      status: OrderStatus.DELIVERED,
      paymentMethod: PaymentMethod.CASH,
      subtotal: 300,
      discount: 50,
      deliveryFee: 30,
      createdAt: new Date(),
      items: {
        create: [
          {
            productId: testProduct.id,
            quantity: 2,
            unitPrice: 150,
            totalPrice: 300,
          },
        ],
      },
    },
  });

  // Order 2: Visa Order (Subtotal: 200, Discount: 0, DeliveryFee: 0 -> Total: 200)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: `ORD-TEST-CLS-02-${Date.now()}`,
      platformId: testPlatform.id,
      brandId: testBrand.id,
      customerId: testCustomer.id,
      cashierId: userCashier.id,
      status: OrderStatus.DELIVERED,
      paymentMethod: PaymentMethod.VISA,
      subtotal: 200,
      discount: 0,
      deliveryFee: 0,
      createdAt: new Date(),
      items: {
        create: [
          {
            productId: testProduct.id,
            quantity: 1,
            unitPrice: 200,
            totalPrice: 200,
          },
        ],
      },
    },
  });

  // Order 3: Cancelled Order (Subtotal: 150, Payment: CASH, Status: CANCELLED)
  const order3 = await prisma.order.create({
    data: {
      orderNumber: `ORD-TEST-CLS-03-${Date.now()}`,
      platformId: testPlatform.id,
      brandId: testBrand.id,
      customerId: testCustomer.id,
      cashierId: userCashier.id,
      status: OrderStatus.CANCELLED,
      paymentMethod: PaymentMethod.CASH,
      subtotal: 150,
      discount: 0,
      deliveryFee: 0,
      createdAt: new Date(),
      items: {
        create: [
          {
            productId: testProduct.id,
            quantity: 1,
            unitPrice: 150,
            totalPrice: 150,
          },
        ],
      },
    },
  });

  // Expense 1: Operational Expense during shift (Quantity: 1, Value: 80)
  const expense1 = await prisma.expense.create({
    data: {
      expenseTypeId: testExpenseType.id,
      description: "بنزين دليفري ومشتريات طارئة",
      quantity: 1,
      value: 80,
      date: new Date(),
      createdBy: userCashier.id,
      createdAt: new Date(),
    },
  });

  // Test Shift Preview
  const preview = await getShiftPreview(openedShift.id);
  assert.strictEqual(preview.shift.id, openedShift.id);
  assert.strictEqual(preview.ordersCount, 3);
  assert.strictEqual(preview.expensesCount, 1);
  assert.strictEqual(preview.summary.totalOrders, 3);
  assert.strictEqual(preview.summary.cancelledOrders, 1);
  assert.strictEqual(preview.summary.activeOrders, 2);
  assert.strictEqual(preview.summary.totalCash, 280); // (300 - 50 + 30)
  assert.strictEqual(preview.summary.totalVisa, 200);
  assert.strictEqual(preview.summary.totalOnline, 0);
  assert.strictEqual(preview.summary.totalDeliveryFees, 30);
  assert.strictEqual(preview.summary.totalExpenses, 80);
  assert.strictEqual(preview.summary.netCash, 200); // 280 - 80 = 200

  console.log("✓ Live shift orders & expenses recorded and preview summary verified!");
  console.log(`  - Active Orders: ${preview.summary.activeOrders}/${preview.summary.totalOrders}`);
  console.log(`  - Total Cash: ${preview.summary.totalCash} EGP`);
  console.log(`  - Total Visa: ${preview.summary.totalVisa} EGP`);
  console.log(`  - Total Expenses: ${preview.summary.totalExpenses} EGP`);
  console.log(`  - Net Cash: ${preview.summary.netCash} EGP`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 5: Shift Closing, DailyClosing Record & Historical Queries
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 5/5] Testing shift closing, DailyClosing creation, audit log & queries...");

  const closingNotes = "إغلاق الوردية الصباحية ومطابقة النقدية بنجاح";
  const closeResult = await closeShift(userCashier.id, openedShift.id, closingNotes);

  assert(closeResult.shift.closedAt instanceof Date);
  assert.strictEqual(closeResult.closing.shiftId, openedShift.id);
  assert.strictEqual(closeResult.closing.totalOrders, 3);
  assert.strictEqual(closeResult.closing.cancelledOrders, 1);
  assert.strictEqual(Number(closeResult.closing.totalCash), 280);
  assert.strictEqual(Number(closeResult.closing.totalVisa), 200);
  assert.strictEqual(Number(closeResult.closing.totalOnline), 0);
  assert.strictEqual(Number(closeResult.closing.totalDeliveryFees), 30);
  assert.strictEqual(Number(closeResult.closing.totalExpenses), 80);
  assert.strictEqual(Number(closeResult.closing.netCash), 200);
  assert.strictEqual(closeResult.closing.notes, closingNotes);

  // Check AuditLog for DailyClosing CREATE
  const closingAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: "DailyClosing",
      entityId: closeResult.closing.id,
      action: AuditAction.CREATE,
    },
  });
  assert(closingAudit, "AuditLog for DailyClosing CREATE must exist");
  assert.strictEqual(closingAudit.userId, userCashier.id);

  // Verify shift is no longer open
  const openShiftAfter = await getCurrentOpenShift(userCashier.id);
  assert.strictEqual(openShiftAfter, null, "Cashier must have no open shift after closing");

  // Attempting to close again must fail
  await assert.rejects(
    async () => {
      await closeShift(userCashier.id, openedShift.id);
    },
    /SHIFT_ALREADY_CLOSED/
  );

  // Test getDailyClosingById
  const fetchedClosing = await getDailyClosingById(closeResult.closing.id);
  assert(fetchedClosing, "getDailyClosingById must return the closing");
  assert.strictEqual(fetchedClosing.id, closeResult.closing.id);
  assert.strictEqual(fetchedClosing.shift.cashier.id, userCashier.id);

  // Test listDailyClosings with cashier filter
  const listResult = await listDailyClosings({ cashierId: userCashier.id });
  assert(listResult.totalCount >= 1, "Must list at least 1 closing");
  const foundClosing = listResult.closings.find((c) => c.id === closeResult.closing.id);
  assert(foundClosing, "Closed shift closing must appear in list");
  assert.strictEqual(Number(foundClosing.netCash), 200);

  console.log("✓ Shift closed atomically, DailyClosing recorded, audit logged, and history queried successfully!");

  // Clean up created test orders and expenses to keep DB clean
  await prisma.orderItem.deleteMany({
    where: { orderId: { in: [order1.id, order2.id, order3.id] } },
  });
  await prisma.order.deleteMany({
    where: { id: { in: [order1.id, order2.id, order3.id] } },
  });
  await prisma.expense.delete({ where: { id: expense1.id } });

  console.log("\n================================================================================");
  console.log("🎉 ALL SHIFT & CLOSING SERVICE LAYER TESTS PASSED SUCCESSFULLY! (5/5)");
  console.log("================================================================================");
}

runClosingServiceTests()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\n❌ Shift & Closing Service Layer Tests FAILED:\n", err);
    await prisma.$disconnect();
    process.exit(1);
  });
