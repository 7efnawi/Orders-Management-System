import assert from "node:assert";
import { PaymentMethod, Role } from "@prisma/client";
import {
  createOrder,
  decideDiscount,
  requestDiscount,
} from "../src/services/orders";
import { searchCustomersByPhone } from "../src/services/customers";

console.log("Starting Customer & Order Service Layer Verification Tests...\n");

async function runServiceTests() {
  // We will run tests with an in-memory mock or transactional mock if DB is not connected,
  // or against DB if connection is active.
  console.log("Step 1: Testing customer service interface & unit behaviors...");
  
  // Test customer search prefix guards
  const emptySearch1 = await searchCustomersByPhone("");
  assert.deepStrictEqual(emptySearch1, []);
  const emptySearch2 = await searchCustomersByPhone("12");
  assert.deepStrictEqual(emptySearch2, []);

  console.log("✓ Customer search prefix guards verified");

  console.log("\nStep 2: Testing Order Creation validations & business logic rules...");

  const testCashier = { id: "user-cashier-1", role: Role.CASHIER };

  // Empty items validation
  await assert.rejects(
    async () => {
      await createOrder(testCashier, {
        platformId: "p-1",
        brandId: "b-1",
        customer: { name: "Test Cust", phone: "01000000001" },
        items: [],
        paymentMethod: PaymentMethod.CASH,
      });
    },
    /EMPTY_ORDER/
  );

  // Invalid item quantity
  await assert.rejects(
    async () => {
      await createOrder(testCashier, {
        platformId: "p-1",
        brandId: "b-1",
        customer: { name: "Test Cust", phone: "01000000001" },
        items: [{ productId: "prod-1", quantity: 0 }],
        paymentMethod: PaymentMethod.CASH,
      });
    },
    /INVALID_QUANTITY/
  );

  console.log("✓ Order input validation checks passed");

  console.log("\nStep 3: Testing Discount decision permissions & status rules...");

  // Non-manager deciding discount throws FORBIDDEN
  await assert.rejects(
    async () => {
      await decideDiscount(testCashier, "order-1", "APPROVED");
    },
    /FORBIDDEN/
  );

  // Discount request requiring reason
  await assert.rejects(
    async () => {
      await requestDiscount(testCashier, "order-1", 50, "");
    },
    /DISCOUNT_REASON_REQUIRED/
  );

  // Discount request requiring positive amount
  await assert.rejects(
    async () => {
      await requestDiscount(testCashier, "order-1", 0, "Promo");
    },
    /INVALID_DISCOUNT/
  );

  console.log("✓ Discount permission and input checks passed");

  console.log("\n=======================================================");
  console.log("All Customer & Order Service Layer Tests PASSED! 🎉");
  console.log("=======================================================");
}

runServiceTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
