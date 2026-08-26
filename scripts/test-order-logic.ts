import assert from "node:assert";
import {
  OrderStatus,
  assertTransition,
  calculateOrderTotals,
  getStatusTimestampField,
  nextAllowedStatuses,
} from "../src/lib/orderStateMachine";
import { CancelReason, DriverType } from "@prisma/client";

console.log("Running State Machine & Calculation Unit Tests...\n");

// 1. Linear valid transitions
console.log("Test 1: Linear valid transitions");
assert.doesNotThrow(() => {
  assertTransition(OrderStatus.NEW, OrderStatus.CONFIRMED);
});
assert.doesNotThrow(() => {
  assertTransition(OrderStatus.CONFIRMED, OrderStatus.PREPARING);
});
assert.doesNotThrow(() => {
  assertTransition(OrderStatus.PREPARING, OrderStatus.READY);
});
assert.doesNotThrow(() => {
  assertTransition(OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY);
});
assert.doesNotThrow(() => {
  assertTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED);
});
console.log("✓ Linear transitions passed");

// 2. Invalid jump transitions
console.log("\nTest 2: Invalid jump transitions");
assert.throws(
  () => {
    assertTransition(OrderStatus.NEW, OrderStatus.DELIVERED);
  },
  /INVALID_TRANSITION/
);
assert.throws(
  () => {
    assertTransition(OrderStatus.NEW, OrderStatus.PREPARING);
  },
  /INVALID_TRANSITION/
);
assert.throws(
  () => {
    assertTransition(OrderStatus.CONFIRMED, OrderStatus.READY);
  },
  /INVALID_TRANSITION/
);
assert.throws(
  () => {
    assertTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.PREPARING);
  },
  /INVALID_TRANSITION/
);
assert.throws(
  () => {
    assertTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED, CancelReason.DELIVERY_ISSUE);
  },
  /INVALID_TRANSITION/
);
console.log("✓ Invalid jump transitions rejected");

// 3. Cancel transitions requiring CancelReason
console.log("\nTest 3: Cancel transitions requiring CancelReason");
assert.throws(
  () => {
    assertTransition(OrderStatus.NEW, OrderStatus.CANCELLED);
  },
  /CANCEL_REASON_REQUIRED/
);
assert.throws(
  () => {
    assertTransition(OrderStatus.CONFIRMED, OrderStatus.CANCELLED);
  },
  /CANCEL_REASON_REQUIRED/
);
assert.throws(
  () => {
    assertTransition(OrderStatus.PREPARING, OrderStatus.CANCELLED);
  },
  /CANCEL_REASON_REQUIRED/
);
assert.throws(
  () => {
    assertTransition(OrderStatus.READY, OrderStatus.CANCELLED);
  },
  /CANCEL_REASON_REQUIRED/
);

// Cancel with reason succeeds
assert.doesNotThrow(() => {
  assertTransition(OrderStatus.NEW, OrderStatus.CANCELLED, CancelReason.CUSTOMER_CHANGED_MIND);
});
assert.doesNotThrow(() => {
  assertTransition(OrderStatus.CONFIRMED, OrderStatus.CANCELLED, CancelReason.ITEM_UNAVAILABLE);
});
assert.doesNotThrow(() => {
  assertTransition(OrderStatus.PREPARING, OrderStatus.CANCELLED, CancelReason.QUALITY_ISSUE);
});
assert.doesNotThrow(() => {
  assertTransition(OrderStatus.READY, OrderStatus.CANCELLED, CancelReason.NO_ANSWER);
});
console.log("✓ Cancel reason requirement enforced correctly");

// 4. Terminal states cannot transition
console.log("\nTest 4: Terminal states cannot transition");
assert.throws(
  () => {
    assertTransition(OrderStatus.DELIVERED, OrderStatus.CONFIRMED);
  },
  /TERMINAL_STATUS/
);
assert.throws(
  () => {
    assertTransition(OrderStatus.DELIVERED, OrderStatus.CANCELLED, CancelReason.OTHER);
  },
  /TERMINAL_STATUS/
);
assert.throws(
  () => {
    assertTransition(OrderStatus.CANCELLED, OrderStatus.NEW);
  },
  /TERMINAL_STATUS/
);
assert.throws(
  () => {
    assertTransition(OrderStatus.CANCELLED, OrderStatus.CONFIRMED);
  },
  /TERMINAL_STATUS/
);
console.log("✓ Terminal states immutable");

// 5. Helper nextAllowedStatuses
console.log("\nTest 5: nextAllowedStatuses & getStatusTimestampField");
assert.deepStrictEqual(nextAllowedStatuses(OrderStatus.NEW), [OrderStatus.CONFIRMED, OrderStatus.CANCELLED]);
assert.deepStrictEqual(nextAllowedStatuses(OrderStatus.OUT_FOR_DELIVERY), [OrderStatus.DELIVERED]);
assert.deepStrictEqual(nextAllowedStatuses(OrderStatus.DELIVERED), []);
assert.deepStrictEqual(nextAllowedStatuses(OrderStatus.CANCELLED), []);

assert.strictEqual(getStatusTimestampField(OrderStatus.NEW), null);
assert.strictEqual(getStatusTimestampField(OrderStatus.CONFIRMED), "confirmedAt");
assert.strictEqual(getStatusTimestampField(OrderStatus.PREPARING), "preparingAt");
assert.strictEqual(getStatusTimestampField(OrderStatus.READY), "readyAt");
assert.strictEqual(getStatusTimestampField(OrderStatus.OUT_FOR_DELIVERY), "outForDeliveryAt");
assert.strictEqual(getStatusTimestampField(OrderStatus.DELIVERED), "deliveredAt");
assert.strictEqual(getStatusTimestampField(OrderStatus.CANCELLED), "cancelledAt");
console.log("✓ Helpers verified");

// 6. Calculation engine
console.log("\nTest 6: Calculation engine");
// 6a: Standard calculation with OWN driver
const calcOwn = calculateOrderTotals({
  items: [{ price: 100, quantity: 2 }, { price: 50, quantity: 1 }],
  discount: 20,
  deliveryFee: 30,
  driverType: DriverType.OWN,
});
assert.strictEqual(calcOwn.subtotal, 250);
assert.strictEqual(calcOwn.netDeliveryFee, 30);
assert.strictEqual(calcOwn.total, 260); // 250 - 20 + 30

// 6b: APP driver zeros out delivery fee
const calcApp = calculateOrderTotals({
  items: [{ price: 100, quantity: 2 }, { price: 50, quantity: 1 }],
  discount: 20,
  deliveryFee: 30,
  driverType: DriverType.APP,
});
assert.strictEqual(calcApp.subtotal, 250);
assert.strictEqual(calcApp.netDeliveryFee, 0); // Zeroed for app driver
assert.strictEqual(calcApp.total, 230); // 250 - 20 + 0

// 6c: PICKUP driver zeros out delivery fee
const calcPickup = calculateOrderTotals({
  items: [{ price: 80, quantity: 1 }],
  discount: 10,
  deliveryFee: 25,
  driverType: DriverType.PICKUP,
});
assert.strictEqual(calcPickup.subtotal, 80);
assert.strictEqual(calcPickup.netDeliveryFee, 0);
assert.strictEqual(calcPickup.total, 70); // 80 - 10 + 0

// 6d: EXTERNAL driver keeps delivery fee
const calcExternal = calculateOrderTotals({
  items: [{ price: 120, quantity: 1 }],
  discount: 0,
  deliveryFee: 20,
  driverType: DriverType.EXTERNAL,
});
assert.strictEqual(calcExternal.subtotal, 120);
assert.strictEqual(calcExternal.netDeliveryFee, 20);
assert.strictEqual(calcExternal.total, 140);

// 6e: Default / missing parameters
const calcDefaults = calculateOrderTotals({
  items: [{ price: 50, quantity: 3 }],
});
assert.strictEqual(calcDefaults.subtotal, 150);
assert.strictEqual(calcDefaults.netDeliveryFee, 0);
assert.strictEqual(calcDefaults.total, 150);

// 6f: Discount greater than subtotal (non-negative total floor)
const calcDiscountFloor = calculateOrderTotals({
  items: [{ price: 50, quantity: 1 }],
  discount: 100,
  deliveryFee: 0,
});
assert.strictEqual(calcDiscountFloor.subtotal, 50);
assert.strictEqual(calcDiscountFloor.total, 0);

console.log("✓ Calculation engine tests passed");

console.log("\n=================================");
console.log("All State Machine Tests PASSED! 🎉");
console.log("=================================");
