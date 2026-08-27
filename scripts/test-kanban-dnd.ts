import assert from "node:assert";
import { OrderStatus } from "@prisma/client";
import { ALLOWED_TRANSITIONS } from "../src/lib/orderStateMachine";

function validateKanbanDrop(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  hasDriver: boolean
): { allowed: boolean; needsDriver?: boolean; reason?: string } {
  // Check if target is already current status
  if (currentStatus === targetStatus) {
    return { allowed: false, reason: "SAME_STATUS" };
  }

  // Handle new_confirmed combined column: if order is NEW and dropped into PREPARING, allowed via CONFIRMED
  const allowedDirect = ALLOWED_TRANSITIONS[currentStatus]?.includes(targetStatus);
  const allowedViaConfirmed =
    currentStatus === OrderStatus.NEW &&
    targetStatus === OrderStatus.PREPARING;

  if (!allowedDirect && !allowedViaConfirmed) {
    return { allowed: false, reason: "INVALID_TRANSITION" };
  }

  // If target status is OUT_FOR_DELIVERY and has no driver, prompt driver selection
  if (targetStatus === OrderStatus.OUT_FOR_DELIVERY && !hasDriver) {
    return { allowed: true, needsDriver: true };
  }

  return { allowed: true, needsDriver: false };
}

async function testKanbanDnD() {
  console.log("▶ Testing Kitchen Kanban Drag and Drop Logic & State Machine Validation...");

  // 1. Valid forward transitions
  const step1 = validateKanbanDrop(OrderStatus.CONFIRMED, OrderStatus.PREPARING, false);
  assert.strictEqual(step1.allowed, true, "CONFIRMED -> PREPARING must be allowed");
  assert.strictEqual(step1.needsDriver, false);

  const step2 = validateKanbanDrop(OrderStatus.PREPARING, OrderStatus.READY, false);
  assert.strictEqual(step2.allowed, true, "PREPARING -> READY must be allowed");

  // 2. Drop into OUT_FOR_DELIVERY without driver -> must flag needsDriver
  const step3NoDriver = validateKanbanDrop(OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY, false);
  assert.strictEqual(step3NoDriver.allowed, true);
  assert.strictEqual(step3NoDriver.needsDriver, true, "READY -> OUT_FOR_DELIVERY without driver must trigger driver modal");

  // 3. Drop into OUT_FOR_DELIVERY with driver -> proceeds directly
  const step3WithDriver = validateKanbanDrop(OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY, true);
  assert.strictEqual(step3WithDriver.allowed, true);
  assert.strictEqual(step3WithDriver.needsDriver, false);

  // 4. Drop into DELIVERED
  const step4 = validateKanbanDrop(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, true);
  assert.strictEqual(step4.allowed, true, "OUT_FOR_DELIVERY -> DELIVERED must be allowed");

  // 5. Invalid backward drops
  const invalidBackward = validateKanbanDrop(OrderStatus.DELIVERED, OrderStatus.PREPARING, true);
  assert.strictEqual(invalidBackward.allowed, false, "DELIVERED -> PREPARING must be blocked");

  const invalidSkip = validateKanbanDrop(OrderStatus.NEW, OrderStatus.DELIVERED, false);
  assert.strictEqual(invalidSkip.allowed, false, "NEW -> DELIVERED direct jump must be blocked");

  console.log("🎉 Kitchen Kanban Drag and Drop validation tests PASSED 100%!");
}

testKanbanDnD().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
