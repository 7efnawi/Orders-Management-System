import assert from "node:assert";
import { openShiftSchema } from "../src/app/api/shifts/open/route";
import { closeShiftSchema } from "../src/app/api/shifts/[id]/close/route";

console.log("=== Testing Closing & Shift API Schemas & Validations ===\n");

const validUUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

// 1. openShiftSchema Tests
console.log("1. Testing openShiftSchema...");

// 1.1 Valid UUID
const validOpen = openShiftSchema.parse({ cashierId: validUUID });
assert.strictEqual(validOpen?.cashierId, validUUID);

// 1.2 Empty object
const validEmptyOpen = openShiftSchema.parse({});
assert.strictEqual(validEmptyOpen?.cashierId, undefined);

// 1.3 Undefined
const validUndefinedOpen = openShiftSchema.parse(undefined);
assert.strictEqual(validUndefinedOpen, undefined);

// 1.4 Invalid UUID rejected
assert.throws(() => {
  openShiftSchema.parse({ cashierId: "not-a-uuid" });
});

console.log("✓ openShiftSchema tests passed.\n");

// 2. closeShiftSchema Tests
console.log("2. Testing closeShiftSchema...");

// 2.1 Valid notes
const validCloseWithNotes = closeShiftSchema.parse({ notes: "End of evening shift, cash balanced." });
assert.strictEqual(validCloseWithNotes?.notes, "End of evening shift, cash balanced.");

// 2.2 Null notes
const validCloseNullNotes = closeShiftSchema.parse({ notes: null });
assert.strictEqual(validCloseNullNotes?.notes, null);

// 2.3 Empty object
const validCloseEmpty = closeShiftSchema.parse({});
assert.strictEqual(validCloseEmpty?.notes, undefined);

// 2.4 Undefined
const validCloseUndefined = closeShiftSchema.parse(undefined);
assert.strictEqual(validCloseUndefined, undefined);

// 2.5 Empty string
const validCloseEmptyString = closeShiftSchema.parse({ notes: "" });
assert.strictEqual(validCloseEmptyString?.notes, "");

console.log("✓ closeShiftSchema tests passed.\n");

console.log("ALL CLOSING & SHIFT API SCHEMA TESTS PASSED SUCCESSFULLY! 🎉");
