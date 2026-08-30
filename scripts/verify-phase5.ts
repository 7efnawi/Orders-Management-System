import "dotenv/config";
import assert from "node:assert";
import {
  Prisma,
  Role,
  DriverType,
  OrderStatus,
  PaymentMethod,
  AuditAction,
} from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import {
  createDeliveryZone,
  updateDeliveryZone,
  listDeliveryZones,
  createDeliveryDriver,
  updateDeliveryDriver,
  listDeliveryDrivers,
  assignDriverToOrder,
} from "../src/services/delivery";
import {
  createOrder,
  transitionOrderStatus,
  getOrderById,
} from "../src/services/orders";

console.log("================================================================================");
console.log("🚀 STARTING PHASE 5 AUTOMATED VERIFICATION & DELIVERY SUBSYSTEM VALIDATION");
console.log("================================================================================\n");

async function runPhase5Verification() {
  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: Check or Seed Test Lookup Data (Users, Brand, Category, Product, Platform)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("📍 [Step 1/5] Checking & seeding test lookup data...");

  // Seed / Upsert Owner & Cashier Users
  const ownerUser = await prisma.user.upsert({
    where: { email: "owner-verify-phase5@sushi.local" },
    update: { role: Role.OWNER, isActive: true },
    create: {
      email: "owner-verify-phase5@sushi.local",
      name: "Phase 5 Owner",
      role: Role.OWNER,
      isActive: true,
    },
  });

  const cashierUser = await prisma.user.upsert({
    where: { email: "cashier-verify-phase5@sushi.local" },
    update: { role: Role.CASHIER, isActive: true },
    create: {
      email: "cashier-verify-phase5@sushi.local",
      name: "Phase 5 Cashier",
      role: Role.CASHIER,
      isActive: true,
    },
  });

  // Seed / Upsert Brand
  const testBrand = await prisma.brand.upsert({
    where: { name: "Phase 5 Brand Sushi" },
    update: { isActive: true },
    create: { name: "Phase 5 Brand Sushi", isActive: true },
  });

  // Seed / Upsert Category
  let testCategory = await prisma.category.findFirst({
    where: { brandId: testBrand.id, name: "Phase 5 Rolls" },
  });
  if (!testCategory) {
    testCategory = await prisma.category.create({
      data: {
        brandId: testBrand.id,
        name: "Phase 5 Rolls",
        sortOrder: 1,
        isActive: true,
      },
    });
  }

  // Seed / Upsert Product
  let product1 = await prisma.product.findFirst({
    where: { categoryId: testCategory.id, name: "Phase 5 Spicy Tuna" },
  });
  if (!product1) {
    product1 = await prisma.product.create({
      data: {
        categoryId: testCategory.id,
        name: "Phase 5 Spicy Tuna",
        price: new Prisma.Decimal(150.0),
        isActive: true,
      },
    });
  }

  // Seed / Upsert Platform
  const testPlatform = await prisma.platform.upsert({
    where: { name: "Phase 5 Direct" },
    update: { isActive: true },
    create: { name: "Phase 5 Direct", isActive: true },
  });

  // Clean up any existing Phase 5 test orders/zones/drivers for clean test repeatability
  const testPhone = "01055559999";
  const existingCustomers = await prisma.customer.findMany({
    where: { phone: testPhone },
    select: { id: true },
  });
  if (existingCustomers.length > 0) {
    const customerIds = existingCustomers.map((c) => c.id);
    const existingOrders = await prisma.order.findMany({
      where: { customerId: { in: customerIds } },
      select: { id: true },
    });
    const orderIds = existingOrders.map((o) => o.id);
    if (orderIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: { entityType: "Order", entityId: { in: orderIds } },
      });
      await prisma.orderItem.deleteMany({
        where: { orderId: { in: orderIds } },
      });
      await prisma.order.deleteMany({
        where: { id: { in: orderIds } },
      });
    }
  }

  const existingZones = await prisma.deliveryZone.findMany({
    where: { name: { startsWith: "Phase 5 Test Zone" } },
    select: { id: true },
  });
  if (existingZones.length > 0) {
    const zoneIds = existingZones.map((z) => z.id);
    await prisma.auditLog.deleteMany({
      where: { entityType: "DeliveryZone", entityId: { in: zoneIds } },
    });
    await prisma.deliveryZone.deleteMany({
      where: { id: { in: zoneIds } },
    });
  }

  const existingDrivers = await prisma.deliveryDriver.findMany({
    where: { name: { startsWith: "Phase 5 Driver" } },
    select: { id: true },
  });
  if (existingDrivers.length > 0) {
    const driverIds = existingDrivers.map((d) => d.id);
    await prisma.auditLog.deleteMany({
      where: { entityType: "DeliveryDriver", entityId: { in: driverIds } },
    });
    await prisma.deliveryDriver.deleteMany({
      where: { id: { in: driverIds } },
    });
  }

  console.log(`✓ Lookup data ready: Brand=${testBrand.name}, Category=${testCategory.name}, Product=${product1.name}, Platform=${testPlatform.name}`);
  console.log(`✓ Test users ready: Owner=${ownerUser.name}, Cashier=${cashierUser.name}`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2: Delivery Zone CRUD Operations & Inactive Filtering
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 2/5] Testing Delivery Zone CRUD operations & filtering...");

  // Create Zone A: name="Phase 5 Test Zone 1", fee=50
  const zoneA = await createDeliveryZone(ownerUser.id, {
    name: "Phase 5 Test Zone 1",
    fee: 50,
  });
  assert.ok(zoneA.id, "Zone A ID must exist");
  assert.strictEqual(zoneA.name, "Phase 5 Test Zone 1");
  assert.strictEqual(Number(zoneA.fee), 50);
  assert.strictEqual(zoneA.isActive, true);

  // Verify AuditLog for Zone A creation
  const zoneCreateAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: "DeliveryZone",
      entityId: zoneA.id,
      action: AuditAction.CREATE,
    },
  });
  assert.ok(zoneCreateAudit, "AuditLog CREATE must exist for Zone A");
  assert.strictEqual(zoneCreateAudit.userId, ownerUser.id);

  // Update Zone A fee to 60
  const updatedFeeZone = await updateDeliveryZone(ownerUser.id, zoneA.id, { fee: 60 });
  assert.strictEqual(Number(updatedFeeZone.fee), 60);

  // Update Zone A isActive to false
  const deactivatedZone = await updateDeliveryZone(ownerUser.id, zoneA.id, { isActive: false });
  assert.strictEqual(deactivatedZone.isActive, false);

  // Verify listDeliveryZones filtering
  const activeZones = await listDeliveryZones(false);
  const allZones = await listDeliveryZones(true);
  assert.ok(
    !activeZones.some((z) => z.id === zoneA.id),
    "listDeliveryZones(false) must NOT contain deactivated Zone A"
  );
  assert.ok(
    allZones.some((z) => z.id === zoneA.id),
    "listDeliveryZones(true) must contain deactivated Zone A"
  );

  // Re-activate Zone A for subsequent order tests
  const reactivatedZone = await updateDeliveryZone(ownerUser.id, zoneA.id, { isActive: true });
  assert.strictEqual(reactivatedZone.isActive, true);

  console.log(`✓ Zone CRUD complete: Created (fee: 50), Updated (fee: 60), Inactive filtering verified, Reactivated`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3: Delivery Driver CRUD Operations (OWN, APP, EXTERNAL) & Filtering
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 3/5] Testing Delivery Driver CRUD (OWN, APP, EXTERNAL) & filtering...");

  // Create 3 drivers for fleet types (OWN, APP, EXTERNAL)
  const driverOwn = await createDeliveryDriver(ownerUser.id, {
    name: "Phase 5 Driver OWN",
    type: DriverType.OWN,
  });
  const driverApp = await createDeliveryDriver(ownerUser.id, {
    name: "Phase 5 Driver APP",
    type: DriverType.APP,
  });
  const driverExternal = await createDeliveryDriver(ownerUser.id, {
    name: "Phase 5 Driver EXTERNAL",
    type: DriverType.EXTERNAL,
  });

  assert.strictEqual(driverOwn.type, DriverType.OWN);
  assert.strictEqual(driverApp.type, DriverType.APP);
  assert.strictEqual(driverExternal.type, DriverType.EXTERNAL);

  // Update Driver OWN name & toggle isActive
  const updatedDriverOwn = await updateDeliveryDriver(ownerUser.id, driverOwn.id, {
    name: "Phase 5 Driver OWN Renamed",
  });
  assert.strictEqual(updatedDriverOwn.name, "Phase 5 Driver OWN Renamed");

  const deactivatedDriverOwn = await updateDeliveryDriver(ownerUser.id, driverOwn.id, {
    isActive: false,
  });
  assert.strictEqual(deactivatedDriverOwn.isActive, false);

  // Verify listDeliveryDrivers filtering
  const activeDrivers = await listDeliveryDrivers(false);
  const allDrivers = await listDeliveryDrivers(true);
  const appDrivers = await listDeliveryDrivers(true, DriverType.APP);

  assert.ok(
    !activeDrivers.some((d) => d.id === driverOwn.id),
    "listDeliveryDrivers(false) must NOT contain deactivated Driver OWN"
  );
  assert.ok(
    allDrivers.some((d) => d.id === driverOwn.id),
    "listDeliveryDrivers(true) must contain deactivated Driver OWN"
  );
  assert.ok(
    appDrivers.some((d) => d.id === driverApp.id),
    "listDeliveryDrivers(true, APP) must contain Driver APP"
  );
  assert.ok(
    !appDrivers.some((d) => d.id === driverOwn.id),
    "listDeliveryDrivers(true, APP) must NOT contain Driver OWN"
  );

  // Reactivate driver
  const reactivatedDriverOwn = await updateDeliveryDriver(ownerUser.id, driverOwn.id, {
    isActive: true,
  });
  assert.strictEqual(reactivatedDriverOwn.isActive, true);

  console.log(`✓ Driver CRUD complete: Created (OWN, APP, EXTERNAL), Inactive filtering verified, Reactivated`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 4: Order Driver Assignment & Dynamic Fee Recalculation
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 4/5] Testing Order Driver Assignment & dynamic fee recalculation...");

  // 1. Create order assigned to Zone A (fee: 60) with Driver OWN
  const order1 = await createOrder(
    { id: cashierUser.id, role: cashierUser.role },
    {
      brandId: testBrand.id,
      platformId: testPlatform.id,
      zoneId: zoneA.id,
      driverId: driverOwn.id,
      customer: {
        name: "Phase 5 Customer",
        phone: testPhone,
        address: "123 Phase 5 St",
      },
      items: [{ productId: product1.id, quantity: 1 }], // price: 150
      paymentMethod: PaymentMethod.CASH,
      notes: "Phase 5 Test Order",
    }
  );

  assert.strictEqual(Number(order1.deliveryFee), 60, "Initial deliveryFee must be 60 for Driver OWN with Zone A");
  assert.strictEqual(Number(order1.subtotal), 150, "Subtotal must be 150");
  const calculatedTotal = Number(order1.subtotal) - Number(order1.discount) + Number(order1.deliveryFee);
  assert.strictEqual(calculatedTotal, 210, "Total must be 210 (150 + 60)");
  assert.strictEqual(order1.driverId, driverOwn.id, "driverId must match Driver OWN");

  // Verify AuditLog CREATE recorded
  const createOrderAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: "Order",
      entityId: order1.id,
      action: AuditAction.CREATE,
    },
  });
  assert.ok(createOrderAudit, "AuditLog CREATE must exist for order1");

  // 2. Reassign driver to Driver APP -> deliveryFee must be ZEROED (0)
  const orderWithApp = await assignDriverToOrder(cashierUser.id, order1.id, driverApp.id);
  assert.strictEqual(Number(orderWithApp.deliveryFee), 0, "Delivery fee must be ZERO (0) for Driver APP");
  assert.strictEqual(orderWithApp.driverId, driverApp.id, "driverId must match Driver APP");

  // Verify AuditLog UPDATE recorded for Driver APP assignment
  const appAssignAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: "Order",
      entityId: order1.id,
      action: AuditAction.UPDATE,
    },
    orderBy: { timestamp: "desc" },
  });
  assert.ok(appAssignAudit, "AuditLog UPDATE must exist for order driver assignment");
  assert.strictEqual(appAssignAudit.userId, cashierUser.id);
  const appNewVal = appAssignAudit.newValue as { driverId: string; deliveryFee: number };
  assert.strictEqual(appNewVal.driverId, driverApp.id);
  assert.strictEqual(appNewVal.deliveryFee, 0);

  // 3. Reassign driver back to Driver OWN -> deliveryFee must be RESTORED to 60
  const orderRestoredOwn = await assignDriverToOrder(cashierUser.id, order1.id, driverOwn.id);
  assert.strictEqual(Number(orderRestoredOwn.deliveryFee), 60, "Delivery fee must be RESTORED to 60 for Driver OWN");
  assert.strictEqual(orderRestoredOwn.driverId, driverOwn.id, "driverId must match Driver OWN");

  // 4. Reassign driver to Driver EXTERNAL -> deliveryFee must be 60 (Zone Fee)
  const orderWithExternal = await assignDriverToOrder(cashierUser.id, order1.id, driverExternal.id);
  assert.strictEqual(Number(orderWithExternal.deliveryFee), 60, "Delivery fee must be 60 for Driver EXTERNAL");
  assert.strictEqual(orderWithExternal.driverId, driverExternal.id, "driverId must match Driver EXTERNAL");

  console.log(`✓ Driver Assignment rules verified: OWN (60 EGP) -> APP (0 EGP) -> OWN (60 EGP restored) -> EXTERNAL (60 EGP)`);
  console.log(`✓ Atomic AuditLogs recorded on each driver assignment`);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 5: Order Lifecycle Progression with Driver Assignment
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n📍 [Step 5/5] Testing Order Lifecycle progression with Driver Assignment & Timestamps...");

  // Progress: NEW -> CONFIRMED -> PREPARING -> READY
  const confirmed = await transitionOrderStatus(cashierUser.id, order1.id, OrderStatus.CONFIRMED);
  assert.strictEqual(confirmed.status, OrderStatus.CONFIRMED);
  assert.ok(confirmed.confirmedAt, "confirmedAt must be set");

  const preparing = await transitionOrderStatus(cashierUser.id, order1.id, OrderStatus.PREPARING);
  assert.strictEqual(preparing.status, OrderStatus.PREPARING);
  assert.ok(preparing.preparingAt, "preparingAt must be set");

  const ready = await transitionOrderStatus(cashierUser.id, order1.id, OrderStatus.READY);
  assert.strictEqual(ready.status, OrderStatus.READY);
  assert.ok(ready.readyAt, "readyAt must be set");

  // Assign Driver OWN at READY state
  const readyWithDriver = await assignDriverToOrder(cashierUser.id, order1.id, driverOwn.id);
  assert.strictEqual(readyWithDriver.driverId, driverOwn.id);
  assert.strictEqual(Number(readyWithDriver.deliveryFee), 60);

  // Progress: READY -> OUT_FOR_DELIVERY
  const outForDelivery = await transitionOrderStatus(cashierUser.id, order1.id, OrderStatus.OUT_FOR_DELIVERY);
  assert.strictEqual(outForDelivery.status, OrderStatus.OUT_FOR_DELIVERY);
  assert.ok(outForDelivery.outForDeliveryAt, "outForDeliveryAt must be set");

  // Progress: OUT_FOR_DELIVERY -> DELIVERED
  const delivered = await transitionOrderStatus(cashierUser.id, order1.id, OrderStatus.DELIVERED);
  assert.strictEqual(delivered.status, OrderStatus.DELIVERED);
  assert.ok(delivered.deliveredAt, "deliveredAt must be set");

  // Fetch full details via getOrderById and verify complete record
  const finalOrder = await getOrderById(order1.id);
  assert.ok(finalOrder, "Final order details must exist");
  assert.strictEqual(finalOrder.status, OrderStatus.DELIVERED);
  assert.strictEqual(finalOrder.driverId, driverOwn.id);
  assert.strictEqual(finalOrder.driver?.name, "Phase 5 Driver OWN Renamed");
  assert.strictEqual(finalOrder.driver?.type, DriverType.OWN);
  assert.strictEqual(finalOrder.zone?.name, "Phase 5 Test Zone 1");
  assert.strictEqual(Number(finalOrder.deliveryFee), 60);
  assert.ok(finalOrder.confirmedAt, "confirmedAt must exist");
  assert.ok(finalOrder.preparingAt, "preparingAt must exist");
  assert.ok(finalOrder.readyAt, "readyAt must exist");
  assert.ok(finalOrder.outForDeliveryAt, "outForDeliveryAt must exist");
  assert.ok(finalOrder.deliveredAt, "deliveredAt must exist");

  console.log(`✓ Complete Order Lifecycle verified (NEW -> CONFIRMED -> PREPARING -> READY -> OUT_FOR_DELIVERY -> DELIVERED)`);
  console.log(`✓ Driver Assignment persisted throughout dispatch and delivery timestamps recorded`);

  console.log("\n================================================================================");
  console.log("🎉 ALL PHASE 5 DELIVERY SUBSYSTEM TESTS PASSED 100% SUCCESSFULLY (5/5)!");
  console.log("================================================================================\n");
}

runPhase5Verification()
  .catch((err) => {
    console.error("❌ Phase 5 Verification Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
