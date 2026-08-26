import assert from "node:assert";
import { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import {
  calculateShiftSummary,
  roundCurrency,
  toNumber,
  type OrderSummaryItem,
  type ExpenseSummaryItem,
} from "../src/lib/closing";

console.log("Running Daily Closing & Shift Calculation Unit Tests...\n");

// 1. Helper function tests (toNumber, roundCurrency)
console.log("Test 1: toNumber & roundCurrency helpers");
assert.strictEqual(toNumber(null), 0);
assert.strictEqual(toNumber(undefined), 0);
assert.strictEqual(toNumber(123.45), 123.45);
assert.strictEqual(toNumber("123.45"), 123.45);
assert.strictEqual(toNumber("invalid"), 0);
assert.strictEqual(toNumber(new Prisma.Decimal(45.67)), 45.67);
assert.strictEqual(roundCurrency(0.1 + 0.2), 0.3);
assert.strictEqual(roundCurrency(10.555), 10.56);
console.log("✓ Helper functions passed");

// 2. Empty orders and empty expenses
console.log("\nTest 2: Empty orders & expenses");
const emptySummary = calculateShiftSummary([], []);
assert.deepStrictEqual(emptySummary, {
  totalOrders: 0,
  cancelledOrders: 0,
  activeOrders: 0,
  totalCash: 0,
  totalVisa: 0,
  totalOnline: 0,
  totalDeliveryFees: 0,
  totalExpenses: 0,
  netCash: 0,
});
console.log("✓ Empty input test passed");

// 3. Orders across payment methods (CASH, VISA, ONLINE)
console.log("\nTest 3: Payment method breakdowns for active orders");
const ordersMix: OrderSummaryItem[] = [
  {
    status: OrderStatus.DELIVERED,
    paymentMethod: PaymentMethod.CASH,
    subtotal: 100,
    discount: 0,
    deliveryFee: 20,
  },
  {
    status: OrderStatus.CONFIRMED,
    paymentMethod: PaymentMethod.VISA,
    subtotal: 250,
    discount: 50,
    deliveryFee: 0,
  },
  {
    status: OrderStatus.PREPARING,
    paymentMethod: PaymentMethod.ONLINE,
    subtotal: 300,
    discount: 30,
    deliveryFee: 15,
  },
];
const summaryMix = calculateShiftSummary(ordersMix, []);
assert.strictEqual(summaryMix.totalOrders, 3);
assert.strictEqual(summaryMix.cancelledOrders, 0);
assert.strictEqual(summaryMix.activeOrders, 3);
assert.strictEqual(summaryMix.totalCash, 120); // 100 - 0 + 20
assert.strictEqual(summaryMix.totalVisa, 200); // 250 - 50 + 0
assert.strictEqual(summaryMix.totalOnline, 285); // 300 - 30 + 15
assert.strictEqual(summaryMix.totalDeliveryFees, 35); // 20 + 0 + 15
assert.strictEqual(summaryMix.totalExpenses, 0);
assert.strictEqual(summaryMix.netCash, 120); // totalCash (120) - 0
console.log("✓ Payment method breakdown passed");

// 4. Cancelled orders handling
console.log("\nTest 4: Cancelled orders handling");
const ordersWithCancelled: OrderSummaryItem[] = [
  {
    status: OrderStatus.DELIVERED,
    paymentMethod: PaymentMethod.CASH,
    subtotal: 100,
    discount: 10,
    deliveryFee: 20, // total: 110
  },
  {
    status: OrderStatus.CANCELLED,
    paymentMethod: PaymentMethod.CASH,
    subtotal: 500,
    discount: 0,
    deliveryFee: 50, // cancelled, should not count
  },
  {
    status: OrderStatus.CANCELLED,
    paymentMethod: PaymentMethod.VISA,
    subtotal: 200,
    discount: 0,
    deliveryFee: 25, // cancelled, should not count
  },
  {
    status: "CANCELLED", // string check
    paymentMethod: "ONLINE",
    subtotal: 300,
    discount: 0,
    deliveryFee: 15, // cancelled, should not count
  },
];
const summaryCancelled = calculateShiftSummary(ordersWithCancelled, []);
assert.strictEqual(summaryCancelled.totalOrders, 4);
assert.strictEqual(summaryCancelled.cancelledOrders, 3);
assert.strictEqual(summaryCancelled.activeOrders, 1);
assert.strictEqual(summaryCancelled.totalCash, 110);
assert.strictEqual(summaryCancelled.totalVisa, 0);
assert.strictEqual(summaryCancelled.totalOnline, 0);
assert.strictEqual(summaryCancelled.totalDeliveryFees, 20);
assert.strictEqual(summaryCancelled.netCash, 110);
console.log("✓ Cancelled orders test passed");

// 5. Shift Expenses calculation
console.log("\nTest 5: Expenses aggregation");
const expenses: ExpenseSummaryItem[] = [
  { quantity: 2, value: 50 }, // 100
  { quantity: null, value: 25.5 }, // default qty 1 -> 25.5
  { quantity: 3, value: 10 }, // 30
  { value: 14.5 }, // default qty 1 -> 14.5
];
const summaryExpenses = calculateShiftSummary([], expenses);
assert.strictEqual(summaryExpenses.totalExpenses, 170); // 100 + 25.5 + 30 + 14.5
assert.strictEqual(summaryExpenses.netCash, -170); // 0 - 170
console.log("✓ Expenses aggregation passed");

// 6. Net cash reconciliation (Positive, Zero, Negative)
console.log("\nTest 6: Net cash reconciliation");
// 6a. Positive net cash
const ordersPos: OrderSummaryItem[] = [
  { status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.CASH, subtotal: 500, deliveryFee: 0 },
];
const expensesPos: ExpenseSummaryItem[] = [
  { quantity: 1, value: 150 },
];
const summaryPos = calculateShiftSummary(ordersPos, expensesPos);
assert.strictEqual(summaryPos.totalCash, 500);
assert.strictEqual(summaryPos.totalExpenses, 150);
assert.strictEqual(summaryPos.netCash, 350);

// 6b. Zero net cash
const expensesExact: ExpenseSummaryItem[] = [
  { quantity: 1, value: 500 },
];
const summaryZero = calculateShiftSummary(ordersPos, expensesExact);
assert.strictEqual(summaryZero.netCash, 0);

// 6c. Negative net cash (e.g. at start of shift when expenses paid before cash orders)
const expensesHeavy: ExpenseSummaryItem[] = [
  { quantity: 1, value: 650 },
];
const summaryNeg = calculateShiftSummary(ordersPos, expensesHeavy);
assert.strictEqual(summaryNeg.netCash, -150);
console.log("✓ Net cash scenarios passed");

// 7. Decimal and string inputs with floating-point precision
console.log("\nTest 7: Prisma.Decimal and string inputs with precision");
const decimalOrders: OrderSummaryItem[] = [
  {
    status: OrderStatus.DELIVERED,
    paymentMethod: PaymentMethod.CASH,
    subtotal: new Prisma.Decimal("199.99"),
    discount: new Prisma.Decimal("19.99"),
    deliveryFee: new Prisma.Decimal("15.50"), // total: 195.50
  },
  {
    status: OrderStatus.DELIVERED,
    paymentMethod: PaymentMethod.VISA,
    subtotal: "150.75",
    discount: "0.00",
    deliveryFee: "10.25", // total: 161.00
  },
];
const decimalExpenses: ExpenseSummaryItem[] = [
  {
    quantity: 3,
    value: new Prisma.Decimal("33.33"), // 99.99
  },
  {
    quantity: 1,
    value: "10.01", // 10.01
  },
];
const summaryDecimal = calculateShiftSummary(decimalOrders, decimalExpenses);
assert.strictEqual(summaryDecimal.totalOrders, 2);
assert.strictEqual(summaryDecimal.activeOrders, 2);
assert.strictEqual(summaryDecimal.totalCash, 195.5);
assert.strictEqual(summaryDecimal.totalVisa, 161.0);
assert.strictEqual(summaryDecimal.totalDeliveryFees, 25.75); // 15.50 + 10.25
assert.strictEqual(summaryDecimal.totalExpenses, 110.0); // 99.99 + 10.01
assert.strictEqual(summaryDecimal.netCash, 85.5); // 195.50 - 110.00
console.log("✓ Decimal and string inputs precision passed");

console.log("\n=========================================");
console.log("ALL 7 CLOSING CALCULATION TESTS PASSED! ✓");
console.log("=========================================\n");
