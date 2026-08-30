import "dotenv/config";
import assert from "node:assert";
import { Role } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import {
  listUsers,
  createUser,
  updateUser,
  ensureLocalUser,
  UserError,
} from "../src/services/users";

console.log("================================================================================");
console.log("🚀 STARTING PHASE 9 AUTOMATED VERIFICATION: USER MANAGEMENT & ROLE ACCESS CONTROL");
console.log("================================================================================\n");

async function runPhase9Verification() {
  const testOwnerEmail = "owner-verify-phase9@sushi.local";
  const testManagerEmail = "manager-verify-phase9@sushi.local";
  const testCashierEmail = "cashier-verify-phase9@sushi.local";
  const testDuplicateEmail = "duplicate-verify-phase9@sushi.local";

  let ownerUserId = "";
  let managerUserId = "";
  let cashierUserId = "";

  try {
    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 1: Setup Owner & Clean Prior Test Records
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("📍 [Step 1/6] Setting up Owner user and cleaning prior test records...");

    await prisma.auditLog.deleteMany({
      where: {
        entityType: "User",
        user: {
          email: {
            in: [testOwnerEmail, testManagerEmail, testCashierEmail, testDuplicateEmail],
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testOwnerEmail, testManagerEmail, testCashierEmail, testDuplicateEmail],
        },
      },
    });

    const owner = await prisma.user.create({
      data: {
        email: testOwnerEmail,
        name: "Phase 9 Test Owner",
        role: Role.OWNER,
        isActive: true,
      },
    });
    ownerUserId = owner.id;
    console.log(`  ✓ Owner created successfully: ${owner.email} (${owner.id})`);

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 2: Create Users (Manager & Cashier) via createUser Service
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 2/6] Creating Manager and Cashier via createUser service...");

    const manager = await createUser(ownerUserId, {
      name: "Phase 9 Test Manager",
      email: testManagerEmail,
      role: Role.MANAGER,
    });
    managerUserId = manager.id;
    assert.strictEqual(manager.email, testManagerEmail);
    assert.strictEqual(manager.role, Role.MANAGER);
    assert.strictEqual(manager.isActive, true);
    console.log(`  ✓ Manager created with atomic audit: ${manager.name} (${manager.id})`);

    const cashier = await createUser(ownerUserId, {
      name: "Phase 9 Test Cashier",
      email: testCashierEmail,
      role: Role.CASHIER,
    });
    cashierUserId = cashier.id;
    assert.strictEqual(cashier.email, testCashierEmail);
    assert.strictEqual(cashier.role, Role.CASHIER);
    assert.strictEqual(cashier.isActive, true);
    console.log(`  ✓ Cashier created with atomic audit: ${cashier.name} (${cashier.id})`);

    // Duplicate email check
    await assert.rejects(
      async () => {
        await createUser(ownerUserId, {
          name: "Duplicate User",
          email: testCashierEmail,
          role: Role.CASHIER,
        });
      },
      (err: unknown) => {
        return err instanceof UserError && err.code === "EMAIL_EXISTS";
      },
      "Duplicate email must throw EMAIL_EXISTS UserError"
    );
    console.log("  ✓ Duplicate email creation rejected with EMAIL_EXISTS error");

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 3: List and Filter Users via listUsers
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 3/6] Testing listUsers with filters and search queries...");

    const allUsers = await listUsers();
    assert.ok(allUsers.length >= 3, "All users count must include test users");

    const onlyManagers = await listUsers({ role: Role.MANAGER });
    assert.ok(onlyManagers.some((u) => u.id === managerUserId));
    assert.ok(!onlyManagers.some((u) => u.id === cashierUserId));
    console.log("  ✓ Role filter (MANAGER) returned correct subset");

    const searchResult = await listUsers({ search: "Phase 9 Test Cashier" });
    assert.strictEqual(searchResult.length, 1);
    assert.strictEqual(searchResult[0].id, cashierUserId);
    console.log("  ✓ Search filter by name returned exact user");

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 4: Update User & Self-Protection Guards
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 4/6] Testing updateUser and self-demotion/deactivation guards...");

    // Update name and promote Cashier to Manager
    const updatedCashier = await updateUser(ownerUserId, cashierUserId, {
      name: "Phase 9 Promoted Manager",
      role: Role.MANAGER,
    });
    assert.strictEqual(updatedCashier.name, "Phase 9 Promoted Manager");
    assert.strictEqual(updatedCashier.role, Role.MANAGER);
    console.log("  ✓ Promoted user role from CASHIER to MANAGER successfully");

    // Self-deactivation prevention on Owner
    await assert.rejects(
      async () => {
        await updateUser(ownerUserId, ownerUserId, { isActive: false });
      },
      (err: unknown) => {
        return err instanceof UserError && err.code === "CANNOT_DEACTIVATE_SELF";
      },
      "Owner deactivating self must throw CANNOT_DEACTIVATE_SELF"
    );
    console.log("  ✓ Self-deactivation blocked with CANNOT_DEACTIVATE_SELF");

    // Self-demotion prevention on Owner
    await assert.rejects(
      async () => {
        await updateUser(ownerUserId, ownerUserId, { role: Role.CASHIER });
      },
      (err: unknown) => {
        return err instanceof UserError && err.code === "CANNOT_DEMOTE_SELF";
      },
      "Owner demoting self must throw CANNOT_DEMOTE_SELF"
    );
    console.log("  ✓ Self-demotion blocked with CANNOT_DEMOTE_SELF");

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 5: Account Deactivation & Session Invalidation (FR-USR-03)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 5/6] Testing account deactivation and login rejection...");

    // Deactivate the promoted manager
    const deactivated = await updateUser(ownerUserId, cashierUserId, { isActive: false });
    assert.strictEqual(deactivated.isActive, false);
    console.log("  ✓ Account deactivated (isActive = false)");

    // Test ensureLocalUser with deactivated email
    const loginAttempt = await ensureLocalUser(testCashierEmail);
    assert.strictEqual(loginAttempt.ok, false);
    if (!loginAttempt.ok) {
      assert.strictEqual(loginAttempt.reason, "INACTIVE");
    }
    console.log("  ✓ Deactivated account rejected during authentication with INACTIVE reason");

    // Reactivate account
    const reactivated = await updateUser(ownerUserId, cashierUserId, { isActive: true });
    assert.strictEqual(reactivated.isActive, true);
    console.log("  ✓ Account reactivated successfully");

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 6: Delete User & Role-Based Deletion Guards
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 6/7] Testing deleteUser and role-based deletion permissions...");

    // Manager cannot delete Owner or Manager
    const { deleteUser } = await import("../src/services/users");
    await assert.rejects(
      async () => {
        await deleteUser(managerUserId, Role.MANAGER, ownerUserId);
      },
      (err: unknown) => {
        return err instanceof UserError && err.code === "FORBIDDEN_DELETE";
      },
      "Manager deleting Owner must throw FORBIDDEN_DELETE"
    );
    console.log("  ✓ Manager deleting Owner blocked with FORBIDDEN_DELETE");

    // Cannot delete self
    await assert.rejects(
      async () => {
        await deleteUser(ownerUserId, Role.OWNER, ownerUserId);
      },
      (err: unknown) => {
        return err instanceof UserError && err.code === "CANNOT_DELETE_SELF";
      },
      "Deleting self must throw CANNOT_DELETE_SELF"
    );
    console.log("  ✓ Self-deletion blocked with CANNOT_DELETE_SELF");

    // Manager cannot delete another Manager
    await assert.rejects(
      async () => {
        await deleteUser(managerUserId, Role.MANAGER, cashierUserId); // cashierUserId is currently a MANAGER
      },
      (err: unknown) => {
        return err instanceof UserError && err.code === "FORBIDDEN_DELETE";
      },
      "Manager deleting another Manager must throw FORBIDDEN_DELETE"
    );
    console.log("  ✓ Manager deleting another Manager blocked with FORBIDDEN_DELETE");

    // Owner demotes user back to CASHIER
    await updateUser(ownerUserId, cashierUserId, { role: Role.CASHIER });

    // Manager deleting Cashier succeeds
    const deletedByManager = await deleteUser(managerUserId, Role.MANAGER, cashierUserId);
    assert.strictEqual(deletedByManager.isActive, false);
    console.log("  ✓ Manager deleted Cashier successfully (isActive = false)");

    // Re-adding a previously deleted user reactivates them
    const reactivatedUser = await createUser(
      ownerUserId,
      {
        name: "Phase 9 Restored Cashier",
        email: testCashierEmail,
        role: Role.CASHIER,
        tempPassword: "TempPassword123!",
      },
      Role.OWNER
    );
    assert.strictEqual(reactivatedUser.isActive, true);
    assert.strictEqual(reactivatedUser.name, "Phase 9 Restored Cashier");
    console.log("  ✓ Re-adding previously deleted user reactivated account cleanly");

    // Deactivate user again to test reactivating via updateUser
    await updateUser(ownerUserId, cashierUserId, { isActive: false });

    // Reactivate via updateUser with tempPassword
    const reactivatedViaUpdate = await updateUser(
      ownerUserId,
      cashierUserId,
      {
        isActive: true,
        tempPassword: "NewTempPassword456!",
      },
      Role.OWNER
    );
    assert.strictEqual(reactivatedViaUpdate.isActive, true);
    console.log("  ✓ Reactivating inactive user via updateUser with tempPassword succeeded");

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 7: Atomic Audit Log Verification
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 7/7] Verifying atomic audit log trail for user operations...");

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: "User",
        entityId: { in: [managerUserId, cashierUserId] },
      },
      orderBy: { timestamp: "asc" },
    });

    assert.ok(auditLogs.length >= 5, "Must have at least 5 audit logs (CREATE + UPDATE + DELETE)");
    const createLogs = auditLogs.filter((l) => l.action === "CREATE");
    assert.ok(createLogs.length >= 2, "Must have at least 2 CREATE audit logs");
    const updateLogs = auditLogs.filter((l) => l.action === "UPDATE");
    assert.ok(updateLogs.length >= 3, "Must have multiple UPDATE audit logs");
    console.log(`  ✓ Found ${auditLogs.length} atomic audit log records validating full trace`);

    console.log("\n================================================================================");
    console.log("🎉 ALL PHASE 9 VERIFICATION CHECKS PASSED 100%!");
    console.log("================================================================================");
  } finally {
    // ─────────────────────────────────────────────────────────────────────────────
    // CLEANUP
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n🧹 Cleaning up test users and audit logs...");
    const testIds = [ownerUserId, managerUserId, cashierUserId].filter(Boolean);

    if (testIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: {
          OR: [
            { entityType: "User", entityId: { in: testIds } },
            { userId: { in: testIds } },
          ],
        },
      });

      await prisma.user.deleteMany({
        where: {
          id: { in: testIds },
        },
      });
    }
    console.log("  ✓ Test cleanup complete.");
  }
}

runPhase9Verification()
  .catch((err) => {
    console.error("\n❌ PHASE 9 VERIFICATION FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
