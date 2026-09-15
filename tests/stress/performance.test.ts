import "dotenv/config";

import assert from "node:assert";
import { TestRunner } from "../helpers/test-runner";
import { prisma } from "../../src/lib/prisma";
import { getDashboardOverview, createOrder, getOrderById } from "../../src/services/orders";
import { getReportsData } from "../../src/services/reports";
import { listDailyClosings } from "../../src/services/closing";
import { listCustomers } from "../../src/services/customers";
import { calculateOrderTotals } from "../../src/lib/orderStateMachine";
import { Role, PaymentMethod } from "@prisma/client";

const runner = new TestRunner("Stress: NFR Performance Benchmarks");

async function runPerformanceSuite() {
  runner.setContext("Performance Benchmarks", 1);

  // Entities cache
  const [brand, platform, product, zone, cashier, owner] = await Promise.all([
    prisma.brand.findFirst({ where: { isActive: true } }),
    prisma.platform.findFirst({ where: { isActive: true } }),
    prisma.product.findFirst({ where: { isActive: true } }),
    prisma.deliveryZone.findFirst({ where: { isActive: true } }),
    prisma.user.findFirst({ where: { role: "CASHIER", isActive: true } }),
    prisma.user.findFirst({ where: { role: "OWNER", isActive: true } }),
  ]);

  assert.ok(cashier, "Active cashier required for benchmarks");
  assert.ok(owner, "Active owner required for benchmarks");

  // Track created order for cleanup
  let createdOrderId: string | null = null;

  try {
    // -------------------------------------------------------------------------
    // PERF-01: Main Dashboard Overview Query Latency (< 2000ms - NFR §1)
    // -------------------------------------------------------------------------
    await runner.test("PERF-01: Dashboard Overview query completes within NFR 2000ms threshold", async () => {
      const start = performance.now();
      const overview = await getDashboardOverview(owner.id, Role.OWNER);
      const latencyMs = performance.now() - start;

      assert.ok(overview, "Overview data must be returned");
      assert.ok(overview.shiftSummary !== undefined, "Shift summary must be defined");
      assert.ok(
        latencyMs < 2000,
        `Dashboard Overview latency (${latencyMs.toFixed(1)}ms) exceeded NFR threshold (2000ms)`
      );
    });

    // -------------------------------------------------------------------------
    // PERF-02: Complex Reports & Analytics Aggregation (< 3000ms - NFR §1)
    // -------------------------------------------------------------------------
    await runner.test("PERF-02: Aggregated 30-day Reports query completes within NFR 3000ms threshold", async () => {
      const now = new Date();
      const endDate = now.toISOString().split("T")[0];
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
      const startDate = thirtyDaysAgo.toISOString().split("T")[0];

      const start = performance.now();
      const reports = await getReportsData({ startDate, endDate });
      const latencyMs = performance.now() - start;

      assert.ok(reports.summary, "Reports summary must be populated");
      assert.ok(Array.isArray(reports.dailyBreakdown), "Daily breakdown must be an array");
      assert.ok(
        latencyMs < 3000,
        `Reports query latency (${latencyMs.toFixed(1)}ms) exceeded NFR threshold (3000ms)`
      );
    });

    // -------------------------------------------------------------------------
    // PERF-03: Daily Closing Shift Listing & Query Performance (< 3000ms - NFR §1)
    // -------------------------------------------------------------------------
    await runner.test("PERF-03: Daily Closings list query completes within NFR 3000ms threshold", async () => {
      const start = performance.now();
      const closings = await listDailyClosings({ limit: 50 });
      const latencyMs = performance.now() - start;

      assert.ok(Array.isArray(closings.closings), "Closings must be returned as array");
      assert.ok(
        latencyMs < 3000,
        `Daily closings query latency (${latencyMs.toFixed(1)}ms) exceeded NFR threshold (3000ms)`
      );
    });

    // -------------------------------------------------------------------------
    // PERF-04: Order Creation & Advisory Lock Pipeline Latency (< 2500ms)
    // -------------------------------------------------------------------------
    await runner.test("PERF-04: Order Creation with Advisory Lock & Audit Pipeline completes within budget", async () => {
      assert.ok(brand, "Active brand required");
      assert.ok(platform, "Active platform required");
      assert.ok(product, "Active product required");

      const actor = { id: cashier.id, role: Role.CASHIER };
      const start = performance.now();

      const order = await createOrder(actor, {
        brandId: brand.id,
        platformId: platform.id,
        zoneId: zone?.id ?? null,
        paymentMethod: PaymentMethod.CASH,
        customer: {
          phone: "01088880001",
          name: "Perf Benchmark Customer",
          address: "123 Perf Test Lane",
        },
        items: [{ productId: product.id, quantity: 1 }],
        notes: `[PERF_BENCHMARK_${Date.now()}] Performance test order`,
      });
      const creationLatencyMs = performance.now() - start;
      createdOrderId = order.id;

      assert.ok(order.id, "Order must be successfully created");
      assert.ok(order.orderNumber.startsWith("ORD-"), "Valid orderNumber must be generated");
      assert.ok(
        creationLatencyMs < 2500,
        `Order creation latency (${creationLatencyMs.toFixed(1)}ms) exceeded 2500ms threshold`
      );

      // Single order retrieval latency (< 1000ms for cloud roundtrip)
      const fetchStart = performance.now();
      const fetched = await getOrderById(order.id);
      const fetchLatencyMs = performance.now() - fetchStart;

      assert.ok(fetched, "Order must be retrievable");
      assert.ok(
        fetchLatencyMs < 1000,
        `Order retrieval latency (${fetchLatencyMs.toFixed(1)}ms) exceeded 1000ms threshold`
      );
    });

    // -------------------------------------------------------------------------
    // PERF-05: Customer CRM Pagination & Search (< 1500ms)
    // -------------------------------------------------------------------------
    await runner.test("PERF-05: Customer CRM Listing and RFM calculation completes within 1500ms", async () => {
      const start = performance.now();
      const customerData = await listCustomers({ page: 1, limit: 25, search: "010" });
      const latencyMs = performance.now() - start;

      assert.ok(Array.isArray(customerData.customers), "Customer list must be returned");
      assert.ok(customerData.stats.totalCustomers >= 0, "Stats must be computed");
      assert.ok(
        latencyMs < 1500,
        `Customer listing latency (${latencyMs.toFixed(1)}ms) exceeded 1500ms threshold`
      );
    });

    // -------------------------------------------------------------------------
    // PERF-06: In-Memory Financial Calculation Throughput (10,000 runs < 200ms)
    // -------------------------------------------------------------------------
    await runner.test("PERF-06: 10,000 In-memory Order Total Calculations execute in under 200ms", async () => {
      const start = performance.now();
      const ITERATIONS = 10_000;

      for (let i = 0; i < ITERATIONS; i++) {
        const itemPrice = 50 + (i % 200);
        const qty = 1 + (i % 3);
        const discount = (i % 2 === 0) ? 20 : 0;
        const deliveryFee = (i % 3 === 0) ? 30 : 0;
        const result = calculateOrderTotals({
          items: [{ price: itemPrice, quantity: qty }],
          discount,
          deliveryFee,
        });
        const subtotal = itemPrice * qty;
        assert.strictEqual(
          result.total,
          Math.max(0, subtotal - discount) + deliveryFee
        );
      }

      const elapsedMs = performance.now() - start;
      assert.ok(
        elapsedMs < 200,
        `10,000 calculations took ${elapsedMs.toFixed(1)}ms (threshold: 200ms)`
      );
    });

  } finally {
    // Clean up created benchmark order if any
    if (createdOrderId) {
      try {
        await prisma.orderItem.deleteMany({ where: { orderId: createdOrderId } });
        await prisma.auditLog.deleteMany({
          where: { entityType: "Order", entityId: createdOrderId },
        });
        await prisma.order.delete({ where: { id: createdOrderId } });
      } catch (cleanErr) {
        console.warn("Notice: Benchmark order cleanup skipped:", cleanErr);
      }
    }
  }

  const summary = runner.getSummary();
  console.log("\n" + "=".repeat(60));
  console.log(`📊 PERFORMANCE SUITE SUMMARY: ${summary.passed}/${summary.total} passed in ${summary.durationMs}ms`);
  console.log("=".repeat(60) + "\n");

  if (summary.failed > 0) {
    process.exit(1);
  }
}

runPerformanceSuite()
  .catch((err) => {
    console.error("FATAL: Performance benchmark suite failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
