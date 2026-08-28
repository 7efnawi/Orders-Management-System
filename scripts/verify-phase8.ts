import "dotenv/config";
import assert from "node:assert";
import {
  Role,
  OrderStatus,
  PaymentMethod,
  DriverType,
  CancelReason,
  DiscountStatus,
} from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { getReportsData } from "../src/services/reports";
import { createOrder, transitionOrderStatus, decideDiscount } from "../src/services/orders";
import { openShift, closeShift } from "../src/services/closing";
import { createExpense, listExpenseTypes } from "../src/services/expenses";

console.log("================================================================================");
console.log("🚀 STARTING PHASE 8 AUTOMATED VERIFICATION & REPORTS SUBSYSTEM VALIDATION");
console.log("================================================================================\n");

async function runPhase8Verification() {
  const testManagerEmail = "manager-verify-phase8@sushi.local";
  const testCashierEmail = "cashier-verify-phase8@sushi.local";
  const testBrandName = "Phase 8 Verification Brand";
  const testCategoryName = "Phase 8 Category";
  const testPlatformName = "Phase 8 Talabat Platform";
  const testDriverName = "Phase 8 Captain Ahmed";
  const testZoneName = "Phase 8 Maadi Zone";

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: Setup & Seed Lookup Dependencies (Manager, Cashier, Brand, Products, Platform, Driver, Zone)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("📍 [Step 1/6] Setting up test dependencies (Users, Brand, Products, Platform, Driver, Zone)...");

  const managerUser = await prisma.user.upsert({
    where: { email: testManagerEmail },
    update: { role: Role.MANAGER, isActive: true },
    create: {
      email: testManagerEmail,
      name: "Phase 8 Verification Manager",
      role: Role.MANAGER,
      isActive: true,
    },
  });

  const cashierUser = await prisma.user.upsert({
    where: { email: testCashierEmail },
    update: { role: Role.CASHIER, isActive: true },
    create: {
      email: testCashierEmail,
      name: "Phase 8 Verification Cashier",
      role: Role.CASHIER,
      isActive: true,
    },
  });

  // Clean any prior test data
  const oldOrders = await prisma.order.findMany({
    where: {
      OR: [
        { brand: { name: testBrandName } },
        { platform: { name: testPlatformName } },
        { cashierId: { in: [managerUser.id, cashierUser.id] } },
      ],
    },
    select: { id: true },
  });
  if (oldOrders.length > 0) {
    const oldIds = oldOrders.map((o) => o.id);
    await prisma.auditLog.deleteMany({ where: { entityType: "Order", entityId: { in: oldIds } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: oldIds } } });
    await prisma.order.deleteMany({ where: { id: { in: oldIds } } });
  }
  await prisma.expense.deleteMany({
    where: { createdBy: { in: [managerUser.id, cashierUser.id] } },
  });

  // Clean any open shifts for cashier
  const openShifts = await prisma.shift.findMany({
    where: { cashierId: cashierUser.id, closedAt: null },
  });
  for (const s of openShifts) {
    await prisma.shift.update({
      where: { id: s.id },
      data: { closedAt: new Date() },
    });
  }

  const brand = await prisma.brand.upsert({
    where: { name: testBrandName },
    update: { isActive: true },
    create: { name: testBrandName, isActive: true },
  });

  const category = await prisma.category.upsert({
    where: { id: "cat-verify-phase8" },
    update: { name: testCategoryName, brandId: brand.id, isActive: true },
    create: { id: "cat-verify-phase8", name: testCategoryName, brandId: brand.id, isActive: true },
  });

  const product1 = await prisma.product.upsert({
    where: { id: "prod-verify-phase8-1" },
    update: { price: 100, categoryId: category.id, isActive: true },
    create: { id: "prod-verify-phase8-1", name: "Phase 8 Salmon Deluxe", price: 100, categoryId: category.id, isActive: true },
  });

  const product2 = await prisma.product.upsert({
    where: { id: "prod-verify-phase8-2" },
    update: { price: 50, categoryId: category.id, isActive: true },
    create: { id: "prod-verify-phase8-2", name: "Phase 8 Shrimp Crunch", price: 50, categoryId: category.id, isActive: true },
  });

  const product3 = await prisma.product.upsert({
    where: { id: "prod-verify-phase8-3" },
    update: { price: 80, categoryId: category.id, isActive: true },
    create: { id: "prod-verify-phase8-3", name: "Phase 8 Tuna Nigiri", price: 80, categoryId: category.id, isActive: true },
  });

  const platform = await prisma.platform.upsert({
    where: { name: testPlatformName },
    update: { isActive: true },
    create: { name: testPlatformName, isActive: true },
  });

  const driver = await prisma.deliveryDriver.upsert({
    where: { id: "driver-verify-phase8" },
    update: { name: testDriverName, type: DriverType.OWN, isActive: true },
    create: { id: "driver-verify-phase8", name: testDriverName, type: DriverType.OWN, isActive: true },
  });

  const zone = await prisma.deliveryZone.upsert({
    where: { name: testZoneName },
    update: { fee: 30, isActive: true },
    create: { name: testZoneName, fee: 30, isActive: true },
  });

  const expenseTypes = await listExpenseTypes();
  const testExpType = expenseTypes[0];

  console.log("  ✔ Dependencies setup complete.\n");

  const createdOrderIds: string[] = [];
  const createdExpenseIds: string[] = [];
  let shiftId: string | null = null;

  try {
    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 2: Open Shift & Create Test Orders with Different Statuses & Payments
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("📍 [Step 2/6] Creating test orders across lifecycles and payment methods...");

    const shift = await openShift(cashierUser.id);
    shiftId = shift.id;

  // Order 1: Delivered, Cash, Product1 (qty 2 = 200), Zone fee 30, Discount 20 (Approved). Net = 210
  const order1 = await createOrder(
    { id: cashierUser.id, role: Role.CASHIER },
    {
      brandId: brand.id,
      platformId: platform.id,
      customer: {
        name: "Phase 8 Customer 1",
        phone: "01011111111",
      },
      paymentMethod: PaymentMethod.CASH,
      zoneId: zone.id,
      driverId: driver.id,
      discount: 20,
      discountReason: "Loyalty VIP Promo",
      items: [{ productId: product1.id, quantity: 2 }],
    }
  );
  createdOrderIds.push(order1.id);
  await decideDiscount({ id: managerUser.id, role: Role.MANAGER }, order1.id, "APPROVED");
  await transitionOrderStatus(cashierUser.id, order1.id, OrderStatus.CONFIRMED);
  await transitionOrderStatus(cashierUser.id, order1.id, OrderStatus.PREPARING);
  await transitionOrderStatus(cashierUser.id, order1.id, OrderStatus.READY);
  await transitionOrderStatus(cashierUser.id, order1.id, OrderStatus.OUT_FOR_DELIVERY);
  await transitionOrderStatus(cashierUser.id, order1.id, OrderStatus.DELIVERED);

  // Order 2: Confirmed, Visa, Product2 (qty 1 = 50), Zone fee 30 (Driver OWN uses zone)
  const order2 = await createOrder(
    { id: cashierUser.id, role: Role.CASHIER },
    {
      brandId: brand.id,
      platformId: platform.id,
      customer: {
        name: "Phase 8 Customer 2",
        phone: "01022222222",
      },
      paymentMethod: PaymentMethod.VISA,
      zoneId: zone.id,
      driverId: driver.id,
      items: [{ productId: product2.id, quantity: 1 }],
    }
  );
  createdOrderIds.push(order2.id);
  await transitionOrderStatus(cashierUser.id, order2.id, OrderStatus.CONFIRMED);

  // Order 3: Ready, Online, Product3 (qty 1 = 80), no driver, pickup/direct (delivery fee 0)
  const order3 = await createOrder(
    { id: cashierUser.id, role: Role.CASHIER },
    {
      brandId: brand.id,
      platformId: platform.id,
      customer: {
        name: "Phase 8 Customer 3",
        phone: "01033333333",
      },
      paymentMethod: PaymentMethod.ONLINE,
      items: [{ productId: product3.id, quantity: 1 }],
    }
  );
  createdOrderIds.push(order3.id);
  await transitionOrderStatus(cashierUser.id, order3.id, OrderStatus.CONFIRMED);
  await transitionOrderStatus(cashierUser.id, order3.id, OrderStatus.PREPARING);
  await transitionOrderStatus(cashierUser.id, order3.id, OrderStatus.READY);

  // Order 4: Cancelled, Cash, Product2 (qty 2 = 100), fee 30 -> CANCELLED
  const order4 = await createOrder(
    { id: cashierUser.id, role: Role.CASHIER },
    {
      brandId: brand.id,
      platformId: platform.id,
      customer: {
        name: "Phase 8 Customer 4",
        phone: "01044444444",
      },
      paymentMethod: PaymentMethod.CASH,
      zoneId: zone.id,
      items: [{ productId: product2.id, quantity: 2 }],
    }
  );
  createdOrderIds.push(order4.id);
  await transitionOrderStatus(
    cashierUser.id,
    order4.id,
    OrderStatus.CANCELLED,
    CancelReason.CUSTOMER_CHANGED_MIND
  );

  console.log("  ✔ Created 4 test orders (1 Delivered, 1 Confirmed, 1 Ready, 1 Cancelled).\n");

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3: Record Test Expenses
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("📍 [Step 3/6] Recording shift expenses...");

  const exp1 = await createExpense(cashierUser.id, {
    expenseTypeId: testExpType.id,
    description: "Phase 8 Beverage stock",
    value: 40,
    quantity: 1,
  });
  createdExpenseIds.push(exp1.id);

  const exp2 = await createExpense(cashierUser.id, {
    expenseTypeId: testExpType.id,
    description: "Phase 8 Cleaning supplies",
    value: 30,
    quantity: 2, // 30 × 2 = 60
  });
  createdExpenseIds.push(exp2.id);

  console.log("  ✔ Recorded 2 test expenses (40 + 60 = 100).\n");

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 4: Query Reports Service & Verify Aggregations
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("📍 [Step 4/6] Executing getReportsData and verifying financial metrics...");

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const report = await getReportsData({
    startDate: todayStr,
    endDate: todayStr,
    brandId: brand.id,
    platformId: platform.id,
  });

  // Verify Summary
  console.log("  🔍 Verifying Sales Summary:");
  assert.strictEqual(report.summary.totalOrders, 4, "Total orders must be 4");
  assert.strictEqual(report.summary.cancelledOrders, 1, "Cancelled orders must be 1");
  assert.strictEqual(report.summary.activeOrders, 3, "Active non-cancelled orders must be 3");
  assert.strictEqual(report.summary.deliveredOrders, 1, "Delivered orders must be 1");

  // Expected Gross Sales = O1(200) + O2(50) + O3(80) = 330 (Cancelled O4 is excluded)
  assert.strictEqual(report.summary.grossSales, 330, "Gross sales must exclude cancelled orders (expected 330)");
  assert.strictEqual(report.summary.totalDiscounts, 20, "Total discounts must be 20");
  assert.strictEqual(report.summary.totalDeliveryFees, 60, "Total delivery fees must be O1(30) + O2(30) = 60");
  
  // Net Revenue = 330 - 20 + 60 = 370
  assert.strictEqual(report.summary.netRevenue, 370, "Net revenue must be 370");
  assert.strictEqual(report.summary.cashTotal, 210, "Cash total must be 200 - 20 + 30 = 210");
  assert.strictEqual(report.summary.visaTotal, 80, "Visa total must be 50 + 30 = 80");
  assert.strictEqual(report.summary.onlineTotal, 80, "Online total must be 80");
  assert.strictEqual(report.summary.aov, Math.round((370 / 3) * 100) / 100, "AOV must be 370 / 3");

  console.log("  ✔ Sales Summary matched exact penny figures.");

  // Verify Matrix
  console.log("  🔍 Verifying Platform × Brand Matrix:");
  assert.ok(report.platformBrand.length >= 1, "Platform×Brand matrix must have records");
  const pbRow = report.platformBrand.find(
    (r) => r.platformName === testPlatformName && r.brandName === testBrandName
  );
  assert.ok(pbRow, "Matching Platform×Brand row must exist");
  assert.strictEqual(pbRow.orders, 3, "Platform×Brand row orders count must be 3");
  assert.strictEqual(pbRow.sales, 370, "Platform×Brand row sales must be 370");
  console.log("  ✔ Platform×Brand matrix verified.");

  // Verify Driver Cash Collection
  console.log("  🔍 Verifying Courier Cash Collection:");
  const ahmedRow = report.driverCash.find((r) => r.driverId === driver.id);
  assert.ok(ahmedRow, "Driver Ahmed row must exist in courier cash report");
  assert.strictEqual(ahmedRow.totalOrders, 2, "Driver Ahmed must have 2 assigned orders (O1 and O2)");
  assert.strictEqual(ahmedRow.cashOrders, 1, "Driver Ahmed must have 1 cash order (O1)");
  assert.strictEqual(ahmedRow.cashCollected, 210, "Driver Ahmed cash collected must be 210");

  const unassignedRow = report.driverCash.find((r) => r.driverId === null);
  assert.ok(unassignedRow, "Unassigned courier row must exist");
  assert.strictEqual(unassignedRow.totalOrders, 1, "Unassigned courier orders count must be 1 (O3)");
  assert.strictEqual(unassignedRow.cashOrders, 0, "Unassigned courier cash orders must be 0");
  console.log("  ✔ Courier cash collection report verified.");

  // Verify Top Products
  console.log("  🔍 Verifying Top Products:");
  assert.strictEqual(report.topProducts.length, 3, "Top products must contain 3 products (cancelled order items excluded)");
  const top1 = report.topProducts[0];
  assert.strictEqual(top1.productId, product1.id, "Top 1 product must be Salmon Deluxe (qty 2)");
  assert.strictEqual(top1.quantity, 2);
  assert.strictEqual(top1.revenue, 200);

  const prod2Row = report.topProducts.find((p) => p.productId === product2.id);
  assert.ok(prod2Row);
  assert.strictEqual(prod2Row.quantity, 1, "Product 2 quantity must be 1 (excluding cancelled order qty 2)");
  console.log("  ✔ Top products ranking verified.");

  // Verify Daily Breakdown
  console.log("  🔍 Verifying Daily Breakdown:");
  assert.ok(report.dailyBreakdown.length >= 1, "Daily breakdown must contain at least 1 day");
  const todayRow = report.dailyBreakdown.find((r) => r.date === todayStr);
  assert.ok(todayRow, "Today's breakdown row must exist");
  assert.strictEqual(todayRow.orders, 4);
  assert.strictEqual(todayRow.delivered, 1);
  assert.strictEqual(todayRow.cancelled, 1);
  assert.strictEqual(todayRow.sales, 370);
  assert.strictEqual(todayRow.deliveryFees, 60);
  console.log("  ✔ Daily breakdown verified.");

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 5: Close Shift
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 5/6] Closing test shift...");
  if (shiftId) {
    await closeShift(cashierUser.id, shiftId, "Phase 8 verification closing notes");
  }
  console.log("  ✔ Shift closed successfully.\n");
  } finally {
    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 6: Clean Up Test Artifacts
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("📍 [Step 6/6] Cleaning up test data...");

    // Delete AuditLogs for orders & shift
    await prisma.auditLog.deleteMany({
      where: {
        userId: { in: [managerUser.id, cashierUser.id] },
      },
    });

    // Delete DailyClosings & Shifts
    await prisma.dailyClosing.deleteMany({
      where: { shift: { cashierId: cashierUser.id } },
    });
    await prisma.shift.deleteMany({
      where: { cashierId: cashierUser.id },
    });

    // Delete OrderItems & Orders
    await prisma.orderItem.deleteMany({
      where: { orderId: { in: createdOrderIds } },
    });
    await prisma.order.deleteMany({
      where: { id: { in: createdOrderIds } },
    });

    // Delete Expenses
    await prisma.expense.deleteMany({
      where: { id: { in: createdExpenseIds } },
    });

    // Delete Products & Category & Brand
    await prisma.product.deleteMany({
      where: { id: { in: [product1.id, product2.id, product3.id] } },
    });
    await prisma.category.deleteMany({
      where: { id: category.id },
    });
    await prisma.brand.deleteMany({
      where: { id: brand.id },
    });

    // Delete Platform, Driver, Zone, Users
    await prisma.platform.deleteMany({ where: { id: platform.id } });
    await prisma.deliveryDriver.deleteMany({ where: { id: driver.id } });
    await prisma.deliveryZone.deleteMany({ where: { id: zone.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [managerUser.id, cashierUser.id] } },
    });

    console.log("  ✔ Cleanup completed successfully.\n");
  }

  console.log("================================================================================");
  console.log("🎉 ALL PHASE 8 REPORTS SUBSYSTEM VERIFICATION TESTS PASSED 100%!");
  console.log("================================================================================\n");
}

runPhase8Verification()
  .catch((err) => {
    console.error("❌ Phase 8 Verification failed:", err);
    process.exit(1);
  });
