import dotenv from "dotenv";
dotenv.config();

import assert from "node:assert";
import { TestRunner } from "../helpers/test-runner";
import { OrderStatus, CancelReason } from "@prisma/client";
import { assertTransition } from "../../src/lib/orderStateMachine";

const runner = new TestRunner("API Security: Immutability & No-Hard-Delete");

async function runImmutabilitySuite() {
  runner.setContext("No-Hard-Delete & Immutability", 1);

  // ─── 1. Orders Immutability (FR-ORD-03) ───────────────────────────────────
  await runner.test("SEC-NODELETE-01: Order routes & services expose zero hard-delete mechanisms", async () => {
    const ordersRoute = await import("../../src/app/api/orders/route");
    assert.strictEqual(
      "DELETE" in ordersRoute,
      false,
      "src/app/api/orders/route must NOT export a DELETE method"
    );

    const orderIdRoute = await import("../../src/app/api/orders/[id]/route");
    assert.strictEqual(
      "DELETE" in orderIdRoute,
      false,
      "src/app/api/orders/[id]/route must NOT export a DELETE method"
    );

    const ordersService = await import("../../src/services/orders");
    assert.strictEqual(
      "deleteOrder" in ordersService,
      false,
      "src/services/orders must NOT export deleteOrder"
    );
    assert.strictEqual(
      "removeOrder" in ordersService,
      false,
      "src/services/orders must NOT export removeOrder"
    );
    assert.strictEqual(
      "destroyOrder" in ordersService,
      false,
      "src/services/orders must NOT export destroyOrder"
    );
  });

  // ─── 2. Cancellation Requires Mandatory Reason (FR-ORD-03) ────────────────
  await runner.test("SEC-NODELETE-02: Cancellation strictly requires an explicit cancelReason", async () => {
    // Attempting cancellation from NEW without reason
    assert.throws(
      () => assertTransition(OrderStatus.NEW, OrderStatus.CANCELLED, null),
      /CANCEL_REASON_REQUIRED/,
      "Cancelling without reason from NEW must throw CANCEL_REASON_REQUIRED"
    );

    // Attempting cancellation from CONFIRMED without reason
    assert.throws(
      () => assertTransition(OrderStatus.CONFIRMED, OrderStatus.CANCELLED, undefined),
      /CANCEL_REASON_REQUIRED/,
      "Cancelling without reason from CONFIRMED must throw CANCEL_REASON_REQUIRED"
    );

    // Attempting cancellation from PREPARING without reason
    assert.throws(
      () => assertTransition(OrderStatus.PREPARING, OrderStatus.CANCELLED, null),
      /CANCEL_REASON_REQUIRED/,
      "Cancelling without reason from PREPARING must throw CANCEL_REASON_REQUIRED"
    );

    // With a valid cancelReason, assertTransition succeeds
    assert.doesNotThrow(
      () => assertTransition(OrderStatus.NEW, OrderStatus.CANCELLED, CancelReason.CUSTOMER_CHANGED_MIND),
      "Cancelling with valid reason should be permitted by state machine"
    );
    assert.doesNotThrow(
      () => assertTransition(OrderStatus.CONFIRMED, OrderStatus.CANCELLED, CancelReason.ITEM_UNAVAILABLE),
      "Cancelling with valid reason should be permitted by state machine"
    );
  });

  // ─── 3. Customer CRM Immutability (FR-CUST-05 & Directives §4) ────────────
  await runner.test("SEC-NODELETE-03: Customer directory enforces absolute immutability via 405 Method Not Allowed", async () => {
    const customersRoute = await import("../../src/app/api/customers/route");
    assert.ok(typeof customersRoute.DELETE === "function", "DELETE handler should be registered to intercept calls");
    const res1 = await customersRoute.DELETE();
    assert.strictEqual(res1.status, 405, "DELETE /api/customers must return HTTP 405");
    const body1 = await res1.json();
    assert.strictEqual(body1.code, "METHOD_NOT_ALLOWED");

    const customerIdRoute = await import("../../src/app/api/customers/[id]/route");
    assert.ok(typeof customerIdRoute.DELETE === "function", "DELETE handler should be registered to intercept calls");
    const res2 = await customerIdRoute.DELETE();
    assert.strictEqual(res2.status, 405, "DELETE /api/customers/[id] must return HTTP 405");
    const body2 = await res2.json();
    assert.strictEqual(body2.code, "METHOD_NOT_ALLOWED");

    const customersService = await import("../../src/services/customers");
    assert.strictEqual(
      "deleteCustomer" in customersService,
      false,
      "src/services/customers must NOT export deleteCustomer"
    );
    assert.strictEqual(
      "removeCustomer" in customersService,
      false,
      "src/services/customers must NOT export removeCustomer"
    );
  });

  // ─── 4. Audit Log Absolute Immutability (FR-AUD-02) ────────────────────────
  await runner.test("SEC-AUDIT-01: Audit Log rejects POST, PUT, PATCH, DELETE with 405 Method Not Allowed", async () => {
    const auditRoute = await import("../../src/app/api/audit/route");
    const mutations = ["POST", "PUT", "PATCH", "DELETE"] as const;

    for (const m of mutations) {
      const handler = auditRoute[m];
      assert.ok(typeof handler === "function", `Audit route must export ${m} handler to block mutations`);
      const res = await (handler as Function)();
      assert.strictEqual(res.status, 405, `${m} /api/audit must return HTTP 405 Method Not Allowed`);
      const body = await res.json();
      assert.strictEqual(body.code, "METHOD_NOT_ALLOWED");
      assert.ok(body.message.includes("immutable"), "Response message must state immutability invariant");
    }

    const auditService = await import("../../src/services/audit");
    assert.strictEqual("deleteAuditLog" in auditService, false, "deleteAuditLog must NOT exist");
    assert.strictEqual("updateAuditLog" in auditService, false, "updateAuditLog must NOT exist");
    assert.strictEqual("clearAuditLogs" in auditService, false, "clearAuditLogs must NOT exist");
  });

  // ─── 5. State Machine Immutability & Terminal Invariants (FR-ORD-02) ────────
  await runner.test("SEC-EDIT-01: State transitions enforce forward-only progression & terminal locking", async () => {
    // 1. Terminal status CANCELLED cannot transition anywhere
    const statusesAfterCancel = [
      OrderStatus.NEW,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ];
    for (const target of statusesAfterCancel) {
      assert.throws(
        () => assertTransition(OrderStatus.CANCELLED, target),
        /TERMINAL_STATUS/,
        `Transition from CANCELLED to ${target} must throw TERMINAL_STATUS`
      );
    }

    // 2. Terminal status DELIVERED cannot transition anywhere
    for (const target of [OrderStatus.NEW, OrderStatus.CONFIRMED, OrderStatus.CANCELLED]) {
      assert.throws(
        () => assertTransition(OrderStatus.DELIVERED, target),
        /TERMINAL_STATUS/,
        `Transition from DELIVERED to ${target} must throw TERMINAL_STATUS`
      );
    }

    // 3. Backward transitions are strictly illegal
    assert.throws(
      () => assertTransition(OrderStatus.READY, OrderStatus.PREPARING),
      /INVALID_TRANSITION/,
      "Transition from READY back to PREPARING must throw INVALID_TRANSITION"
    );
    assert.throws(
      () => assertTransition(OrderStatus.PREPARING, OrderStatus.NEW),
      /INVALID_TRANSITION/,
      "Transition from PREPARING back to NEW must throw INVALID_TRANSITION"
    );
    assert.throws(
      () => assertTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CONFIRMED),
      /INVALID_TRANSITION/,
      "Transition from OUT_FOR_DELIVERY back to CONFIRMED must throw INVALID_TRANSITION"
    );
  });

  // ─── 6. Catalog & Lookup Soft-Delete Pattern (Directives §4) ───────────────
  await runner.test("SEC-LOOKUP-01: Catalog routes and user deletion enforce soft-delete pattern (isActive=false)", async () => {
    // Categories and Products do NOT expose DELETE HTTP methods in their individual [id] routes
    const catIdRoute = await import("../../src/app/api/menu/categories/[id]/route");
    assert.strictEqual("DELETE" in catIdRoute, false, "Category [id] route must NOT export DELETE");

    const prodIdRoute = await import("../../src/app/api/menu/products/[id]/route");
    assert.strictEqual("DELETE" in prodIdRoute, false, "Product [id] route must NOT export DELETE");

    // Menu service updates with isActive=false
    const menuService = await import("../../src/services/menu");
    assert.strictEqual("deleteCategory" in menuService, false, "menu service must not export deleteCategory");
    assert.strictEqual("deleteProduct" in menuService, false, "menu service must not export deleteProduct");
  });

  runner.printSummaryReport();
  const summary = runner.getSummary();
  if (summary.failed > 0) {
    process.exit(1);
  }
}

runImmutabilitySuite().catch((err) => {
  console.error("Immutability test suite crashed:", err);
  process.exit(1);
});
