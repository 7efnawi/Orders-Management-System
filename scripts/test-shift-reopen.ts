import "dotenv/config";
import assert from "node:assert";
import { prisma } from "../src/lib/prisma";
import {
  openShift,
  closeShift,
  reopenShift,
  updateDailyClosing,
  getCurrentOpenShift,
} from "../src/services/closing";

async function testShiftReopen() {
  console.log("▶ Testing Owner & Manager Shift Reopening & Closing Editing...");

  // 1. Setup Cashier and Manager users
  let cashier = await prisma.user.findFirst({ where: { role: "CASHIER" } });
  if (!cashier) {
    cashier = await prisma.user.create({
      data: {
        email: "test-cashier-reopen@sushi.local",
        name: "Test Cashier Reopen",
        role: "CASHIER",
      },
    });
  }

  let manager = await prisma.user.findFirst({ where: { role: "MANAGER" } });
  if (!manager) {
    manager = await prisma.user.create({
      data: {
        email: "test-manager-reopen@sushi.local",
        name: "Test Manager Reopen",
        role: "MANAGER",
      },
    });
  }

  // Ensure no active open shift exists for test cashier
  const activeExisting = await getCurrentOpenShift(cashier.id);
  if (activeExisting) {
    await closeShift(manager.id, activeExisting.id, "Auto closed for test setup");
  }

  // 2. Cashier opens a shift
  const newShift = await openShift(cashier.id);
  assert.ok(newShift.id);
  assert.strictEqual(newShift.closedAt, null);
  console.log("✔ Shift opened:", newShift.id);

  // 3. Shift is closed
  const closeResult = await closeShift(manager.id, newShift.id, "إغلاق تجريبي للشيفت");
  assert.ok(closeResult.closing.id);
  assert.ok(closeResult.shift.closedAt !== null);
  console.log("✔ Shift closed and DailyClosing created:", closeResult.closing.id);

  // 4. Manager updates closing notes
  const updatedClosing = await updateDailyClosing(manager.id, closeResult.closing.id, {
    notes: "ملاحظات إغلاق محدثة بواسطة المدير مع تدقيق العجز والزيادة",
  });
  assert.strictEqual(
    updatedClosing.notes,
    "ملاحظات إغلاق محدثة بواسطة المدير مع تدقيق العجز والزيادة"
  );
  console.log("✔ Manager successfully updated closing notes");

  // 5. Manager reopens the closed shift
  const reopened = await reopenShift(
    manager.id,
    newShift.id,
    "إعادة فتح الشيفت لمراجعة طلبات إضافية"
  );
  assert.strictEqual(reopened.closedAt, null);
  console.log("✔ Shift reopened successfully (closedAt reset to null)");

  // 6. Verify DailyClosing was removed
  const deletedClosing = await prisma.dailyClosing.findUnique({
    where: { id: closeResult.closing.id },
  });
  assert.strictEqual(deletedClosing, null, "Associated DailyClosing must be removed upon reopen");
  console.log("✔ Previous DailyClosing record cleared successfully");

  // 7. Verify cashier now has an active open shift again
  const currentOpen = await getCurrentOpenShift(cashier.id);
  assert.ok(currentOpen, "Cashier must now have an active open shift");
  assert.strictEqual(currentOpen.id, newShift.id);
  console.log("✔ Cashier active open shift verified:", currentOpen.id);

  // 8. Clean up: close the shift again
  await closeShift(manager.id, newShift.id, "Closed after test completion");
  console.log("✔ Cleanup closing complete");

  console.log("🎉 Shift Reopening & Closing Editing verified 100%!");
}

testShiftReopen().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
