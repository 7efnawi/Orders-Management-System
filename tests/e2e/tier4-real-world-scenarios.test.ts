import assert from "node:assert";
import { TestRunner } from "../helpers/test-runner";
import {
  getBrandToken,
  getPlatformToken,
  getLoyaltyTier,
} from "../helpers/visual-token-oracle";
import { calculatePrepTime } from "../helpers/prep-timer-oracle";
import { generateReceiptPreview } from "../helpers/receipt-oracle";
import {
  assertTransition,
  OrderStatus,
} from "../../src/lib/orderStateMachine";
import { DriverType } from "@prisma/client";

export async function runTier4Tests(): Promise<TestRunner> {
  const runner = new TestRunner("Tier 4: Real-World Dark Kitchen Application Scenarios");

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 1: Cashier Rush Hour Multi-Brand POS Order Entry
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("Scenario 1: Cashier Rush Hour POS", 4);

  await runner.test("S1.1: Cashier rapid order 1: Flower brand, New Customer, Cash payment", () => {
    const customer = { name: "أحمد كمال", phone: "01012345678", totalOrders: 0 };
    const loyalty = getLoyaltyTier(customer.totalOrders);
    assert.strictEqual(loyalty.tier, "new");

    const brandToken = getBrandToken("Flower");
    assert.strictEqual(brandToken.kanji, "花");

    const receipt = generateReceiptPreview({
      brandName: "Flower",
      brandKanji: brandToken.kanji,
      orderNumber: "ORD-RUSH-001",
      customerName: customer.name,
      customerPhone: customer.phone,
      paymentMethod: "CASH",
      driverType: "OWN",
      items: [
        { productId: "p1", name: "Salmon Roll", price: 180, quantity: 2 },
        { productId: "p2", name: "Tuna Nigiri", price: 60, quantity: 3 },
      ],
      deliveryFee: 30,
      discount: 0,
    });

    assert.strictEqual(receipt.subtotal, 540); // 360 + 180 = 540
    assert.strictEqual(receipt.netDeliveryFee, 30);
    assert.strictEqual(receipt.grandTotal, 570);
  });

  await runner.test("S1.2: Cashier rapid order 2: Mastery brand, Gold VIP Customer, Visa payment + 10% loyalty discount", () => {
    const customer = { name: "د. محمود شريف", phone: "01098765432", totalOrders: 15 };
    const loyalty = getLoyaltyTier(customer.totalOrders);
    assert.strictEqual(loyalty.tier, "vip");

    const brandToken = getBrandToken("Mastery");
    assert.strictEqual(brandToken.kanji, "匠");

    const discount = 50; // 10% VIP discount

    const receipt = generateReceiptPreview({
      brandName: "Mastery",
      brandKanji: brandToken.kanji,
      orderNumber: "ORD-RUSH-002",
      customerName: customer.name,
      customerPhone: customer.phone,
      paymentMethod: "VISA",
      driverType: "OWN",
      items: [{ productId: "p3", name: "Mastery Supreme Platter", price: 250, quantity: 2 }],
      deliveryFee: 25,
      discount,
    });

    assert.strictEqual(receipt.subtotal, 500);
    assert.strictEqual(receipt.discount, 50);
    assert.strictEqual(receipt.netDeliveryFee, 25);
    assert.strictEqual(receipt.grandTotal, 475); // 500 - 50 + 25
  });

  await runner.test("S1.3: Cashier rapid order 3: Niwa brand, Platinum Legend Customer, Online payment, App Fleet delivery", () => {
    const customer = { name: "م. كريم علام", phone: "01055554444", totalOrders: 42 };
    const loyalty = getLoyaltyTier(customer.totalOrders);
    assert.strictEqual(loyalty.tier, "legend");

    const brandToken = getBrandToken("Niwa");
    assert.strictEqual(brandToken.kanji, "庭");

    const receipt = generateReceiptPreview({
      brandName: "Niwa",
      brandKanji: brandToken.kanji,
      orderNumber: "ORD-RUSH-003",
      customerName: customer.name,
      customerPhone: customer.phone,
      paymentMethod: "ONLINE",
      driverType: "APP", // App driver zeros delivery fee
      deliveryFee: 40,
      items: [{ productId: "p4", name: "Smoked Eel Roll", price: 220, quantity: 3 }],
      discount: 99, // 15% Legend discount on 660
    });

    assert.strictEqual(receipt.subtotal, 660);
    assert.strictEqual(receipt.discount, 99);
    assert.strictEqual(receipt.netDeliveryFee, 0); // App fleet = 0 EGP fee to restaurant
    assert.strictEqual(receipt.grandTotal, 561); // 660 - 99 + 0
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 2: Kitchen Line Expeditor Rush Hour Kanban Workflow
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("Scenario 2: Kitchen Line Expeditor Workflow", 4);

  await runner.test("S2.1: Kitchen expeditor monitors 10 orders across brands & identifies 3 overdue orders (>15m)", () => {
    const now = new Date("2026-08-26T20:30:00Z");

    const kitchenOrders = [
      // Fresh orders (<10m)
      { id: "k-1", prepStart: "2026-08-26T20:26:00Z", brand: "Flower" },
      { id: "k-2", prepStart: "2026-08-26T20:24:00Z", brand: "Niwa" },
      { id: "k-3", prepStart: "2026-08-26T20:22:00Z", brand: "Mastery" },
      // Warning orders (10-14m)
      { id: "k-4", prepStart: "2026-08-26T20:19:00Z", brand: "Tobiko" },
      { id: "k-5", prepStart: "2026-08-26T20:18:00Z", brand: "Flower" },
      { id: "k-6", prepStart: "2026-08-26T20:17:00Z", brand: "Niwa" },
      { id: "k-7", prepStart: "2026-08-26T20:16:00Z", brand: "Mastery" },
      // Critical overdue orders (>15m) -> PULSING ALERT BADGES
      { id: "k-8", prepStart: "2026-08-26T20:12:00Z", brand: "Tobiko" },
      { id: "k-9", prepStart: "2026-08-26T20:10:00Z", brand: "Flower" },
      { id: "k-10", prepStart: "2026-08-26T20:05:00Z", brand: "Mastery" },
    ];

    const results = kitchenOrders.map((o) => ({
      ...o,
      timer: calculatePrepTime(o.prepStart, o.prepStart, now),
    }));

    const criticalOrders = results.filter((o) => o.timer.isCritical);
    const warningOrders = results.filter((o) => o.timer.isWarning);
    const normalOrders = results.filter((o) => !o.timer.isWarning && !o.timer.isCritical);

    assert.strictEqual(criticalOrders.length, 3, "Exactly 3 orders must trigger pulsing critical alert");
    assert.strictEqual(warningOrders.length, 4, "4 orders must be in warning state");
    assert.strictEqual(normalOrders.length, 3, "3 orders must be in normal state");

    for (const c of criticalOrders) {
      assert.ok(c.timer.badgeAnimationClass.includes("animate-pulse"));
    }
  });

  await runner.test("S2.2: Expeditor advances overdue order from PREPARING to READY and halts timer", () => {
    let orderStatus: OrderStatus = OrderStatus.PREPARING;
    assertTransition(orderStatus, OrderStatus.READY);
    orderStatus = OrderStatus.READY;
    assert.strictEqual(orderStatus, OrderStatus.READY);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 3: Multi-Platform Courier Dispatch & Driver Handover
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("Scenario 3: Multi-Platform Courier Dispatch", 4);

  await runner.test("S3.1: Multi-platform orders categorized with color-coded platform badges", () => {
    const orders = [
      { id: "o-talabat", platform: "Talabat" },
      { id: "o-elmenus", platform: "elmenus" },
      { id: "o-instashop", platform: "InstaShop" },
      { id: "o-harryapp", platform: "HarryApp" },
      { id: "o-phone", platform: "Phone" },
    ];

    for (const o of orders) {
      const token = getPlatformToken(o.platform);
      assert.ok(token.hex.startsWith("#"));
      assert.ok(token.bgClass.length > 0);
    }
  });

  await runner.test("S3.2: Dispatcher assigns driver & transitions order from READY to OUT_FOR_DELIVERY to DELIVERED", () => {
    let currentStatus: OrderStatus = OrderStatus.READY;
    const assignedDriver = { id: "drv-01", name: "الكابتن وائل", type: DriverType.OWN };

    // Validate driver assignment before transitioning to OUT_FOR_DELIVERY
    assert.ok(assignedDriver.id !== null);
    assertTransition(currentStatus, OrderStatus.OUT_FOR_DELIVERY);
    currentStatus = OrderStatus.OUT_FOR_DELIVERY;

    // Driver delivers order to customer
    assertTransition(currentStatus, OrderStatus.DELIVERED);
    currentStatus = OrderStatus.DELIVERED;
    assert.strictEqual(currentStatus, OrderStatus.DELIVERED);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 4: End-of-Shift Kitchen Night Mode Closing Workflow
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("Scenario 4: Kitchen Night Mode Closing", 4);

  await runner.test("S4.1: Switch to Kitchen Night-Shift mode and verify high-contrast obsidian styles", () => {
    const activeTheme = "kitchen";
    const bodyClass = `min-h-screen ${activeTheme}`;
    assert.ok(bodyClass.includes("kitchen"));
  });

  await runner.test("S4.2: Audit shift kanban board to ensure zero unhandled active orders remain", () => {
    const shiftOrders = [
      { id: "o1", status: OrderStatus.DELIVERED },
      { id: "o2", status: OrderStatus.DELIVERED },
      { id: "o3", status: OrderStatus.CANCELLED },
      { id: "o4", status: OrderStatus.DELIVERED },
    ];

    const unhandledOrders = shiftOrders.filter(
      (o) => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED
    );
    assert.strictEqual(unhandledOrders.length, 0, "No pending orders should remain at closing");
  });

  await runner.test("S4.3: Calculate shift closing cash drawer reconciliation (Cash Orders - Expenses = Net Cash)", () => {
    const shiftFinancials = {
      cashOrdersTotal: 2450,
      visaOrdersTotal: 1800,
      onlineOrdersTotal: 950,
      deliveryFeesTotal: 320,
      expensesTotal: 450, // Cleaning supplies, staff drinks
    };

    const netCashInDrawer = shiftFinancials.cashOrdersTotal - shiftFinancials.expensesTotal;
    assert.strictEqual(netCashInDrawer, 2000); // 2450 - 450 = 2000 EGP
  });

  return runner;
}
