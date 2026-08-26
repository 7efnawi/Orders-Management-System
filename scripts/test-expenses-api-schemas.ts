import assert from "node:assert";
import { createExpenseTypeSchema } from "../src/app/api/expenses/types/route";
import { createExpenseSchema } from "../src/app/api/expenses/route";
import { updateExpenseSchema } from "../src/app/api/expenses/[id]/route";

console.log("=== Testing Expenses API Schemas & Validations ===\n");

const validUUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const validUUID2 = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

// 1. Expense Type Schemas
console.log("1. Testing createExpenseTypeSchema...");
const validType = createExpenseTypeSchema.parse({ name: "أدوات نظافة" });
assert.strictEqual(validType.name, "أدوات نظافة");

// Empty name rejected
assert.throws(() => {
  createExpenseTypeSchema.parse({ name: "" });
});

// Missing name rejected
assert.throws(() => {
  createExpenseTypeSchema.parse({});
});

// Name too long (>100 chars) rejected
assert.throws(() => {
  createExpenseTypeSchema.parse({ name: "a".repeat(101) });
});
console.log("✓ createExpenseTypeSchema tests passed.\n");

// 2. Create Expense Schema
console.log("2. Testing createExpenseSchema...");
// Full valid payload
const validFullExpense = createExpenseSchema.parse({
  expenseTypeId: validUUID,
  description: "شراء صابون وأكياس قمامة",
  quantity: 5,
  value: 250.75,
  date: "2026-08-26",
});
assert.strictEqual(validFullExpense.expenseTypeId, validUUID);
assert.strictEqual(validFullExpense.description, "شراء صابون وأكياس قمامة");
assert.strictEqual(validFullExpense.quantity, 5);
assert.strictEqual(validFullExpense.value, 250.75);
assert.strictEqual(validFullExpense.date, "2026-08-26");

// Minimal valid payload (without quantity and date)
const validMinExpense = createExpenseSchema.parse({
  expenseTypeId: validUUID,
  description: "ديلفري خارجي",
  value: 35,
});
assert.strictEqual(validMinExpense.expenseTypeId, validUUID);
assert.strictEqual(validMinExpense.description, "ديلفري خارجي");
assert.strictEqual(validMinExpense.value, 35);
assert.strictEqual(validMinExpense.quantity, undefined);
assert.strictEqual(validMinExpense.date, undefined);

// Rejects invalid UUID
assert.throws(() => {
  createExpenseSchema.parse({
    expenseTypeId: "not-a-valid-uuid",
    description: "بنزين",
    value: 50,
  });
});

// Rejects empty description
assert.throws(() => {
  createExpenseSchema.parse({
    expenseTypeId: validUUID,
    description: "",
    value: 50,
  });
});

// Rejects zero or negative value
assert.throws(() => {
  createExpenseSchema.parse({
    expenseTypeId: validUUID,
    description: "بنزين",
    value: 0,
  });
});
assert.throws(() => {
  createExpenseSchema.parse({
    expenseTypeId: validUUID,
    description: "بنزين",
    value: -20,
  });
});

// Rejects zero or negative quantity
assert.throws(() => {
  createExpenseSchema.parse({
    expenseTypeId: validUUID,
    description: "بنزين",
    quantity: 0,
    value: 50,
  });
});
assert.throws(() => {
  createExpenseSchema.parse({
    expenseTypeId: validUUID,
    description: "بنزين",
    quantity: -1,
    value: 50,
  });
});

// Rejects non-integer quantity
assert.throws(() => {
  createExpenseSchema.parse({
    expenseTypeId: validUUID,
    description: "بنزين",
    quantity: 1.5,
    value: 50,
  });
});

console.log("✓ createExpenseSchema tests passed.\n");

// 3. Update Expense Schema
console.log("3. Testing updateExpenseSchema...");
// Full valid update
const validFullUpdate = updateExpenseSchema.parse({
  expenseTypeId: validUUID2,
  description: "تعديل الوصف",
  quantity: 2,
  value: 120,
  date: "2026-08-27",
});
assert.strictEqual(validFullUpdate.expenseTypeId, validUUID2);
assert.strictEqual(validFullUpdate.description, "تعديل الوصف");
assert.strictEqual(validFullUpdate.quantity, 2);
assert.strictEqual(validFullUpdate.value, 120);

// Empty object is valid (all fields optional)
const validEmptyUpdate = updateExpenseSchema.parse({});
assert.deepStrictEqual(validEmptyUpdate, {});

// Partial update
const validPartialUpdate = updateExpenseSchema.parse({ value: 80 });
assert.strictEqual(validPartialUpdate.value, 80);

// Rejects empty description when provided
assert.throws(() => {
  updateExpenseSchema.parse({ description: "" });
});

// Rejects non-positive value
assert.throws(() => {
  updateExpenseSchema.parse({ value: 0 });
});
assert.throws(() => {
  updateExpenseSchema.parse({ value: -10 });
});

// Rejects non-positive quantity
assert.throws(() => {
  updateExpenseSchema.parse({ quantity: 0 });
});

// Rejects invalid UUID
assert.throws(() => {
  updateExpenseSchema.parse({ expenseTypeId: "not-a-uuid" });
});

console.log("✓ updateExpenseSchema tests passed.\n");

console.log("ALL EXPENSES API SCHEMA TESTS PASSED SUCCESSFULLY! 🎉");
