import "dotenv/config";
import assert from "node:assert";
import { Role, OrderStatus, PaymentMethod } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { createOrder, transitionOrderStatus, decideDiscount } from "../src/services/orders";
import { createExpense } from "../src/services/expenses";
import { updateUser } from "../src/services/users";
import {
  listAuditLogs,
  getAuditStats,
  computeAuditDiff,
  AUDIT_FIELD_DICTIONARY,
} from "../src/services/audit";
import { requireRole, AuthError, __setMockSessionUser } from "../src/lib/auth";
import { GET, POST, PUT, PATCH, DELETE } from "../src/app/api/audit/route";

console.log("================================================================================");
console.log("🚀 STARTING PHASE 10 AUTOMATED VERIFICATION: AUDIT LOG & ACTIVITY MONITORING");
console.log("================================================================================\n");

async function runPhase10Verification() {
  const testOwnerEmail = "owner-verify-phase10@sushi.local";
  const testManagerEmail = "manager-verify-phase10@sushi.local";
  const testCashierEmail = "cashier-verify-phase10@sushi.local";
  const testBrandName = "Phase 10 Verification Brand";
  const testCategoryName = "Phase 10 Category";
  const testPlatformName = "Phase 10 Direct Platform";
  const testExpenseTypeName = "Phase 10 Office Supplies";

  let ownerUserId = "";
  let managerUserId = "";
  let cashierUserId = "";

  const createdOrderIds: string[] = [];
  const createdExpenseIds: string[] = [];
  let testBrandId = "";
  let testCategoryId = "";
  let testProductId = "";
  let testPlatformId = "";
  let testExpenseTypeId = "";
  let testCustomerId = "";

  try {
    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 1: Setup & Pre-verification Cleanliness
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("📍 [Step 1/6] Setup & Pre-verification Cleanliness...");

    // Clean prior test users and related records
    const priorUsers = await prisma.user.findMany({
      where: {
        email: { in: [testOwnerEmail, testManagerEmail, testCashierEmail] },
      },
      select: { id: true },
    });
    const priorUserIds = priorUsers.map((u) => u.id);

    if (priorUserIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: {
          OR: [
            { userId: { in: priorUserIds } },
            { entityType: "User", entityId: { in: priorUserIds } },
          ],
        },
      });
      await prisma.expense.deleteMany({
        where: { createdBy: { in: priorUserIds } },
      });
      const priorOrders = await prisma.order.findMany({
        where: { cashierId: { in: priorUserIds } },
        select: { id: true },
      });
      const pOrderIds = priorOrders.map((o) => o.id);
      if (pOrderIds.length > 0) {
        await prisma.auditLog.deleteMany({
          where: { entityType: "Order", entityId: { in: pOrderIds } },
        });
        await prisma.orderItem.deleteMany({
          where: { orderId: { in: pOrderIds } },
        });
        await prisma.order.deleteMany({
          where: { id: { in: pOrderIds } },
        });
      }
      await prisma.user.deleteMany({
        where: { id: { in: priorUserIds } },
      });
    }

    // 1. Create Test Owner
    const owner = await prisma.user.create({
      data: {
        email: testOwnerEmail,
        name: "Phase 10 Test Owner",
        role: Role.OWNER,
        isActive: true,
      },
    });
    ownerUserId = owner.id;
    console.log(`  ✓ Owner created: ${owner.email} (${owner.id})`);

    // 2. Create Test Manager
    const manager = await prisma.user.create({
      data: {
        email: testManagerEmail,
        name: "Phase 10 Test Manager",
        role: Role.MANAGER,
        isActive: true,
      },
    });
    managerUserId = manager.id;
    console.log(`  ✓ Manager created: ${manager.email} (${manager.id})`);

    // 3. Create Test Cashier
    const cashier = await prisma.user.create({
      data: {
        email: testCashierEmail,
        name: "Phase 10 Test Cashier",
        role: Role.CASHIER,
        isActive: true,
      },
    });
    cashierUserId = cashier.id;
    console.log(`  ✓ Cashier created: ${cashier.email} (${cashier.id})`);

    // 4. Create Brand, Category, Product, Platform, ExpenseType
    const brand = await prisma.brand.upsert({
      where: { name: testBrandName },
      update: { isActive: true },
      create: { name: testBrandName, isActive: true },
    });
    testBrandId = brand.id;

    const category = await prisma.category.upsert({
      where: { id: "cat-verify-phase10" },
      update: { name: testCategoryName, brandId: brand.id, isActive: true },
      create: { id: "cat-verify-phase10", name: testCategoryName, brandId: brand.id, isActive: true },
    });
    testCategoryId = category.id;

    const product = await prisma.product.upsert({
      where: { id: "prod-verify-phase10" },
      update: { name: "Phase 10 Dragon Roll", price: 200, categoryId: category.id, isActive: true },
      create: {
        id: "prod-verify-phase10",
        name: "Phase 10 Dragon Roll",
        price: 200,
        categoryId: category.id,
        isActive: true,
      },
    });
    testProductId = product.id;

    const platform = await prisma.platform.upsert({
      where: { name: testPlatformName },
      update: { isActive: true },
      create: { name: testPlatformName, isActive: true },
    });
    testPlatformId = platform.id;

    const expenseType = await prisma.expenseType.upsert({
      where: { name: testExpenseTypeName },
      update: { isDefault: false },
      create: { name: testExpenseTypeName, isDefault: false, createdBy: ownerUserId },
    });
    testExpenseTypeId = expenseType.id;

    console.log("  ✓ Test dependencies provisioned cleanly.");

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 2: Atomic Audit Generation on Real Business Workflows
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 2/6] Atomic Audit Generation on Real Business Workflows...");

    // 1. Create Order with Cashier (requesting discount triggers PENDING state)
    const order = await createOrder(
      { id: cashierUserId, role: Role.CASHIER },
      {
        platformId: testPlatformId,
        brandId: testBrandId,
        customer: {
          name: "Phase 10 VIP Guest",
          phone: "01099991010",
          address: "Zamalek, Cairo",
        },
        items: [{ productId: testProductId, quantity: 2 }],
        paymentMethod: PaymentMethod.CASH,
        discount: 40,
        discountReason: "Loyalty promo",
      }
    );
    createdOrderIds.push(order.id);
    testCustomerId = order.customerId;
    console.log(`  ✓ Order created: ${order.orderNumber} (${order.id})`);

    // Verify Order Creation Audit
    const createOrderAudit = await prisma.auditLog.findFirst({
      where: { entityType: "Order", entityId: order.id, action: "CREATE" },
    });
    assert.ok(createOrderAudit, "Order creation must generate atomic CREATE AuditLog");
    assert.strictEqual(createOrderAudit.userId, cashierUserId);
    console.log("    ✓ Order creation AuditLog verified.");

    // 2. Advance Order Status: NEW -> CONFIRMED -> PREPARING
    const confirmedOrder = await transitionOrderStatus(
      cashierUserId,
      order.id,
      OrderStatus.CONFIRMED
    );
    assert.strictEqual(confirmedOrder.status, OrderStatus.CONFIRMED);

    const preparingOrder = await transitionOrderStatus(
      cashierUserId,
      order.id,
      OrderStatus.PREPARING
    );
    assert.strictEqual(preparingOrder.status, OrderStatus.PREPARING);

    const statusAudits = await prisma.auditLog.findMany({
      where: { entityType: "Order", entityId: order.id, action: "STATUS_CHANGE" },
      orderBy: { timestamp: "asc" },
    });
    assert.strictEqual(statusAudits.length, 2, "Must have exactly 2 STATUS_CHANGE audits");
    assert.deepStrictEqual(statusAudits[0].oldValue, { status: "NEW" });
    assert.deepStrictEqual(statusAudits[0].newValue, { status: "CONFIRMED" });
    assert.deepStrictEqual(statusAudits[1].oldValue, { status: "CONFIRMED" });
    assert.deepStrictEqual(statusAudits[1].newValue, { status: "PREPARING" });
    console.log("  ✓ Order transitions (NEW -> CONFIRMED -> PREPARING) verified with atomic audit trails.");

    // 3. Approve Discount by Owner
    const decidedOrder = await decideDiscount(
      { id: ownerUserId, role: Role.OWNER },
      order.id,
      "APPROVED"
    );
    assert.strictEqual(decidedOrder.discountStatus, "APPROVED");

    const discountAudit = await prisma.auditLog.findFirst({
      where: { entityType: "Order", entityId: order.id, action: "DISCOUNT_APPROVE" },
    });
    assert.ok(discountAudit, "Discount approval must generate DISCOUNT_APPROVE AuditLog");
    assert.strictEqual(discountAudit.userId, ownerUserId);
    assert.deepStrictEqual(discountAudit.oldValue, { discountStatus: "PENDING" });
    assert.deepStrictEqual(discountAudit.newValue, { discountStatus: "APPROVED" });
    console.log("  ✓ Discount approval verified with atomic DISCOUNT_APPROVE audit trail.");

    // 4. Log Expense by Cashier
    const expense = await createExpense(cashierUserId, {
      expenseTypeId: testExpenseTypeId,
      description: "Kitchen cleaning supplies",
      value: 150,
      quantity: 1,
    });
    createdExpenseIds.push(expense.id);

    const expenseAudit = await prisma.auditLog.findFirst({
      where: { entityType: "Expense", entityId: expense.id, action: "CREATE" },
    });
    assert.ok(expenseAudit, "Expense creation must generate CREATE AuditLog");
    assert.strictEqual(expenseAudit.userId, cashierUserId);
    console.log("  ✓ Expense logged and verified with atomic CREATE audit trail.");

    // 5. Promote Cashier to Manager by Owner
    const updatedUser = await updateUser(ownerUserId, cashierUserId, {
      role: Role.MANAGER,
    });
    assert.strictEqual(updatedUser.role, Role.MANAGER);

    const userAudit = await prisma.auditLog.findFirst({
      where: { entityType: "User", entityId: cashierUserId, action: "UPDATE" },
    });
    assert.ok(userAudit, "User update must generate UPDATE AuditLog");
    assert.strictEqual(userAudit.userId, ownerUserId);
    assert.strictEqual((userAudit.oldValue as any).role, Role.CASHIER);
    assert.strictEqual((userAudit.newValue as any).role, Role.MANAGER);
    console.log("  ✓ User promotion (CASHIER -> MANAGER) verified with atomic UPDATE audit trail.");

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 3: Multi-Criteria Filter Verification via Service Layer
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 3/6] Multi-Criteria Filter Verification via Service Layer...");

    // 1. Filter by action: STATUS_CHANGE
    const statusLogs = await listAuditLogs({ action: "STATUS_CHANGE" });
    assert.ok(statusLogs.logs.length >= 2, "Must return at least 2 status change logs");
    for (const log of statusLogs.logs) {
      assert.strictEqual(log.action, "STATUS_CHANGE");
    }
    console.log("  ✓ Filter by action (STATUS_CHANGE) returns strictly matching records.");

    // 2. Filter by entityType: Order vs User
    const orderLogs = await listAuditLogs({ entityType: "Order", entityId: order.id });
    assert.ok(orderLogs.logs.length >= 4, "Must return at least 4 logs for this order");
    for (const log of orderLogs.logs) {
      assert.strictEqual(log.entityType, "Order");
      assert.strictEqual(log.entityId, order.id);
    }

    const userLogs = await listAuditLogs({ entityType: "User", entityId: cashierUserId });
    assert.ok(userLogs.logs.length >= 1, "Must return at least 1 log for cashier user");
    for (const log of userLogs.logs) {
      assert.strictEqual(log.entityType, "User");
      assert.strictEqual(log.entityId, cashierUserId);
    }
    console.log("  ✓ Filter by entityType ('Order' vs 'User') accurately segregates records.");

    // 3. Filter by userId: Cashier
    const cashierLogs = await listAuditLogs({ userId: cashierUserId });
    assert.ok(cashierLogs.logs.length >= 3, "Cashier must have at least 3 audit entries");
    for (const log of cashierLogs.logs) {
      assert.strictEqual(log.userId, cashierUserId);
    }
    console.log("  ✓ Filter by userId returns exclusively records created by that user.");

    // 4. Filter by date range (today)
    const todayStr = new Date().toISOString().split("T")[0];
    const dateRangeLogs = await listAuditLogs({
      startDate: todayStr,
      endDate: todayStr,
    });
    assert.ok(dateRangeLogs.logs.length >= 5, "Today date range must capture all generated logs");
    console.log("  ✓ Filter by date range (startDate/endDate) accurately bounds results.");

    // 5. Pagination
    const page1 = await listAuditLogs({ page: 1, limit: 2 });
    assert.strictEqual(page1.page, 1);
    assert.strictEqual(page1.limit, 2);
    assert.strictEqual(page1.logs.length, 2);
    assert.ok(page1.totalPages >= 2);
    assert.ok(page1.total >= 5);
    console.log(`  ✓ Pagination verified: page 1 of ${page1.totalPages} (limit 2, total ${page1.total}).`);

    // 6. getAuditStats
    const stats = await getAuditStats();
    assert.ok(stats.totalLogs >= 5);
    assert.ok(stats.todayCount >= 5);
    assert.ok(stats.statusChangeCount >= 2);
    assert.ok(stats.criticalCount >= 1); // at least the DISCOUNT_APPROVE
    console.log(
      `  ✓ Aggregated stats verified: total=${stats.totalLogs}, today=${stats.todayCount}, statusChanges=${stats.statusChangeCount}, critical=${stats.criticalCount}.`
    );

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 4: RBAC & Access Control Verification (FR-AUD-03)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 4/6] RBAC & Access Control Verification (FR-AUD-03)...");

    // 1. requireRole("OWNER") with Owner session -> resolves cleanly
    __setMockSessionUser({
      id: ownerUserId,
      email: testOwnerEmail,
      name: "Phase 10 Test Owner",
      role: Role.OWNER,
    });
    const authOwner = await requireRole("OWNER");
    assert.strictEqual(authOwner.id, ownerUserId);
    assert.strictEqual(authOwner.role, Role.OWNER);
    console.log("  ✓ requireRole('OWNER') succeeds for Owner user.");

    // 2. requireRole("OWNER") with Manager session -> throws FORBIDDEN
    __setMockSessionUser({
      id: managerUserId,
      email: testManagerEmail,
      name: "Phase 10 Test Manager",
      role: Role.MANAGER,
    });
    await assert.rejects(
      async () => requireRole("OWNER"),
      (err: unknown) => err instanceof AuthError && err.code === "FORBIDDEN",
      "Manager attempting OWNER role check must throw AuthError('FORBIDDEN')"
    );
    console.log("  ✓ requireRole('OWNER') rejects Manager with AuthError('FORBIDDEN').");

    // 3. requireRole("OWNER") with Cashier session -> throws FORBIDDEN
    __setMockSessionUser({
      id: cashierUserId,
      email: testCashierEmail,
      name: "Phase 10 Test Cashier",
      role: Role.CASHIER,
    });
    await assert.rejects(
      async () => requireRole("OWNER"),
      (err: unknown) => err instanceof AuthError && err.code === "FORBIDDEN",
      "Cashier attempting OWNER role check must throw AuthError('FORBIDDEN')"
    );
    console.log("  ✓ requireRole('OWNER') rejects Cashier with AuthError('FORBIDDEN').");

    // 4. API Route GET /api/audit returns 403 Forbidden when user is not Owner
    const forbiddenReq = new NextRequest("http://localhost/api/audit");
    const forbiddenRes = await GET(forbiddenReq);
    assert.strictEqual(forbiddenRes.status, 403);
    const forbiddenJson = await forbiddenRes.json();
    assert.strictEqual(forbiddenJson.code, "FORBIDDEN");
    console.log("  ✓ API route GET /api/audit returns HTTP 403 FORBIDDEN for non-Owner request.");

    // 5. API Route GET /api/audit returns 200 OK when user is Owner
    __setMockSessionUser({
      id: ownerUserId,
      email: testOwnerEmail,
      name: "Phase 10 Test Owner",
      role: Role.OWNER,
    });
    const allowedReq = new NextRequest("http://localhost/api/audit?limit=5");
    const allowedRes = await GET(allowedReq);
    assert.strictEqual(allowedRes.status, 200);
    const allowedJson = await allowedRes.json();
    assert.strictEqual(allowedJson.success, true);
    assert.ok(Array.isArray(allowedJson.data.logs));
    assert.ok(allowedJson.data.stats);
    console.log("  ✓ API route GET /api/audit returns HTTP 200 OK with payload for Owner request.");

    // Reset mock session
    __setMockSessionUser(undefined);

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 5: Absolute Immutability Verification (FR-AUD-02)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 5/6] Absolute Immutability Verification (FR-AUD-02)...");

    // 1. Verify src/services/audit.ts exports zero update or delete functions
    const auditService = await import("../src/services/audit");
    const forbiddenFunctionNames = [
      "deleteAuditLog",
      "updateAuditLog",
      "clearAuditLogs",
      "removeAuditLog",
      "purgeAuditLogs",
    ];
    for (const name of forbiddenFunctionNames) {
      assert.ok(
        !(name in auditService),
        `auditService must NEVER export destructive function: ${name}`
      );
    }
    const allExports = Object.keys(auditService);
    const destructiveExports = allExports.filter((k) =>
      /delete|update|remove|clear|drop|purge/i.test(k)
    );
    assert.strictEqual(
      destructiveExports.length,
      0,
      `Destructive functions detected in audit service: ${destructiveExports.join(", ")}`
    );
    console.log("  ✓ audit service strictly adheres to append-only immutability (0 delete/update functions).");

    // 2. Verify API route exports POST, PUT, PATCH, DELETE handlers returning 405 Method Not Allowed
    const postRes = await POST();
    assert.strictEqual(postRes.status, 405);
    assert.strictEqual((await postRes.json()).code, "METHOD_NOT_ALLOWED");

    const putRes = await PUT();
    assert.strictEqual(putRes.status, 405);
    assert.strictEqual((await putRes.json()).code, "METHOD_NOT_ALLOWED");

    const patchRes = await PATCH();
    assert.strictEqual(patchRes.status, 405);
    assert.strictEqual((await patchRes.json()).code, "METHOD_NOT_ALLOWED");

    const deleteRes = await DELETE();
    assert.strictEqual(deleteRes.status, 405);
    assert.strictEqual((await deleteRes.json()).code, "METHOD_NOT_ALLOWED");
    console.log("  ✓ All API mutation methods (POST, PUT, PATCH, DELETE) strictly return HTTP 405 METHOD_NOT_ALLOWED.");

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 6: Semantic Diff Engine Precision
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 6/6] Semantic Diff Engine Precision...");

    // 1. Status Change Diff
    const statusDiff = computeAuditDiff({ status: "NEW" }, { status: "CONFIRMED" });
    assert.strictEqual(statusDiff.length, 1);
    assert.strictEqual(statusDiff[0].field, "status");
    assert.strictEqual(statusDiff[0].labelAr, "حالة الطلب");
    assert.strictEqual(statusDiff[0].oldValue, "NEW");
    assert.strictEqual(statusDiff[0].newValue, "CONFIRMED");
    assert.strictEqual(statusDiff[0].type, "status");
    console.log("  ✓ Status change diff translated cleanly to Arabic label 'حالة الطلب'.");

    // 2. Discount Diff
    const discountDiff = computeAuditDiff(
      { discount: 0, discountStatus: "NONE" },
      { discount: 50, discountStatus: "APPROVED", discountReason: "VIP Discount" }
    );
    assert.strictEqual(discountDiff.length, 3);
    const amountItem = discountDiff.find((d) => d.field === "discount");
    assert.ok(amountItem);
    assert.strictEqual(amountItem.labelAr, "مبلغ الخصم");
    assert.strictEqual(amountItem.oldValue, 0);
    assert.strictEqual(amountItem.newValue, 50);
    assert.strictEqual(amountItem.type, "currency");
    console.log("  ✓ Discount amount diff translated cleanly to Arabic label 'مبلغ الخصم'.");

    // 3. Role Promotion / Demotion Diff
    const roleDiff = computeAuditDiff({ role: "CASHIER" }, { role: "MANAGER" });
    assert.strictEqual(roleDiff.length, 1);
    assert.strictEqual(roleDiff[0].field, "role");
    assert.strictEqual(roleDiff[0].labelAr, "الدور الصلاحي");
    assert.strictEqual(roleDiff[0].oldValue, "CASHIER");
    assert.strictEqual(roleDiff[0].newValue, "MANAGER");
    assert.strictEqual(roleDiff[0].type, "role");
    console.log("  ✓ Role update diff translated cleanly to Arabic label 'الدور الصلاحي'.");

    // 4. Combined complex payload
    const complexDiff = computeAuditDiff(
      { status: "PREPARING", discount: 20, role: "CASHIER", subtotal: 300 },
      { status: "READY", discount: 35, role: "MANAGER", subtotal: 300 }
    );
    assert.strictEqual(complexDiff.length, 3, "Unchanged subtotal must be omitted from diff");
    assert.ok(complexDiff.some((d) => d.field === "status" && d.labelAr === "حالة الطلب"));
    assert.ok(complexDiff.some((d) => d.field === "discount" && d.labelAr === "مبلغ الخصم"));
    assert.ok(complexDiff.some((d) => d.field === "role" && d.labelAr === "الدور الصلاحي"));
    console.log("  ✓ Complex multi-field diff correctly isolates modifications and applies dictionary.");

    // 5. Invariance on null / identical values
    assert.deepStrictEqual(computeAuditDiff(null, null), []);
    assert.deepStrictEqual(computeAuditDiff({}, {}), []);
    assert.deepStrictEqual(
      computeAuditDiff({ status: "DELIVERED" }, { status: "DELIVERED" }),
      []
    );
    console.log("  ✓ Diff engine returns empty array for null or identical values.");

    console.log("\n================================================================================");
    console.log("🎉 ALL PHASE 10 VERIFICATION CHECKS PASSED 100%!");
    console.log("================================================================================\n");
  } finally {
    // ─────────────────────────────────────────────────────────────────────────────
    // CLEANUP
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("🧹 Cleaning up Phase 10 test artifacts...");
    __setMockSessionUser(undefined);

    const testUserIds = [ownerUserId, managerUserId, cashierUserId].filter(Boolean);

    // Delete AuditLogs
    if (testUserIds.length > 0 || createdOrderIds.length > 0 || createdExpenseIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: {
          OR: [
            { userId: { in: testUserIds } },
            { entityType: "User", entityId: { in: testUserIds } },
            { entityType: "Order", entityId: { in: createdOrderIds } },
            { entityType: "Expense", entityId: { in: createdExpenseIds } },
            ...(testExpenseTypeId
              ? [{ entityType: "ExpenseType", entityId: testExpenseTypeId }]
              : []),
          ],
        },
      });
    }

    // Delete Orders & OrderItems
    if (createdOrderIds.length > 0) {
      await prisma.orderItem.deleteMany({
        where: { orderId: { in: createdOrderIds } },
      });
      await prisma.order.deleteMany({
        where: { id: { in: createdOrderIds } },
      });
    }

    // Delete Expenses
    if (createdExpenseIds.length > 0) {
      await prisma.expense.deleteMany({
        where: { id: { in: createdExpenseIds } },
      });
    }

    // Delete ExpenseType
    if (testExpenseTypeId) {
      await prisma.expenseType.deleteMany({
        where: { id: testExpenseTypeId },
      });
    }

    // Delete Products, Category, Brand
    if (testProductId) {
      await prisma.product.deleteMany({ where: { id: testProductId } });
    }
    if (testCategoryId) {
      await prisma.category.deleteMany({ where: { id: testCategoryId } });
    }
    if (testBrandId) {
      await prisma.brand.deleteMany({ where: { id: testBrandId } });
    }

    // Delete Platform & Customer
    if (testPlatformId) {
      await prisma.platform.deleteMany({ where: { id: testPlatformId } });
    }
    if (testCustomerId) {
      await prisma.customer.deleteMany({ where: { id: testCustomerId } });
    }

    // Delete Users
    if (testUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
    }

    console.log("  ✓ Cleanup completed successfully.\n");
  }
}

runPhase10Verification()
  .catch((err) => {
    console.error("\n❌ PHASE 10 VERIFICATION FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
