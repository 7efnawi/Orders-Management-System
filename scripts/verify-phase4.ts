import "dotenv/config";
import assert from "node:assert";
import {
  Prisma,
  Role,
  OrderStatus,
  PaymentMethod,
  CancelReason,
  DiscountStatus,
  AuditAction,
} from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import {
  createOrder,
  transitionOrderStatus,
  decideDiscount,
  listOrders,
  getOrderById,
} from "../src/services/orders";

console.log("================================================================================");
console.log("🚀 STARTING PHASE 4 AUTOMATED VERIFICATION & INTEGRATION TEST SUITE");
console.log("================================================================================\n");

async function runPhase4Verification() {
  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: Check or Seed Test Lookup Data
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("📍 [Step 1/8] Checking & seeding test lookup data...");

  // Seed / Upsert Brand
  const testBrand = await prisma.brand.upsert({
    where: { name: "Verification Brand Sushi" },
    update: { isActive: true },
    create: { name: "Verification Brand Sushi", isActive: true },
  });

  // Seed / Upsert Category
  let testCategory = await prisma.category.findFirst({
    where: { brandId: testBrand.id, name: "Verification Rolls" },
  });
  if (!testCategory) {
    testCategory = await prisma.category.create({
      data: {
        brandId: testBrand.id,
        name: "Verification Rolls",
        sortOrder: 1,
        isActive: true,
      },
    });
  }

  // Seed / Upsert Products
  let productA = await prisma.product.findFirst({
    where: { categoryId: testCategory.id, name: "Verification Dragon Roll" },
  });
  if (!productA) {
    productA = await prisma.product.create({
      data: {
        categoryId: testCategory.id,
        name: "Verification Dragon Roll",
        price: new Prisma.Decimal(120.0),
        isActive: true,
      },
    });
  }

  let productB = await prisma.product.findFirst({
    where: { categoryId: testCategory.id, name: "Verification California Roll" },
  });
  if (!productB) {
    productB = await prisma.product.create({
      data: {
        categoryId: testCategory.id,
        name: "Verification California Roll",
        price: new Prisma.Decimal(80.0),
        isActive: true,
      },
    });
  }

  // Seed / Upsert Platform
  const testPlatform = await prisma.platform.upsert({
    where: { name: "Verification Talabat" },
    update: { isActive: true },
    create: { name: "Verification Talabat", isActive: true },
  });

  // Seed / Upsert Delivery Zone
  const testZone = await prisma.deliveryZone.upsert({
    where: { name: "Verification Zone Maadi" },
    update: { fee: new Prisma.Decimal(25.0), isActive: true },
    create: { name: "Verification Zone Maadi", fee: new Prisma.Decimal(25.0), isActive: true },
  });

  // Seed / Upsert Cashier & Manager Users
  const cashierUser = await prisma.user.upsert({
    where: { email: "cashier-verify@sushi.local" },
    update: { role: Role.CASHIER, isActive: true },
    create: {
      email: "cashier-verify@sushi.local",
      name: "Verification Cashier",
      role: Role.CASHIER,
      isActive: true,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: "manager-verify@sushi.local" },
    update: { role: Role.MANAGER, isActive: true },
    create: {
      email: "manager-verify@sushi.local",
      name: "Verification Manager",
      role: Role.MANAGER,
      isActive: true,
    },
  });

  console.log(`✓ Lookup data ready: Brand=${testBrand.name}, Zone=${testZone.name}, Products=[${productA.name}, ${productB.name}], Cashier=${cashierUser.name}, Manager=${managerUser.name}`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2: Cashier creates Order A (2 Products, Zone Delivery Fee, Cash Payment)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 2/8] Cashier creates Order A with snapshot prices and zone fee...");

  const phoneCustomerA = "01099998877";
  const orderA = await createOrder(
    { id: cashierUser.id, role: cashierUser.role },
    {
      brandId: testBrand.id,
      platformId: testPlatform.id,
      zoneId: testZone.id,
      customer: {
        name: "Ahmed Verification",
        phone: phoneCustomerA,
        address: "Building 12, Road 9, Maadi",
      },
      items: [
        { productId: productA.id, quantity: 2 }, // 120 * 2 = 240
        { productId: productB.id, quantity: 1 }, // 80 * 1 = 80
      ],
      paymentMethod: PaymentMethod.CASH,
      notes: "Please deliver on 3rd floor",
    }
  );

  // Verifications on Order A
  assert.ok(orderA.id, "Order A ID must exist");
  assert.match(orderA.orderNumber, /^ORD-\d{8}-\d{4}$/, "Order number must follow ORD-YYYYMMDD-XXXX format");
  assert.strictEqual(orderA.status, OrderStatus.NEW, "Initial order status must be NEW");
  assert.strictEqual(Number(orderA.subtotal), 320, "Subtotal must be exactly 320.00");
  assert.strictEqual(Number(orderA.deliveryFee), 25, "Delivery fee must be 25.00 from zone");
  assert.strictEqual(Number(orderA.discount), 0, "Discount must be 0");
  assert.strictEqual(orderA.items.length, 2, "Order A must contain 2 line items");

  // Snapshot price validation
  const itemA1 = orderA.items.find((i) => i.productId === productA.id);
  const itemA2 = orderA.items.find((i) => i.productId === productB.id);
  assert.ok(itemA1 && itemA2, "Both products must be in OrderItem records");
  assert.strictEqual(Number(itemA1.unitPrice), 120, "Product A unitPrice must snapshot 120");
  assert.strictEqual(Number(itemA1.totalPrice), 240, "Product A totalPrice must snapshot 240");
  assert.strictEqual(Number(itemA2.unitPrice), 80, "Product B unitPrice must snapshot 80");
  assert.strictEqual(Number(itemA2.totalPrice), 80, "Product B totalPrice must snapshot 80");

  // AuditLog verification for Order A creation
  const createAuditA = await prisma.auditLog.findFirst({
    where: {
      entityType: "Order",
      entityId: orderA.id,
      action: AuditAction.CREATE,
    },
  });
  assert.ok(createAuditA, "AuditLog CREATE entry must exist for Order A");
  assert.strictEqual(createAuditA.userId, cashierUser.id, "AuditLog user must match cashier");

  console.log(`✓ Order A created successfully: ${orderA.orderNumber} (Subtotal: 320, DeliveryFee: 25, Total: 345)`);
  console.log(`✓ Immutable snapshot unit prices verified & AuditLog CREATE entry confirmed`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3: Order A Full Lifecycle Transitions & Timestamps
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 3/8] Advancing Order A lifecycle (NEW -> CONFIRMED -> PREPARING -> READY -> OUT_FOR_DELIVERY -> DELIVERED)...");

  // 1. CONFIRMED
  const confirmedOrder = await transitionOrderStatus(cashierUser.id, orderA.id, OrderStatus.CONFIRMED);
  assert.strictEqual(confirmedOrder.status, OrderStatus.CONFIRMED);
  assert.ok(confirmedOrder.confirmedAt, "confirmedAt timestamp must be recorded");

  // 2. PREPARING
  const preparingOrder = await transitionOrderStatus(cashierUser.id, orderA.id, OrderStatus.PREPARING);
  assert.strictEqual(preparingOrder.status, OrderStatus.PREPARING);
  assert.ok(preparingOrder.preparingAt, "preparingAt timestamp must be recorded");

  // 3. READY
  const readyOrder = await transitionOrderStatus(cashierUser.id, orderA.id, OrderStatus.READY);
  assert.strictEqual(readyOrder.status, OrderStatus.READY);
  assert.ok(readyOrder.readyAt, "readyAt timestamp must be recorded");

  // 4. OUT_FOR_DELIVERY
  const outOrder = await transitionOrderStatus(cashierUser.id, orderA.id, OrderStatus.OUT_FOR_DELIVERY);
  assert.strictEqual(outOrder.status, OrderStatus.OUT_FOR_DELIVERY);
  assert.ok(outOrder.outForDeliveryAt, "outForDeliveryAt timestamp must be recorded");

  // 5. DELIVERED
  const deliveredOrder = await transitionOrderStatus(cashierUser.id, orderA.id, OrderStatus.DELIVERED);
  assert.strictEqual(deliveredOrder.status, OrderStatus.DELIVERED);
  assert.ok(deliveredOrder.deliveredAt, "deliveredAt timestamp must be recorded");

  // Verify AuditLog entries for all 5 transitions
  const statusAuditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "Order",
      entityId: orderA.id,
      action: AuditAction.STATUS_CHANGE,
    },
    orderBy: { timestamp: "asc" },
  });
  assert.strictEqual(statusAuditLogs.length, 5, "5 STATUS_CHANGE audit logs must be recorded for Order A");

  console.log("✓ All 5 lifecycle transitions succeeded with recorded timestamps and atomic AuditLog entries");

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 4: Illegal Transitions from Terminal State are Rejected
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 4/8] Verifying illegal transitions from terminal state (DELIVERED)...");

  await assert.rejects(
    async () => {
      await transitionOrderStatus(cashierUser.id, orderA.id, OrderStatus.CANCELLED, CancelReason.CUSTOMER_CHANGED_MIND);
    },
    /TERMINAL_STATUS/,
    "DELIVERED -> CANCELLED transition must throw TERMINAL_STATUS error"
  );

  await assert.rejects(
    async () => {
      await transitionOrderStatus(cashierUser.id, orderA.id, OrderStatus.PREPARING);
    },
    /TERMINAL_STATUS/,
    "DELIVERED -> PREPARING backwards transition must throw TERMINAL_STATUS error"
  );

  console.log("✓ Illegal transitions from terminal DELIVERED status properly rejected");

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 5: Cashier creates Order B and Cancels with Reason Enforcement
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 5/8] Testing Order B cancellation & mandatory cancelReason enforcement...");

  const orderB = await createOrder(
    { id: cashierUser.id, role: cashierUser.role },
    {
      brandId: testBrand.id,
      platformId: testPlatform.id,
      customer: {
        name: "Salma Cancellation Test",
        phone: "01011112233",
      },
      items: [{ productId: productA.id, quantity: 1 }],
      paymentMethod: PaymentMethod.CASH,
    }
  );

  // Cancellation without reason must FAIL
  await assert.rejects(
    async () => {
      await transitionOrderStatus(cashierUser.id, orderB.id, OrderStatus.CANCELLED, null);
    },
    /CANCEL_REASON_REQUIRED/,
    "Cancelling without reason must fail"
  );

  // Cancellation with valid reason must SUCCEED
  const cancelledOrderB = await transitionOrderStatus(
    cashierUser.id,
    orderB.id,
    OrderStatus.CANCELLED,
    CancelReason.CUSTOMER_CHANGED_MIND
  );

  assert.strictEqual(cancelledOrderB.status, OrderStatus.CANCELLED);
  assert.strictEqual(cancelledOrderB.cancelReason, CancelReason.CUSTOMER_CHANGED_MIND);
  assert.ok(cancelledOrderB.cancelledAt, "cancelledAt timestamp must be recorded");

  // Verify AuditLog CANCEL action
  const cancelAuditB = await prisma.auditLog.findFirst({
    where: {
      entityType: "Order",
      entityId: orderB.id,
      action: AuditAction.CANCEL,
    },
  });
  assert.ok(cancelAuditB, "AuditLog CANCEL entry must exist for Order B");
  assert.strictEqual(cancelAuditB.userId, cashierUser.id);

  console.log(`✓ Order B cancelled successfully with cancelReason='CUSTOMER_CHANGED_MIND' & AuditLog CANCEL recorded`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 6: Cashier creates Order C with Discount (Pending Approval Workflow)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 6/8] Cashier creates Order C requesting discount (Pending workflow)...");

  const orderC = await createOrder(
    { id: cashierUser.id, role: cashierUser.role },
    {
      brandId: testBrand.id,
      platformId: testPlatform.id,
      customer: {
        name: "Kareem Discount VIP",
        phone: "01055554433",
      },
      items: [{ productId: productA.id, quantity: 2 }], // 240
      discount: 40,
      discountReason: "VIP Loyalty Member Discount",
      paymentMethod: PaymentMethod.VISA,
    }
  );

  assert.strictEqual(orderC.discountStatus, DiscountStatus.PENDING, "Cashier discount must be PENDING");
  assert.strictEqual(orderC.discountRequestedBy, cashierUser.id, "discountRequestedBy must be cashier");
  assert.strictEqual(orderC.discountApprovedBy, null, "discountApprovedBy must be null initially");
  assert.strictEqual(Number(orderC.discount), 40, "Discount amount must be recorded as 40.00");

  console.log(`✓ Order C created with discountStatus=PENDING (Requested by Cashier)`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 7: Manager Approves Discount on Order C
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 7/8] Manager approves discount on Order C...");

  // Non-manager cannot approve
  await assert.rejects(
    async () => {
      await decideDiscount({ id: cashierUser.id, role: cashierUser.role }, orderC.id, "APPROVED");
    },
    /FORBIDDEN/,
    "Cashier cannot approve discounts"
  );

  // Manager approves
  const approvedOrderC = await decideDiscount(
    { id: managerUser.id, role: managerUser.role },
    orderC.id,
    "APPROVED"
  );

  assert.strictEqual(approvedOrderC.discountStatus, DiscountStatus.APPROVED);
  assert.strictEqual(approvedOrderC.discountApprovedBy, managerUser.id);

  // Verify AuditLog DISCOUNT_APPROVE entry
  const discountAuditC = await prisma.auditLog.findFirst({
    where: {
      entityType: "Order",
      entityId: orderC.id,
      action: AuditAction.DISCOUNT_APPROVE,
    },
  });
  assert.ok(discountAuditC, "AuditLog DISCOUNT_APPROVE entry must exist");
  assert.strictEqual(discountAuditC.userId, managerUser.id);

  console.log(`✓ Discount approved by Manager (discountStatus=APPROVED) & AuditLog DISCOUNT_APPROVE recorded`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 8: Multi-criteria Order Filtering & Retrieval
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 8/8] Testing order filtering and list queries...");

  // 1. Filter by Brand
  const brandOrders = await listOrders({ brandId: testBrand.id });
  const brandOrderIds = brandOrders.map((o) => o.id);
  assert.ok(brandOrderIds.includes(orderA.id), "Brand filter must include Order A");
  assert.ok(brandOrderIds.includes(orderB.id), "Brand filter must include Order B");
  assert.ok(brandOrderIds.includes(orderC.id), "Brand filter must include Order C");

  // 2. Filter by Platform
  const platformOrders = await listOrders({ platformId: testPlatform.id });
  const platformOrderIds = platformOrders.map((o) => o.id);
  assert.ok(platformOrderIds.includes(orderA.id), "Platform filter must include Order A");

  // 3. Filter by Status (DELIVERED)
  const deliveredOrders = await listOrders({ status: OrderStatus.DELIVERED });
  const deliveredIds = deliveredOrders.map((o) => o.id);
  assert.ok(deliveredIds.includes(orderA.id), "Delivered query must include Order A");
  assert.ok(!deliveredIds.includes(orderB.id), "Delivered query must NOT include cancelled Order B");

  // 4. Filter by Status (CANCELLED)
  const cancelledOrders = await listOrders({ status: OrderStatus.CANCELLED });
  const cancelledIds = cancelledOrders.map((o) => o.id);
  assert.ok(cancelledIds.includes(orderB.id), "Cancelled query must include Order B");
  assert.ok(!cancelledIds.includes(orderA.id), "Cancelled query must NOT include delivered Order A");

  // 5. Search by Order Number
  const searchByNumber = await listOrders({ search: orderA.orderNumber });
  assert.strictEqual(searchByNumber.length >= 1, true, "Search by order number should find Order A");
  assert.strictEqual(searchByNumber[0].id, orderA.id, "First result should be Order A");

  // 6. Search by Customer Phone
  const searchByPhone = await listOrders({ search: phoneCustomerA });
  assert.ok(searchByPhone.some((o) => o.id === orderA.id), "Search by phone should match Order A");

  // 7. Full Details getOrderById
  const fullDetails = await getOrderById(orderA.id);
  assert.ok(fullDetails, "getOrderById must return complete record");
  assert.strictEqual(fullDetails.items.length, 2, "Full details must include items");
  assert.ok(fullDetails.customer, "Full details must include customer");
  assert.ok(fullDetails.brand, "Full details must include brand");
  assert.ok(fullDetails.platform, "Full details must include platform");
  assert.ok(fullDetails.zone, "Full details must include delivery zone");

  console.log("✓ Multi-criteria filtering (Brand, Platform, Status, Search, ID) verified completely");

  console.log("\n================================================================================");
  console.log("🎉 ALL PHASE 4 INTEGRATION & VERIFICATION TESTS PASSED SUCCESSFULLY (8/8)!");
  console.log("================================================================================\n");
}

runPhase4Verification()
  .catch((err) => {
    console.error("❌ Phase 4 Verification Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
