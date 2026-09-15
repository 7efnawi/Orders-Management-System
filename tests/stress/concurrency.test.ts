import "dotenv/config";

import assert from "node:assert";
import { TestRunner } from "../helpers/test-runner";
import { prisma } from "../../src/lib/prisma";
import { createOrder, transitionOrderStatus } from "../../src/services/orders";
import { CancelReason, OrderStatus, PaymentMethod, Role } from "@prisma/client";

const runner = new TestRunner("Stress: Rush Hour Concurrency Simulation");

async function runConcurrencySuite() {
  runner.setContext("Rush Hour Concurrency", 1);

  await runner.test("STRESS-01: 10 concurrent order creations generate unique collision-free order numbers", async () => {
    // 1. Fetch seed entities
    const [brand, platform, product, zone, cashier] = await Promise.all([
      prisma.brand.findFirst({ where: { isActive: true } }),
      prisma.platform.findFirst({ where: { isActive: true } }),
      prisma.product.findFirst({ where: { isActive: true } }),
      prisma.deliveryZone.findFirst({ where: { isActive: true } }),
      prisma.user.findFirst({ where: { role: "CASHIER", isActive: true } }),
    ]);

    assert.ok(brand, "Active brand required for concurrency stress test");
    assert.ok(platform, "Active platform required for concurrency stress test");
    assert.ok(product, "Active product required for concurrency stress test");
    assert.ok(cashier, "Active cashier required for concurrency stress test");

    const actor = { id: cashier.id, role: Role.CASHIER };
    const CONCURRENCY_LEVEL = 10;
    const testBatchId = `STRESS_${Date.now()}`;

    // 2. Launch 10 simultaneous order creations
    const orderPromises = Array.from({ length: CONCURRENCY_LEVEL }, (_, i) => {
      const phone = `010999${String(i).padStart(5, "0")}`;
      return createOrder(actor, {
        brandId: brand.id,
        platformId: platform.id,
        zoneId: zone?.id ?? null,
        paymentMethod: PaymentMethod.CASH,
        customer: {
          phone,
          name: `Rush Customer ${i}`,
          address: `Rush St ${i}`,
        },
        items: [{ productId: product.id, quantity: 1 }],
        notes: `[${testBatchId}] Concurrent rush hour test #${i}`,
      });
    });

    const createdOrders = await Promise.all(orderPromises);

    // 3. Verify all orders succeeded
    assert.strictEqual(
      createdOrders.length,
      CONCURRENCY_LEVEL,
      `Expected ${CONCURRENCY_LEVEL} orders to be created`
    );

    // 4. Invariant: Strict uniqueness of sequential order numbers
    const orderNumbers = createdOrders.map((o) => o.orderNumber);
    const uniqueNumbers = new Set(orderNumbers);
    console.log("Created order numbers:", orderNumbers);

    assert.strictEqual(
      uniqueNumbers.size,
      CONCURRENCY_LEVEL,
      `Duplicate order numbers detected in concurrent burst: ${orderNumbers.join(", ")}`
    );

    // 5. Invariant: Initial status is NEW
    for (const order of createdOrders) {
      assert.strictEqual(order.status, OrderStatus.NEW);
      assert.ok(order.orderNumber.startsWith("ORD-"));
      assert.ok(Number(order.subtotal) > 0, "Subtotal must be positive");
    }

    // 6. Cleanup: Cancel test orders with reason to preserve No-Hard-Delete invariant
    for (const order of createdOrders) {
      try {
        await transitionOrderStatus(
          cashier.id,
          order.id,
          OrderStatus.CANCELLED,
          CancelReason.OTHER
        );
      } catch {
        // Ignored in cleanup
      }
    }
  });

  runner.printSummaryReport();
  const summary = runner.getSummary();
  if (summary.failed > 0) {
    process.exit(1);
  }
}

runConcurrencySuite()
  .catch((err) => {
    console.error("Concurrency test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
