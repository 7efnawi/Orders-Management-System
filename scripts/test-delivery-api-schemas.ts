import assert from "node:assert";
import { DriverType } from "@prisma/client";
import { createZoneSchema } from "../src/app/api/delivery/zones/route";
import { updateZoneSchema } from "../src/app/api/delivery/zones/[id]/route";
import { createDriverSchema } from "../src/app/api/delivery/drivers/route";
import { updateDriverSchema } from "../src/app/api/delivery/drivers/[id]/route";
import { assignDriverSchema } from "../src/app/api/orders/[id]/driver/route";

console.log("=== Testing Delivery API Schemas & Validations ===");

// 1. Zone Schemas
console.log("1. Testing Zone Schemas...");
// Valid create
const validZone = createZoneSchema.parse({ name: "Downtown", fee: 15.5 });
assert.strictEqual(validZone.name, "Downtown");
assert.strictEqual(validZone.fee, 15.5);

const zeroFeeZone = createZoneSchema.parse({ name: "Free Zone", fee: 0 });
assert.strictEqual(zeroFeeZone.fee, 0);

// Invalid create: empty name
assert.throws(() => {
  createZoneSchema.parse({ name: "", fee: 20 });
}, /too_small/);

// Invalid create: negative fee
assert.throws(() => {
  createZoneSchema.parse({ name: "Maadi", fee: -5 });
}, /too_small/);

// Invalid create: missing fee
assert.throws(() => {
  createZoneSchema.parse({ name: "Maadi" });
});

// Update zone schema
const validUpdateZone1 = updateZoneSchema.parse({ name: "New Downtown" });
assert.strictEqual(validUpdateZone1.name, "New Downtown");

const validUpdateZone2 = updateZoneSchema.parse({ fee: 35, isActive: false });
assert.strictEqual(validUpdateZone2.fee, 35);
assert.strictEqual(validUpdateZone2.isActive, false);

const emptyUpdateZone = updateZoneSchema.parse({});
assert.deepStrictEqual(emptyUpdateZone, {});

assert.throws(() => {
  updateZoneSchema.parse({ name: "" });
}, /too_small/);

assert.throws(() => {
  updateZoneSchema.parse({ fee: -10 });
}, /too_small/);

// 2. Driver Schemas
console.log("2. Testing Driver Schemas...");
// Valid create
for (const type of Object.values(DriverType)) {
  const parsed = createDriverSchema.parse({ name: `Driver ${type}`, type });
  assert.strictEqual(parsed.type, type);
}

// Invalid create: empty name
assert.throws(() => {
  createDriverSchema.parse({ name: "", type: DriverType.OWN });
}, /too_small/);

// Invalid create: unknown type
assert.throws(() => {
  createDriverSchema.parse({ name: "Ahmed", type: "SPACESHIP" });
}, /invalid_enum_value/);

// Update driver schema
const validUpdateDriver = updateDriverSchema.parse({ name: "Ali", type: DriverType.APP, isActive: true });
assert.strictEqual(validUpdateDriver.name, "Ali");
assert.strictEqual(validUpdateDriver.type, DriverType.APP);
assert.strictEqual(validUpdateDriver.isActive, true);

const partialUpdateDriver = updateDriverSchema.parse({ isActive: false });
assert.strictEqual(partialUpdateDriver.isActive, false);

assert.throws(() => {
  updateDriverSchema.parse({ name: "" });
}, /too_small/);

assert.throws(() => {
  updateDriverSchema.parse({ type: "UNKNOWN" });
}, /invalid_enum_value/);

// 3. Assign Driver Schema
console.log("3. Testing Order Driver Assignment Schema...");
const validUuid = "123e4567-e89b-12d3-a456-426614174000";
const parsedAssign = assignDriverSchema.parse({ driverId: validUuid });
assert.strictEqual(parsedAssign.driverId, validUuid);

assert.throws(() => {
  assignDriverSchema.parse({ driverId: "invalid-uuid" });
}, /invalid_string/);

assert.throws(() => {
  assignDriverSchema.parse({ driverId: "" });
}, /invalid_string/);

console.log("All Delivery API Schema validation tests passed successfully! ✓");
