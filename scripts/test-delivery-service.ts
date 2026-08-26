import assert from "node:assert";
import { DriverType } from "@prisma/client";
import { calculateOrderTotals } from "../src/lib/orderStateMachine";
import {
  createDeliveryZone,
  updateDeliveryZone,
  createDeliveryDriver,
  updateDeliveryDriver,
  assignDriverToOrder,
} from "../src/services/delivery";

console.log("Starting Delivery Service Layer Verification Tests...\n");

async function runDeliveryServiceTests() {
  console.log("Step 1: Testing Zone input validations...");

  const testUserId = "user-test-admin";

  // Zone: invalid name
  await assert.rejects(
    async () => {
      await createDeliveryZone(testUserId, { name: "   ", fee: 10 });
    },
    /INVALID_NAME/
  );

  // Zone: negative fee
  await assert.rejects(
    async () => {
      await createDeliveryZone(testUserId, { name: "Zone A", fee: -5 });
    },
    /INVALID_FEE/
  );

  // Zone update: empty zoneId
  await assert.rejects(
    async () => {
      await updateDeliveryZone(testUserId, "", { fee: 20 });
    },
    /INVALID_ZONE_ID/
  );

  // Zone update: empty name
  await assert.rejects(
    async () => {
      await updateDeliveryZone(testUserId, "z-1", { name: "  " });
    },
    /INVALID_NAME/
  );

  // Zone update: negative fee
  await assert.rejects(
    async () => {
      await updateDeliveryZone(testUserId, "z-1", { fee: -10 });
    },
    /INVALID_FEE/
  );

  console.log("✓ Zone validation checks passed!");

  console.log("\nStep 2: Testing Driver input validations...");

  // Driver: invalid name
  await assert.rejects(
    async () => {
      await createDeliveryDriver(testUserId, { name: "", type: DriverType.OWN });
    },
    /INVALID_NAME/
  );

  // Driver: invalid type
  await assert.rejects(
    async () => {
      await createDeliveryDriver(testUserId, { name: "Driver X", type: "INVALID" as unknown as DriverType });
    },
    /INVALID_DRIVER_TYPE/
  );

  // Driver update: empty driverId
  await assert.rejects(
    async () => {
      await updateDeliveryDriver(testUserId, "", { name: "Driver Y" });
    },
    /INVALID_DRIVER_ID/
  );

  // Driver update: empty name
  await assert.rejects(
    async () => {
      await updateDeliveryDriver(testUserId, "d-1", { name: "  " });
    },
    /INVALID_NAME/
  );

  // Driver update: invalid type
  await assert.rejects(
    async () => {
      await updateDeliveryDriver(testUserId, "d-1", { type: "UNKNOWN" as unknown as DriverType });
    },
    /INVALID_DRIVER_TYPE/
  );

  console.log("✓ Driver validation checks passed!");

  console.log("\nStep 3: Testing Driver Assignment validations & calculations...");

  // Empty orderId
  await assert.rejects(
    async () => {
      await assignDriverToOrder(testUserId, "", "d-1");
    },
    /INVALID_ORDER_ID/
  );

  // Empty driverId
  await assert.rejects(
    async () => {
      await assignDriverToOrder(testUserId, "o-1", "");
    },
    /INVALID_DRIVER_ID/
  );

  // Verification of fee calculation rules
  const appCalc = calculateOrderTotals({
    items: [{ price: 100, quantity: 1 }],
    deliveryFee: 30,
    driverType: DriverType.APP,
  });
  assert.strictEqual(appCalc.netDeliveryFee, 0, "APP driver must zero out delivery fee");

  const pickupCalc = calculateOrderTotals({
    items: [{ price: 100, quantity: 1 }],
    deliveryFee: 30,
    driverType: DriverType.PICKUP,
  });
  assert.strictEqual(pickupCalc.netDeliveryFee, 0, "PICKUP driver must zero out delivery fee");

  const ownCalc = calculateOrderTotals({
    items: [{ price: 100, quantity: 1 }],
    deliveryFee: 30,
    driverType: DriverType.OWN,
  });
  assert.strictEqual(ownCalc.netDeliveryFee, 30, "OWN driver must retain zone delivery fee");

  const externalCalc = calculateOrderTotals({
    items: [{ price: 100, quantity: 1 }],
    deliveryFee: 25,
    driverType: DriverType.EXTERNAL,
  });
  assert.strictEqual(externalCalc.netDeliveryFee, 25, "EXTERNAL driver must retain zone delivery fee");

  console.log("✓ Driver assignment business rules & calculation engine verified!");

  console.log("\n=======================================================");
  console.log("All Delivery Service Layer Tests PASSED! 🎉");
  console.log("=======================================================");
}

runDeliveryServiceTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Delivery Service Tests Failed:", err);
    process.exit(1);
  });
