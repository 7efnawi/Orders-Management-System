import "dotenv/config";
import assert from "node:assert";
import {
  Role,
  OrderStatus,
  PaymentMethod,
  DriverType,
  CancelReason,
  AuditAction,
} from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import {
  getCurrentOpenShift,
  openShift,
  getShiftPreview,
  closeShift,
  listDailyClosings,
  getDailyClosingById,
} from "../src/services/closing";
import { createOrder, transitionOrderStatus } from "../src/services/orders";
import {
  seedDefaultExpenseTypes,
  listExpenseTypes,
  createExpense,
} from "../src/services/expenses";

console.log("================================================================================");
console.log("🚀 STARTING PHASE 7 AUTOMATED VERIFICATION & SHIFT CLOSING SUBSYSTEM VALIDATION");
console.log("================================================================================\n");

async function runPhase7Verification() {
  const testCashierEmail = "cashier-verify-phase7@sushi.local";
  const testBrandName = "Phase 7 Verification Brand";
  const testPlatformName = "Phase 7 Direct Platform";
  const testZone1Name = "Phase 7 Zone Maadi";
  const testZone2Name = "Phase 7 Zone Zamalek";

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: Setup & Seed Lookup Dependencies (Cashier, Brand, Products, Zones, Drivers)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("📍 [Step 1/8] Setting up test dependencies (Cashier, Brand, Products, Platform, Zones, Driver)...");

  // 1. Cashier User
  const cashierUser = await prisma.user.upsert({
    where: { email: testCashierEmail },
    update: { role: Role.CASHIER, isActive: true },
    create: {
      email: testCashierEmail,
      name: "Phase 7 Verification Cashier",
      role: Role.CASHIER,
      isActive: true,
    },
  });

  // Clean any open shifts or prior test data for this cashier
  const openShifts = await prisma.shift.findMany({
    where: { cashierId: cashierUser.id, closedAt: null },
  });
  for (const s of openShifts) {
    await prisma.shift.update({
      where: { id: s.id },
      data: { closedAt: new Date() },
    });
  }

  // 2. Brand & Category
  const brand = await prisma.brand.upsert({
    where: { name: testBrandName },
    update: { isActive: true },
    create: { name: testBrandName, isActive: true },
  });

  const category = await prisma.category.upsert({
    where: { id: "cat-verify-phase7" },
    update: { isActive: true, brandId: brand.id },
    create: {
      id: "cat-verify-phase7",
      name: "Phase 7 Special Rolls",
      brandId: brand.id,
      isActive: true,
    },
  });

  // 3. Products:
  // Product 1: 100 EGP
  // Product 2: 100 EGP
  // Product 3: 50 EGP
  const product1 = await prisma.product.upsert({
    where: { id: "prod-verify-phase7-1" },
    update: { isActive: true, price: 100, categoryId: category.id },
    create: {
      id: "prod-verify-phase7-1",
      name: "Salmon Philadelphia Roll (P7)",
      price: 100,
      categoryId: category.id,
      isActive: true,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { id: "prod-verify-phase7-2" },
    update: { isActive: true, price: 100, categoryId: category.id },
    create: {
      id: "prod-verify-phase7-2",
      name: "Crispy Shrimp Roll (P7)",
      price: 100,
      categoryId: category.id,
      isActive: true,
    },
  });

  const product3 = await prisma.product.upsert({
    where: { id: "prod-verify-phase7-3" },
    update: { isActive: true, price: 50, categoryId: category.id },
    create: {
      id: "prod-verify-phase7-3",
      name: "Spicy Tuna Nigiri (P7)",
      price: 50,
      categoryId: category.id,
      isActive: true,
    },
  });

  // 4. Platform
  const platform = await prisma.platform.upsert({
    where: { name: testPlatformName },
    update: { isActive: true },
    create: { name: testPlatformName, isActive: true },
  });

  // 5. Delivery Zones (Zone 1: 30 EGP, Zone 2: 20 EGP)
  const zone1 = await prisma.deliveryZone.upsert({
    where: { name: testZone1Name },
    update: { fee: 30, isActive: true },
    create: { name: testZone1Name, fee: 30, isActive: true },
  });

  const zone2 = await prisma.deliveryZone.upsert({
    where: { name: testZone2Name },
    update: { fee: 20, isActive: true },
    create: { name: testZone2Name, fee: 20, isActive: true },
  });

  // 6. Delivery Driver (OWN driver type so zone fee is collected)
  const driver = await prisma.deliveryDriver.upsert({
    where: { id: "driver-verify-phase7" },
    update: { isActive: true, type: DriverType.OWN },
    create: {
      id: "driver-verify-phase7",
      name: "Phase 7 Verification Driver",
      type: DriverType.OWN,
      isActive: true,
    },
  });

  // 7. Expense Types
  await seedDefaultExpenseTypes();
  const expenseTypes = await listExpenseTypes();
  const drinksExpenseType = expenseTypes.find((t) => t.name === "مشروبات");
  const cleaningExpenseType = expenseTypes.find((t) => t.name === "أدوات نظافة");

  assert.ok(drinksExpenseType, "Category 'مشروبات' must exist");
  assert.ok(cleaningExpenseType, "Category 'أدوات نظافة' must exist");

  console.log(`✓ Test entities initialized: Cashier (${cashierUser.name}), Brand, 3 Products, 2 Zones, Driver, Expense Types`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2: Open Shift for Cashier & Verify Shift + AuditLog
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 2/8] Cashier opening a new shift & verifying atomic AuditLog...");

  const openShiftInitial = await getCurrentOpenShift(cashierUser.id);
  assert.strictEqual(openShiftInitial, null, "Cashier should not have any open shift initially");

  const openedShift = await openShift(cashierUser.id);
  assert.ok(openedShift.id, "Opened shift must have an ID");
  assert.strictEqual(openedShift.cashierId, cashierUser.id);
  assert.strictEqual(openedShift.closedAt, null, "Newly opened shift must have closedAt = null");
  assert.ok(openedShift.openedAt instanceof Date, "openedAt must be a valid Date");
  assert.strictEqual(openedShift.cashier.email, cashierUser.email);

  // Verify AuditLog for Shift CREATE
  const shiftAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: "Shift",
      entityId: openedShift.id,
      action: AuditAction.CREATE,
    },
  });

  assert.ok(shiftAudit, "AuditLog for Shift CREATE must exist");
  assert.strictEqual(shiftAudit.userId, cashierUser.id, "Shift AuditLog userId must be cashier ID");
  const auditNew = shiftAudit.newValue as { cashierId: string; openedAt: string };
  assert.strictEqual(auditNew.cashierId, cashierUser.id);

  console.log(`✓ Shift opened successfully (ID: ${openedShift.id}, OpenedAt: ${openedShift.openedAt.toISOString()})`);
  console.log(`✓ Atomic AuditLog CREATE verified for Shift`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3: Verify Duplicate Active Shift Guard (SHIFT_ALREADY_OPEN)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 3/8] Testing duplicate active shift prevention guard...");

  await assert.rejects(
    async () => {
      await openShift(cashierUser.id);
    },
    (err: Error) => {
      assert.ok(
        err.message.includes("SHIFT_ALREADY_OPEN"),
        `Expected SHIFT_ALREADY_OPEN error, got: ${err.message}`
      );
      return true;
    }
  );

  console.log(`✓ Duplicate shift prevention guard verified (threw SHIFT_ALREADY_OPEN)`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 4: Cashier Creates Shift Orders
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 4/8] Cashier creating shift orders (Order 1: Cash 230, Order 2: Visa 120, Order 3: Cancelled)...");

  // Order 1: Cash payment, 2 products (2 x 100 = 200), Zone 1 fee 30 -> Total = 230
  const order1 = await createOrder(
    { id: cashierUser.id, role: Role.CASHIER },
    {
      platformId: platform.id,
      brandId: brand.id,
      customer: {
        name: "عميل كاش المرحلة 7",
        phone: "01011112222",
        address: "المعادي، القاهرة",
      },
      zoneId: zone1.id,
      driverId: driver.id,
      paymentMethod: PaymentMethod.CASH,
      items: [
        { productId: product1.id, quantity: 2 },
      ],
    }
  );

  assert.strictEqual(Number(order1.subtotal), 200);
  assert.strictEqual(Number(order1.deliveryFee), 30);
  assert.strictEqual(Number(order1.discount), 0);
  assert.strictEqual(order1.paymentMethod, PaymentMethod.CASH);
  assert.strictEqual(order1.cashierId, cashierUser.id);

  // Order 2: Visa payment, 1 product (1 x 100 = 100), Zone 2 fee 20 -> Total = 120
  const order2 = await createOrder(
    { id: cashierUser.id, role: Role.CASHIER },
    {
      platformId: platform.id,
      brandId: brand.id,
      customer: {
        name: "عميل فيزا المرحلة 7",
        phone: "01033334444",
        address: "الزمالك، القاهرة",
      },
      zoneId: zone2.id,
      driverId: driver.id,
      paymentMethod: PaymentMethod.VISA,
      items: [
        { productId: product2.id, quantity: 1 },
      ],
    }
  );

  assert.strictEqual(Number(order2.subtotal), 100);
  assert.strictEqual(Number(order2.deliveryFee), 20);
  assert.strictEqual(Number(order2.discount), 0);
  assert.strictEqual(order2.paymentMethod, PaymentMethod.VISA);
  assert.strictEqual(order2.cashierId, cashierUser.id);

  // Order 3: Cash payment, 1 product (1 x 50 = 50), then cancelled
  const order3 = await createOrder(
    { id: cashierUser.id, role: Role.CASHIER },
    {
      platformId: platform.id,
      brandId: brand.id,
      customer: {
        name: "عميل ملغي المرحلة 7",
        phone: "01055556666",
        address: "الدقي، الجيزة",
      },
      paymentMethod: PaymentMethod.CASH,
      items: [
        { productId: product3.id, quantity: 1 },
      ],
    }
  );

  assert.strictEqual(Number(order3.subtotal), 50);
  assert.strictEqual(order3.status, OrderStatus.NEW);

  // Cancel Order 3
  const cancelledOrder3 = await transitionOrderStatus(
    cashierUser.id,
    order3.id,
    OrderStatus.CANCELLED,
    CancelReason.CUSTOMER_CHANGED_MIND
  );
  assert.strictEqual(cancelledOrder3.status, OrderStatus.CANCELLED);

  console.log(`✓ Order 1 created: CASH - Subtotal 200 + ZoneFee 30 = 230 EGP (Order: ${order1.orderNumber})`);
  console.log(`✓ Order 2 created: VISA - Subtotal 100 + ZoneFee 20 = 120 EGP (Order: ${order2.orderNumber})`);
  console.log(`✓ Order 3 created: CASH - Subtotal 50, then CANCELLED (Order: ${order3.orderNumber})`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 5: Cashier Records Expenses
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 5/8] Cashier recording shift expenses (Expense 1: 'مشروبات' 40, Expense 2: 'أدوات نظافة' 30)...");

  const todayStr = new Date().toISOString().split("T")[0];

  const expense1 = await createExpense(cashierUser.id, {
    expenseTypeId: drinksExpenseType.id,
    description: "مشروبات وضيافة الوردية",
    quantity: 1,
    value: 40,
    date: todayStr,
  });
  assert.strictEqual(Number(expense1.value), 40);

  const expense2 = await createExpense(cashierUser.id, {
    expenseTypeId: cleaningExpenseType.id,
    description: "أدوات نظافة للمطبخ والصالة",
    quantity: 1,
    value: 30,
    date: todayStr,
  });
  assert.strictEqual(Number(expense2.value), 30);

  console.log(`✓ Expense 1 recorded: 'مشروبات' - 40 EGP (ID: ${expense1.id})`);
  console.log(`✓ Expense 2 recorded: 'أدوات نظافة' - 30 EGP (ID: ${expense2.id})`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 6: Test Live Shift Preview (getShiftPreview)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 6/8] Verifying live shift financial preview (getShiftPreview)...");

  const preview = await getShiftPreview(openedShift.id);

  assert.strictEqual(preview.shift.id, openedShift.id);
  assert.strictEqual(preview.ordersCount, 3, "Total orders in shift preview must be 3");
  assert.strictEqual(preview.expensesCount, 2, "Total expenses in shift preview must be 2");

  // Summary figures verification:
  assert.strictEqual(preview.summary.totalOrders, 3, "totalOrders must be 3");
  assert.strictEqual(preview.summary.cancelledOrders, 1, "cancelledOrders must be 1");
  assert.strictEqual(preview.summary.activeOrders, 2, "activeOrders must be 2");
  assert.strictEqual(preview.summary.totalCash, 230, "totalCash must be 230 (Order 1)");
  assert.strictEqual(preview.summary.totalVisa, 120, "totalVisa must be 120 (Order 2)");
  assert.strictEqual(preview.summary.totalOnline, 0, "totalOnline must be 0");
  assert.strictEqual(preview.summary.totalDeliveryFees, 50, "totalDeliveryFees must be 50 (30 + 20)");
  assert.strictEqual(preview.summary.totalExpenses, 70, "totalExpenses must be 70 (40 + 30)");
  assert.strictEqual(preview.summary.netCash, 160, "netCash must be 160 (230 - 70)");

  console.log("✓ Live shift preview matches exact financial snapshot:");
  console.log(`  - Total Orders: ${preview.summary.totalOrders} (Active: ${preview.summary.activeOrders}, Cancelled: ${preview.summary.cancelledOrders})`);
  console.log(`  - Total Cash: ${preview.summary.totalCash} EGP`);
  console.log(`  - Total Visa: ${preview.summary.totalVisa} EGP`);
  console.log(`  - Total Delivery Fees: ${preview.summary.totalDeliveryFees} EGP`);
  console.log(`  - Total Expenses: ${preview.summary.totalExpenses} EGP`);
  console.log(`  - Net Cash Drawer: ${preview.summary.netCash} EGP (230 - 70 = 160)`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 7: Cashier Closes Shift & Verify DailyClosing and AuditLog
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 7/8] Cashier closing shift with notes & verifying DailyClosing record and AuditLog...");

  const closingNotes = "تم مطابقة الخزنة ولا يوجد عجز";
  const closeResult = await closeShift(cashierUser.id, openedShift.id, closingNotes);

  // Verify Shift update
  assert.ok(closeResult.shift.closedAt instanceof Date, "Shift.closedAt must be populated");
  assert.strictEqual(closeResult.shift.id, openedShift.id);

  // Verify DailyClosing record
  const closing = closeResult.closing;
  assert.ok(closing.id, "DailyClosing ID must be generated");
  assert.strictEqual(closing.shiftId, openedShift.id);
  assert.strictEqual(closing.totalOrders, 3);
  assert.strictEqual(closing.cancelledOrders, 1);
  assert.strictEqual(Number(closing.totalCash), 230);
  assert.strictEqual(Number(closing.totalVisa), 120);
  assert.strictEqual(Number(closing.totalOnline), 0);
  assert.strictEqual(Number(closing.totalDeliveryFees), 50);
  assert.strictEqual(Number(closing.totalExpenses), 70);
  assert.strictEqual(Number(closing.netCash), 160);
  assert.strictEqual(closing.notes, closingNotes);

  // Verify AuditLog for DailyClosing CREATE
  const closingAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: "DailyClosing",
      entityId: closing.id,
      action: AuditAction.CREATE,
    },
  });

  assert.ok(closingAudit, "AuditLog for DailyClosing CREATE must exist");
  assert.strictEqual(closingAudit.userId, cashierUser.id);
  const auditClosingVal = closingAudit.newValue as {
    shiftId: string;
    totalCash: number;
    totalExpenses: number;
    netCash: number;
    totalOrders: number;
  };
  assert.strictEqual(auditClosingVal.shiftId, openedShift.id);
  assert.strictEqual(auditClosingVal.totalCash, 230);
  assert.strictEqual(auditClosingVal.totalExpenses, 70);
  assert.strictEqual(auditClosingVal.netCash, 160);
  assert.strictEqual(auditClosingVal.totalOrders, 3);

  // Verify shift is closed and cannot be reclosed
  const openShiftAfter = await getCurrentOpenShift(cashierUser.id);
  assert.strictEqual(openShiftAfter, null, "Cashier must have no open shift after closing");

  await assert.rejects(
    async () => {
      await closeShift(cashierUser.id, openedShift.id);
    },
    /SHIFT_ALREADY_CLOSED/
  );

  console.log(`✓ Shift closed successfully (ClosedAt: ${closeResult.shift.closedAt?.toISOString()})`);
  console.log(`✓ DailyClosing record persisted with exact snapshot (NetCash: ${closing.netCash} EGP, Notes: "${closing.notes}")`);
  console.log(`✓ Atomic AuditLog CREATE verified for DailyClosing`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 8: Test listDailyClosings & getDailyClosingById Queries
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 8/8] Testing historical closings queries (listDailyClosings & getDailyClosingById)...");

  // 1. Query by closing ID
  const fetchedClosing = await getDailyClosingById(closing.id);
  assert.ok(fetchedClosing, "getDailyClosingById must return the closing");
  assert.strictEqual(fetchedClosing.id, closing.id);
  assert.strictEqual(fetchedClosing.shift.cashier.id, cashierUser.id);
  assert.strictEqual(Number(fetchedClosing.netCash), 160);
  assert.strictEqual(fetchedClosing.notes, closingNotes);

  // 2. Query list filtered by cashier
  const listByCashier = await listDailyClosings({ cashierId: cashierUser.id });
  assert.ok(listByCashier.totalCount >= 1, "listDailyClosings must return at least 1 record for cashier");
  const foundInList = listByCashier.closings.find((c) => c.id === closing.id);
  assert.ok(foundInList, "Closed record must appear in listDailyClosings");
  assert.strictEqual(Number(foundInList.totalCash), 230);
  assert.strictEqual(Number(foundInList.totalExpenses), 70);
  assert.strictEqual(Number(foundInList.netCash), 160);

  // 3. Query list filtered by date
  const listByDate = await listDailyClosings({ date: todayStr });
  assert.ok(listByDate.totalCount >= 1, "listDailyClosings by date must return at least 1 record");
  assert.ok(listByDate.closings.some((c) => c.id === closing.id), "Closing must appear in date-filtered list");

  console.log(`✓ Historical closings query returned matching record (Total count: ${listByCashier.totalCount})`);
  console.log(`✓ Single closing detail fetch verified with cashier relation and exact figures`);

  // ─────────────────────────────────────────────────────────────────────────────
  // Clean Up Test Data
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n🧹 Cleaning up test orders, expenses, and closing records...");

  const testOrderIds = [order1.id, order2.id, order3.id];
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { entityType: "Order", entityId: { in: testOrderIds } },
        { entityType: "Expense", entityId: { in: [expense1.id, expense2.id] } },
        { entityType: "Shift", entityId: openedShift.id },
        { entityType: "DailyClosing", entityId: closing.id },
      ],
    },
  });

  await prisma.orderItem.deleteMany({
    where: { orderId: { in: testOrderIds } },
  });
  await prisma.order.deleteMany({
    where: { id: { in: testOrderIds } },
  });
  await prisma.expense.deleteMany({
    where: { id: { in: [expense1.id, expense2.id] } },
  });
  await prisma.dailyClosing.deleteMany({
    where: { id: closing.id },
  });
  await prisma.shift.deleteMany({
    where: { id: openedShift.id },
  });

  console.log("✓ Test database cleanup completed successfully");

  console.log("\n================================================================================");
  console.log("🎉 ALL PHASE 7 SHIFT & CLOSING VERIFICATION TESTS PASSED 100% (8/8)!");
  console.log("================================================================================\n");
}

runPhase7Verification()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\n❌ Phase 7 Verification FAILED:\n", err);
    await prisma.$disconnect();
    process.exit(1);
  });
