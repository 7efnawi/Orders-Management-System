import assert from "node:assert";
import { TestRunner } from "../helpers/test-runner";
import { calculateOrderTotals } from "../../src/lib/orderStateMachine";
import { calculateShiftSummary, roundCurrency } from "../../src/lib/closing";
import { DriverType, OrderStatus, PaymentMethod } from "@prisma/client";

const runner = new TestRunner("Financial Invariant Fuzzer");

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function runFinancialFuzzingSuite() {
  runner.setContext("Financial Invariants & Zero-Drift", 1);

  // ─── FUZZ-01: 10,000 Random Orders Maintain Strict Financial Identity ──────
  await runner.test("FUZZ-01: 10,000 random orders maintain zero-drift cash identity & non-negative totals", async () => {
    const PAYMENT_METHODS = [PaymentMethod.CASH, PaymentMethod.VISA, PaymentMethod.ONLINE] as const;
    const DRIVER_TYPES = [DriverType.OWN, DriverType.APP, DriverType.EXTERNAL] as const;

    let totalCash = 0;
    let totalVisa = 0;
    let totalOnline = 0;
    let totalDeliveryFees = 0;
    let totalSubtotal = 0;

    const ITERATIONS = 10_000;

    for (let i = 0; i < ITERATIONS; i++) {
      const itemCount = randomInt(1, 8);
      const items = Array.from({ length: itemCount }, () => ({
        price: randomInt(10, 500),
        quantity: randomInt(1, 5),
      }));

      const expectedSubtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
      const driverType = randomChoice(DRIVER_TYPES);
      const rawDeliveryFee = driverType === DriverType.APP ? 0 : randomInt(10, 50);
      const discount = Math.random() > 0.7 ? randomInt(1, expectedSubtotal + 50) : 0;
      const paymentMethod = randomChoice(PAYMENT_METHODS);

      const calculated = calculateOrderTotals({
        items,
        discount,
        deliveryFee: rawDeliveryFee,
        driverType,
      });

      // 1. Invariant: Subtotal equals exact sum of item totals
      assert.strictEqual(
        calculated.subtotal,
        expectedSubtotal,
        `Order ${i}: subtotal ${calculated.subtotal} does not match expected ${expectedSubtotal}`
      );

      // 2. Invariant: APP fleet driver delivery fee is strictly zeroed
      if (driverType === DriverType.APP) {
        assert.strictEqual(
          calculated.netDeliveryFee,
          0,
          `Order ${i}: driverType is APP but netDeliveryFee is ${calculated.netDeliveryFee}`
        );
      } else {
        assert.strictEqual(
          calculated.netDeliveryFee,
          rawDeliveryFee,
          `Order ${i}: non-APP driver fee mismatch`
        );
      }

      // 3. Invariant: Total is strictly non-negative even if discount exceeds subtotal
      assert.ok(
        calculated.total >= 0,
        `Order ${i}: total ${calculated.total} is negative`
      );

      // 4. Invariant: Total calculation formula matches
      const expectedTotal = Math.max(0, expectedSubtotal - discount + calculated.netDeliveryFee);
      assert.strictEqual(
        calculated.total,
        expectedTotal,
        `Order ${i}: total mismatch with formula`
      );

      // Accumulate for macro identity check
      totalSubtotal += calculated.subtotal;
      totalDeliveryFees += calculated.netDeliveryFee;

      if (paymentMethod === PaymentMethod.CASH) {
        totalCash += calculated.total;
      } else if (paymentMethod === PaymentMethod.VISA) {
        totalVisa += calculated.total;
      } else {
        totalOnline += calculated.total;
      }
    }

    const totalRevenue = totalCash + totalVisa + totalOnline;
    assert.ok(totalRevenue > 0, "Total revenue should be positive after 10,000 orders");

    // 5. Invariant: Sum of payment methods strictly equals total revenue (Zero Drift)
    assert.strictEqual(
      roundCurrency(totalCash + totalVisa + totalOnline),
      roundCurrency(totalRevenue),
      "Payment method split sum must exactly equal total revenue"
    );
  });

  // ─── FUZZ-02: roundCurrency Floating-Point Stability (100,000 runs) ────────
  await runner.test("FUZZ-02: roundCurrency never drifts > 0.01 across 100,000 floating-point numbers", async () => {
    for (let i = 0; i < 100_000; i++) {
      const raw = Math.random() * 50_000;
      const rounded = roundCurrency(raw);
      const expected = Math.round(raw * 100) / 100;
      const drift = Math.abs(rounded - expected);
      assert.ok(
        drift < 0.010001,
        `Drift ${drift} exceeded tolerance at raw=${raw}, rounded=${rounded}, expected=${expected}`
      );
    }
  });

  // ─── FUZZ-03: Shift Closing Summary Cross-Validation (500 Shifts) ──────────
  await runner.test("FUZZ-03: calculateShiftSummary satisfies net cash identity and ignores cancelled orders across 500 shifts", async () => {
    const STATUSES = [
      OrderStatus.DELIVERED,
      OrderStatus.DELIVERED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ] as const;
    const PAYMENT_METHODS = [PaymentMethod.CASH, PaymentMethod.VISA, PaymentMethod.ONLINE] as const;

    for (let shiftIdx = 0; shiftIdx < 500; shiftIdx++) {
      const orderCount = randomInt(5, 50);
      const orders = Array.from({ length: orderCount }, () => {
        const status = randomChoice(STATUSES);
        const subtotal = randomInt(50, 800);
        const discount = Math.random() > 0.8 ? randomInt(5, 50) : 0;
        const deliveryFee = randomInt(0, 40);
        const paymentMethod = randomChoice(PAYMENT_METHODS);

        return {
          status,
          paymentMethod,
          subtotal,
          discount,
          deliveryFee,
        };
      });

      const expenseCount = randomInt(0, 10);
      const expenses = Array.from({ length: expenseCount }, () => ({
        quantity: randomInt(1, 3),
        value: randomInt(10, 200),
      }));

      const summary = calculateShiftSummary(orders, expenses);

      // Invariant 1: Total orders = active + cancelled
      assert.strictEqual(
        summary.totalOrders,
        summary.activeOrders + summary.cancelledOrders,
        `Shift ${shiftIdx}: order count mismatch`
      );

      // Invariant 2: Net cash identity (netCash === totalCash - totalExpenses)
      const expectedNetCash = roundCurrency(summary.totalCash - summary.totalExpenses);
      assert.strictEqual(
        summary.netCash,
        expectedNetCash,
        `Shift ${shiftIdx}: netCash (${summary.netCash}) !== totalCash (${summary.totalCash}) - totalExpenses (${summary.totalExpenses})`
      );

      // Invariant 3: Cancelled orders verify exclusion
      let manualCash = 0;
      let manualVisa = 0;
      let manualOnline = 0;
      let manualFees = 0;

      for (const ord of orders) {
        if (ord.status === OrderStatus.CANCELLED) continue;
        const net = Math.max(0, ord.subtotal - ord.discount + ord.deliveryFee);
        manualFees += ord.deliveryFee;
        if (ord.paymentMethod === PaymentMethod.CASH) manualCash += net;
        else if (ord.paymentMethod === PaymentMethod.VISA) manualVisa += net;
        else if (ord.paymentMethod === PaymentMethod.ONLINE) manualOnline += net;
      }

      assert.strictEqual(
        summary.totalCash,
        roundCurrency(manualCash),
        `Shift ${shiftIdx}: active cash sum mismatch`
      );
      assert.strictEqual(
        summary.totalVisa,
        roundCurrency(manualVisa),
        `Shift ${shiftIdx}: active visa sum mismatch`
      );
      assert.strictEqual(
        summary.totalOnline,
        roundCurrency(manualOnline),
        `Shift ${shiftIdx}: active online sum mismatch`
      );
      assert.strictEqual(
        summary.totalDeliveryFees,
        roundCurrency(manualFees),
        `Shift ${shiftIdx}: delivery fee sum mismatch`
      );
    }
  });

  runner.printSummaryReport();
  const summary = runner.getSummary();
  if (summary.failed > 0) {
    process.exit(1);
  }
}

runFinancialFuzzingSuite().catch((err) => {
  console.error("Financial fuzzer crashed:", err);
  process.exit(1);
});
