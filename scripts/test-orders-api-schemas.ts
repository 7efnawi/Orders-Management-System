import assert from "node:assert";
import { OrderStatus, PaymentMethod, CancelReason } from "@prisma/client";
import { createOrderSchema } from "../src/app/api/orders/route";
import { transitionSchema } from "../src/app/api/orders/[id]/status/route";
import { discountSchema } from "../src/app/api/orders/[id]/discount/route";
import { decideSchema } from "../src/app/api/orders/[id]/discount/decide/route";

console.log("Running Orders API Zod Schema Tests...\n");

const validUUID1 = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const validUUID2 = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
const validUUID3 = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";

// --- 1. createOrderSchema Tests ---
console.log("Testing createOrderSchema...");

// 1.1 Valid full order payload
const validFullPayload = {
  platformId: validUUID1,
  brandId: validUUID2,
  externalId: "TALABAT-998",
  customer: {
    name: "Ahmed Ali",
    phone: "01012345678",
    address: "123 Main St, Apt 4B",
    notes: "Ring bell twice",
  },
  zoneId: validUUID3,
  driverId: validUUID1,
  items: [
    { productId: validUUID2, quantity: 2 },
    { productId: validUUID3, quantity: 1 },
  ],
  paymentMethod: PaymentMethod.CASH,
  discount: 15,
  discountReason: "Loyalty promo",
  notes: "No onions please",
};
assert.doesNotThrow(() => {
  const result = createOrderSchema.parse(validFullPayload);
  assert.strictEqual(result.items.length, 2);
  assert.strictEqual(result.paymentMethod, "CASH");
});

// 1.2 Valid minimal payload
const validMinPayload = {
  platformId: validUUID1,
  brandId: validUUID2,
  customer: {
    name: "Sara",
    phone: "01123456789",
  },
  items: [{ productId: validUUID3, quantity: 1 }],
  paymentMethod: PaymentMethod.VISA,
};
assert.doesNotThrow(() => {
  const result = createOrderSchema.parse(validMinPayload);
  assert.strictEqual(result.items.length, 1);
});

// 1.3 Rejects empty items array
assert.throws(
  () => {
    createOrderSchema.parse({
      ...validMinPayload,
      items: [],
    });
  },
  /Array must contain at least 1 element/
);

// 1.4 Rejects invalid UUID
assert.throws(
  () => {
    createOrderSchema.parse({
      ...validMinPayload,
      brandId: "not-a-uuid",
    });
  },
  /Invalid (uuid|UUID)/
);

// 1.5 Rejects negative discount
assert.throws(
  () => {
    createOrderSchema.parse({
      ...validMinPayload,
      discount: -10,
    });
  },
  /Number must be greater than or equal to 0/
);

// 1.6 Rejects non-positive quantity
assert.throws(
  () => {
    createOrderSchema.parse({
      ...validMinPayload,
      items: [{ productId: validUUID1, quantity: 0 }],
    });
  },
  /Number must be greater than 0/
);

// 1.7 Rejects invalid payment method
assert.throws(() => {
  createOrderSchema.parse({
    ...validMinPayload,
    paymentMethod: "BITCOIN",
  });
});

// 1.8 Rejects short phone number (< 5 chars)
assert.throws(
  () => {
    createOrderSchema.parse({
      ...validMinPayload,
      customer: { name: "Sara", phone: "123" },
    });
  },
  /String must contain at least 5 character/
);

console.log("✓ createOrderSchema tests passed.\n");

// --- 2. transitionSchema Tests ---
console.log("Testing transitionSchema...");

// 2.1 Valid status
assert.doesNotThrow(() => {
  const parsed = transitionSchema.parse({ status: OrderStatus.CONFIRMED });
  assert.strictEqual(parsed.status, OrderStatus.CONFIRMED);
});

// 2.2 Valid cancellation with reason
assert.doesNotThrow(() => {
  const parsed = transitionSchema.parse({
    status: OrderStatus.CANCELLED,
    cancelReason: CancelReason.CUSTOMER_CHANGED_MIND,
  });
  assert.strictEqual(parsed.cancelReason, CancelReason.CUSTOMER_CHANGED_MIND);
});

// 2.3 Rejects invalid status string
assert.throws(() => {
  transitionSchema.parse({ status: "UNKNOWN_STATUS" });
});

// 2.4 Rejects invalid cancel reason
assert.throws(() => {
  transitionSchema.parse({
    status: OrderStatus.CANCELLED,
    cancelReason: "NOT_A_VALID_REASON",
  });
});

console.log("✓ transitionSchema tests passed.\n");

// --- 3. discountSchema Tests ---
console.log("Testing discountSchema...");

// 3.1 Valid discount request
assert.doesNotThrow(() => {
  const parsed = discountSchema.parse({
    amount: 50.5,
    reason: "Manager approval code VIP",
  });
  assert.strictEqual(parsed.amount, 50.5);
  assert.strictEqual(parsed.reason, "Manager approval code VIP");
});

// 3.2 Rejects 0 or negative amount
assert.throws(
  () => {
    discountSchema.parse({ amount: 0, reason: "Testing" });
  },
  /Number must be greater than 0/
);
assert.throws(
  () => {
    discountSchema.parse({ amount: -5, reason: "Testing" });
  },
  /Number must be greater than 0/
);

// 3.3 Rejects empty reason
assert.throws(
  () => {
    discountSchema.parse({ amount: 10, reason: "" });
  },
  /String must contain at least 1 character/
);

console.log("✓ discountSchema tests passed.\n");

// --- 4. decideSchema Tests ---
console.log("Testing decideSchema...");

// 4.1 Valid APPROVED
assert.doesNotThrow(() => {
  const parsed = decideSchema.parse({ decision: "APPROVED" });
  assert.strictEqual(parsed.decision, "APPROVED");
});

// 4.2 Valid REJECTED
assert.doesNotThrow(() => {
  const parsed = decideSchema.parse({ decision: "REJECTED" });
  assert.strictEqual(parsed.decision, "REJECTED");
});

// 4.3 Rejects invalid decision
assert.throws(() => {
  decideSchema.parse({ decision: "PENDING" });
});
assert.throws(() => {
  decideSchema.parse({ decision: "MAYBE" });
});

console.log("✓ decideSchema tests passed.\n");

console.log("ALL ORDERS API SCHEMA TESTS PASSED SUCCESSFULLY! 🎉");
