import "dotenv/config";
import assert from "node:assert";
import { Role, OrderStatus, PaymentMethod, CancelReason } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { createOrder, transitionOrderStatus } from "../src/services/orders";
import {
  findOrCreateCustomer,
  searchCustomersByPhone,
  listCustomers,
  getCustomerProfile,
  updateCustomerNotes,
} from "../src/services/customers";
import {
  determineLoyaltyTier,
  calculateCustomerStats,
  identifyProblemOrders,
  formatCustomerPhone,
} from "../src/lib/customers";
import { __setMockSessionUser } from "../src/lib/auth";
import {
  GET as getCustomersApi,
  DELETE as deleteCustomersApi,
} from "../src/app/api/customers/route";
import {
  GET as getCustomerByIdApi,
  DELETE as deleteCustomerByIdApi,
} from "../src/app/api/customers/[id]/route";

console.log("================================================================================");
console.log("🚀 STARTING PHASE 11 AUTOMATED VERIFICATION: CUSTOMER DATABASE & CRM PROFILE");
console.log("   Specification: docs/SRS.md (§FR-CUST: FR-CUST-01 through FR-CUST-08)");
console.log("================================================================================\n");

async function runPhase11Verification() {
  const testCashierEmail = "cashier-verify-phase11@sushi.local";
  const testBrandName = "Phase 11 Verification Brand";
  const testCategoryName = "Phase 11 Category";
  const testProductName = "Phase 11 Salmon Nigiri";
  const testPlatformName = "Phase 11 Delivery Platform";

  const testPhone1 = "01911110001";
  const testPhone2 = "01911110002";
  const testPhone3 = "01911110003";

  let cashierUserId = "";
  let testBrandId = "";
  let testCategoryId = "";
  let testProductId = "";
  let testPlatformId = "";

  const createdCustomerIds: string[] = [];
  const createdOrderIds: string[] = [];

  try {
    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 1: Setup & Pre-verification Cleanliness
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("📍 [Step 1/7] Setup & Pre-verification Cleanliness...");

    // 1. Clean prior test records
    const priorUsers = await prisma.user.findMany({
      where: { email: testCashierEmail },
      select: { id: true },
    });
    const priorUserIds = priorUsers.map((u) => u.id);

    const priorCustomers = await prisma.customer.findMany({
      where: {
        OR: [
          { phone: { in: [testPhone1, testPhone2, testPhone3] } },
          { phone: { startsWith: "0191111" } },
        ],
      },
      select: { id: true },
    });
    const priorCustomerIds = priorCustomers.map((c) => c.id);

    const priorOrders = await prisma.order.findMany({
      where: {
        OR: [
          { customerId: { in: priorCustomerIds } },
          { cashierId: { in: priorUserIds } },
        ],
      },
      select: { id: true },
    });
    const priorOrderIds = priorOrders.map((o) => o.id);

    if (priorOrderIds.length > 0 || priorCustomerIds.length > 0 || priorUserIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: {
          OR: [
            { userId: { in: priorUserIds } },
            { entityType: "Customer", entityId: { in: priorCustomerIds } },
            { entityType: "Order", entityId: { in: priorOrderIds } },
          ],
        },
      });

      if (priorOrderIds.length > 0) {
        await prisma.orderItem.deleteMany({
          where: { orderId: { in: priorOrderIds } },
        });
        await prisma.order.deleteMany({
          where: { id: { in: priorOrderIds } },
        });
      }

      if (priorCustomerIds.length > 0) {
        await prisma.customer.deleteMany({
          where: { id: { in: priorCustomerIds } },
        });
      }

      if (priorUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: priorUserIds } },
        });
      }
    }

    // 2. Create Test Cashier User
    const cashier = await prisma.user.create({
      data: {
        email: testCashierEmail,
        name: "Phase 11 Test Cashier",
        role: Role.CASHIER,
        isActive: true,
      },
    });
    cashierUserId = cashier.id;
    console.log(`  ✓ Cashier created: ${cashier.name} (${cashier.id})`);

    // 3. Create Brand, Category, Product, Platform
    const brand = await prisma.brand.upsert({
      where: { name: testBrandName },
      update: { isActive: true },
      create: { name: testBrandName, isActive: true },
    });
    testBrandId = brand.id;

    const category = await prisma.category.upsert({
      where: { id: "cat-verify-phase11" },
      update: { name: testCategoryName, brandId: brand.id, isActive: true },
      create: { id: "cat-verify-phase11", name: testCategoryName, brandId: brand.id, isActive: true },
    });
    testCategoryId = category.id;

    const product = await prisma.product.upsert({
      where: { id: "prod-verify-phase11" },
      update: { name: testProductName, price: 150, categoryId: category.id, isActive: true },
      create: {
        id: "prod-verify-phase11",
        name: testProductName,
        price: 150,
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

    console.log(`  ✓ Test catalog & platform created: Brand(${brand.id}), Product(${product.id}), Platform(${platform.id})`);

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 2: Auto-creation & Duplicate Prevention (FR-CUST-01, FR-CUST-02, FR-CUST-03)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 2/7] Auto-creation & Duplicate Prevention (FR-CUST-01, FR-CUST-02, FR-CUST-03)...");

    // 1. findOrCreateCustomer creates a new customer record
    const cust1 = await findOrCreateCustomer(prisma, {
      name: "Phase 11 First Cust",
      phone: testPhone1,
      address: "123 El-Thawra St, Heliopolis",
      notes: "First time sushi lover",
    });
    createdCustomerIds.push(cust1.id);

    assert.ok(cust1.id, "Customer record must have an ID");
    assert.strictEqual(cust1.phone, testPhone1, "Phone must match exactly");
    assert.strictEqual(cust1.name, "Phase 11 First Cust");
    assert.strictEqual(cust1.address, "123 El-Thawra St, Heliopolis");
    assert.strictEqual(cust1.notes, "First time sushi lover");
    console.log(`  ✓ Auto-creation succeeded: Customer ID = ${cust1.id}`);

    // 2. Supplying the same phone reuses existing ID and updates address/notes without duplicates
    const cust1Updated = await findOrCreateCustomer(prisma, {
      name: "Phase 11 First Cust Updated",
      phone: testPhone1,
      address: "Villa 45, New Cairo District 1",
      notes: "Extra ginger, no wasabi",
    });

    assert.strictEqual(cust1Updated.id, cust1.id, "Must reuse same customer ID (no duplicate record)");
    assert.strictEqual(cust1Updated.name, "Phase 11 First Cust Updated", "Name must be updated");
    assert.strictEqual(cust1Updated.address, "Villa 45, New Cairo District 1", "Address must be updated");
    assert.strictEqual(cust1Updated.notes, "Extra ginger, no wasabi", "Notes must be updated");

    const countWithPhone1 = await prisma.customer.count({
      where: { phone: testPhone1 },
    });
    assert.strictEqual(countWithPhone1, 1, "Phone uniqueness invariant: strictly 1 customer per phone");
    console.log("  ✓ Duplicate prevention verified: existing record re-used and updated in place");

    // 3. searchCustomersByPhone prefix lookup
    const prefixMatches = await searchCustomersByPhone("0191111");
    assert.ok(prefixMatches.length >= 1, "Search by prefix '0191111' must find matching record");
    assert.ok(prefixMatches.some((c) => c.phone === testPhone1), "Result must contain testPhone1");

    const shortMatches = await searchCustomersByPhone("01");
    assert.strictEqual(shortMatches.length, 0, "Prefixes shorter than 3 digits must return empty array");
    console.log("  ✓ Phone prefix search verified (>= 3 chars prefix search & short guard)");

    // 4. Phone formatting helper check
    const formatted = formatCustomerPhone("+201911110001");
    assert.strictEqual(formatted.raw, "01911110001");
    assert.ok(formatted.display.includes("019 1111 0001"));
    assert.ok(formatted.display.startsWith("\u202A"), "Must contain LTR directional isolation mark");
    console.log("  ✓ Egyptian phone normalization and LTR visual isolation confirmed");

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 3: Loyalty Tier & Lifetime Calculations (FR-CUST-06)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 3/7] Loyalty Tier & Lifetime Calculations (FR-CUST-06)...");

    // 1. Tier classification thresholds
    const tier1 = determineLoyaltyTier(1, 150);
    assert.strictEqual(tier1.tier, "BRONZE");
    assert.strictEqual(tier1.customerType, "FIRST_TIME");
    assert.strictEqual(tier1.isFirstTime, true);
    assert.strictEqual(tier1.isReturning, false);
    console.log("  ✓ Tier threshold verified: 1 order -> NEW & BRONZE");

    const tier6 = determineLoyaltyTier(6, 1200);
    assert.strictEqual(tier6.tier, "SILVER");
    assert.strictEqual(tier6.customerType, "RETURNING");
    assert.strictEqual(tier6.isFirstTime, false);
    assert.strictEqual(tier6.isReturning, true);
    console.log("  ✓ Tier threshold verified: 6 orders -> RETURNING & SILVER");

    const tier20 = determineLoyaltyTier(20, 5500);
    assert.strictEqual(tier20.tier, "GOLD");
    assert.strictEqual(tier20.customerType, "RETURNING");
    assert.strictEqual(tier20.isReturning, true);
    console.log("  ✓ Tier threshold verified: 20 orders -> RETURNING & GOLD");

    const tier35 = determineLoyaltyTier(35, 12000);
    assert.strictEqual(tier35.tier, "PLATINUM");
    assert.strictEqual(tier35.customerType, "RETURNING");
    assert.strictEqual(tier35.isReturning, true);
    console.log("  ✓ Tier threshold verified: 35 orders -> RETURNING & PLATINUM");

    // 2. Lifetime statistics & AOV calculation
    const testOrdersData = [
      {
        id: "ord-mock-1",
        status: "DELIVERED",
        subtotal: 300,
        discount: 50,
        deliveryFee: 20, // net = 270
        createdAt: new Date("2026-09-01T10:00:00Z"),
        brand: { id: "b1", name: "Tokyo Roll" },
      },
      {
        id: "ord-mock-2",
        status: "DELIVERED",
        subtotal: 250,
        discount: 0,
        deliveryFee: 15, // net = 265
        createdAt: new Date("2026-09-05T12:00:00Z"),
        brand: { id: "b1", name: "Tokyo Roll" },
      },
      {
        id: "ord-mock-3",
        status: "DELIVERED",
        subtotal: 400,
        discount: 25,
        deliveryFee: 0, // net = 375
        createdAt: new Date("2026-09-10T14:00:00Z"),
        brand: { id: "b2", name: "Kyoto Grill" },
      },
      {
        id: "ord-mock-4",
        status: "CANCELLED",
        subtotal: 300,
        discount: 0,
        deliveryFee: 20,
        cancelReason: "CUSTOMER_CHANGED_MIND",
        createdAt: new Date("2026-09-11T16:00:00Z"),
        brand: { id: "b1", name: "Tokyo Roll" },
      },
    ];

    const stats = calculateCustomerStats(testOrdersData);
    assert.strictEqual(stats.totalOrders, 4, "Total orders must be 4");
    assert.strictEqual(stats.completedOrders, 3, "Completed orders must be 3");
    assert.strictEqual(stats.cancelledOrders, 1, "Cancelled orders must be 1");
    // Net: 270 + 265 + 375 = 910 EGP (Cancelled order excluded from spend)
    assert.strictEqual(stats.lifetimeSpent, 910, "Lifetime spent must exclude cancelled orders");
    // AOV: 910 / 3 = 303.33 EGP
    assert.strictEqual(stats.aov, 303.33, "AOV must equal lifetimeSpent / completedOrders");
    assert.ok(stats.lastOrderDate, "Last order date must exist");
    assert.strictEqual(
      new Date(stats.lastOrderDate).toISOString(),
      new Date("2026-09-11T16:00:00Z").toISOString(),
      "Last order date must reflect latest timestamp"
    );
    assert.strictEqual(stats.preferredBrand, "Tokyo Roll", "Tokyo Roll (3 orders) must be preferred brand");
    console.log("  ✓ calculateCustomerStats accurately computed lifetime spent, AOV, dates, and preferred brand");

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 4: Problem Order Detection (FR-CUST-05)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 4/7] Problem Order Detection (FR-CUST-05)...");

    // Create 3 orders for Customer 2:
    // Order 1: Cancelled due to DELIVERY_ISSUE
    const order1 = await createOrder(
      { id: cashierUserId, role: Role.CASHIER },
      {
        platformId: testPlatformId,
        brandId: testBrandId,
        customer: { name: "Phase 11 Problem Cust", phone: testPhone2, address: "Delivery Issue Road" },
        items: [{ productId: testProductId, quantity: 1 }],
        paymentMethod: PaymentMethod.CASH,
      }
    );
    createdOrderIds.push(order1.id);
    createdCustomerIds.push(order1.customerId);

    await transitionOrderStatus(
      cashierUserId,
      order1.id,
      OrderStatus.CANCELLED,
      CancelReason.DELIVERY_ISSUE
    );

    // Order 2: Cancelled due to QUALITY_ISSUE
    const order2 = await createOrder(
      { id: cashierUserId, role: Role.CASHIER },
      {
        platformId: testPlatformId,
        brandId: testBrandId,
        customer: { name: "Phase 11 Problem Cust", phone: testPhone2, address: "Delivery Issue Road" },
        items: [{ productId: testProductId, quantity: 2 }],
        paymentMethod: PaymentMethod.CASH,
      }
    );
    createdOrderIds.push(order2.id);

    await transitionOrderStatus(
      cashierUserId,
      order2.id,
      OrderStatus.CANCELLED,
      CancelReason.QUALITY_ISSUE
    );

    // Order 3: Completed normally
    const order3 = await createOrder(
      { id: cashierUserId, role: Role.CASHIER },
      {
        platformId: testPlatformId,
        brandId: testBrandId,
        customer: { name: "Phase 11 Problem Cust", phone: testPhone2, address: "Delivery Issue Road" },
        items: [{ productId: testProductId, quantity: 1 }],
        paymentMethod: PaymentMethod.CASH,
      }
    );
    createdOrderIds.push(order3.id);

    await transitionOrderStatus(cashierUserId, order3.id, OrderStatus.CONFIRMED);
    await transitionOrderStatus(cashierUserId, order3.id, OrderStatus.PREPARING);
    await transitionOrderStatus(cashierUserId, order3.id, OrderStatus.READY);
    await transitionOrderStatus(cashierUserId, order3.id, OrderStatus.OUT_FOR_DELIVERY);
    await transitionOrderStatus(cashierUserId, order3.id, OrderStatus.DELIVERED);

    // Test identifyProblemOrders on customer 2 orders
    const cust2Profile = await getCustomerProfile(order1.customerId);
    assert.ok(cust2Profile, "Customer profile must exist");
    assert.strictEqual(cust2Profile.orders.length, 3, "Customer 2 must have 3 orders");

    const problems = identifyProblemOrders(cust2Profile.orders);
    assert.strictEqual(problems.hasProblems, true, "Customer 2 must have problem orders");
    assert.strictEqual(problems.totalProblems, 2, "Must identify exactly 2 problem orders");
    assert.strictEqual(problems.cancelledCount, 2, "Must count 2 cancelled orders");
    assert.strictEqual(problems.deliveryIssueCount, 1, "Must count 1 delivery issue");
    assert.strictEqual(problems.qualityIssueCount, 1, "Must count 1 quality issue");

    const problemRatio = Math.round((problems.totalProblems / cust2Profile.orders.length) * 100);
    assert.strictEqual(problemRatio, 67, "Problem order ratio must be 2/3 (67%)");
    console.log(`  ✓ identifyProblemOrders isolated 2 problem orders out of 3 (ratio: ${problemRatio}%)`);

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 5: Customer Directory & Paginated Listing Service
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 5/7] Customer Directory & Paginated Listing Service...");

    // Create Customer 3 (VIP with Gold tier: totalOrders = 20)
    const cust3 = await findOrCreateCustomer(prisma, {
      name: "Phase 11 VIP Customer",
      phone: testPhone3,
      address: "Penthouse Suite, Zamalek",
      notes: "Top VIP client",
    });
    createdCustomerIds.push(cust3.id);
    await prisma.customer.update({
      where: { id: cust3.id },
      data: { totalOrders: 20 },
    });

    // 1. Pagination
    const page1 = await listCustomers({ page: 1, limit: 10 });
    assert.strictEqual(page1.page, 1);
    assert.strictEqual(page1.limit, 10);
    assert.ok(page1.customers.length <= 10, "Page size must be <= limit");
    assert.ok(page1.total >= 3, "Total customers must include all test customers");
    assert.ok(page1.totalPages >= 1, "Total pages must be >= 1");
    console.log(`  ✓ Pagination tested: Page 1/10 returned ${page1.customers.length} records (Total: ${page1.total})`);

    // 2. Search filter by name & phone
    const searchByPhone = await listCustomers({ search: testPhone1 });
    assert.ok(searchByPhone.customers.length >= 1);
    assert.ok(searchByPhone.customers.every((c) => c.phone.includes(testPhone1)));

    const searchByName = await listCustomers({ search: "VIP Customer" });
    assert.ok(searchByName.customers.length >= 1);
    assert.ok(searchByName.customers.some((c) => c.id === cust3.id));
    console.log("  ✓ Search filter verified for both phone and name matches");

    // 3. Tier filter
    const goldTierList = await listCustomers({ search: "0191111", tier: "GOLD" });
    assert.ok(goldTierList.customers.length >= 1);
    assert.ok(goldTierList.customers.some((c) => c.id === cust3.id));
    assert.ok(goldTierList.customers.every((c) => c.tier === "GOLD"));
    console.log("  ✓ Tier filter (GOLD) isolated customer with >= 15 orders");

    // 4. Problem orders filter
    const problemCustomers = await listCustomers({ search: "0191111", hasProblems: true });
    assert.ok(problemCustomers.customers.length >= 1);
    assert.ok(problemCustomers.customers.some((c) => c.phone === testPhone2));
    assert.ok(!problemCustomers.customers.some((c) => c.phone === testPhone1));
    console.log("  ✓ Problem orders filter (hasProblems: true) isolated Customer 2 while omitting clean customers");

    // 5. Aggregated stats
    assert.ok(page1.stats.totalCustomers >= 3, "totalCustomers stat must be >= 3");
    assert.ok(page1.stats.newThisMonth >= 3, "newThisMonth stat must count recent creations");
    assert.ok(page1.stats.vipCount >= 1, "vipCount stat must reflect customers with >= 5 orders");
    assert.ok(typeof page1.stats.avgSpent === "number", "avgSpent must be a valid numeric average");
    console.log(`  ✓ Directory KPIs verified: Total=${page1.stats.totalCustomers}, New=${page1.stats.newThisMonth}, VIP=${page1.stats.vipCount}, AvgSpent=${page1.stats.avgSpent} EGP`);

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 6: Notes Editing & Transactional Audit Trail (FR-CUST-08, FR-AUD-01)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 6/7] Notes Editing & Transactional Audit Trail (FR-CUST-08, FR-AUD-01)...");

    const newPreferenceNote = "Customer prefers extra pickled ginger & tamari soy sauce. VIP special attention.";
    const updatedCust = await updateCustomerNotes(cust1.id, newPreferenceNote, cashierUserId);
    assert.strictEqual(updatedCust.notes, newPreferenceNote, "Customer notes must be updated in return object");

    const reloadedCust = await prisma.customer.findUnique({ where: { id: cust1.id } });
    assert.strictEqual(reloadedCust?.notes, newPreferenceNote, "Customer notes must be updated in database");

    // Verify AuditLog entry
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        entityType: "Customer",
        entityId: cust1.id,
        action: "UPDATE",
      },
      orderBy: { timestamp: "desc" },
    });

    assert.ok(auditRecord, "AuditLog entry must exist for customer update");
    assert.strictEqual(auditRecord.userId, cashierUserId, "Audit log must attribute actorId correctly");
    assert.strictEqual(auditRecord.action, "UPDATE");
    assert.strictEqual(auditRecord.entityType, "Customer");
    assert.strictEqual(auditRecord.entityId, cust1.id);
    assert.ok(auditRecord.oldValue, "oldValue must be recorded");
    assert.ok(auditRecord.newValue, "newValue must be recorded");

    const auditNewVal = auditRecord.newValue as Record<string, unknown>;
    assert.strictEqual(auditNewVal.notes, newPreferenceNote, "newValue must record new preference notes");
    console.log(`  ✓ Notes updated and audited atomically: AuditLog ID = ${auditRecord.id}`);

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 7: API Layer Security & Immutability (FR-CUST: No Hard Delete)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n📍 [Step 7/7] API Layer Security & Immutability (FR-CUST: No Hard Delete)...");

    // 1. Authorize session mock
    __setMockSessionUser({
      id: cashierUserId,
      email: testCashierEmail,
      name: "Phase 11 Test Cashier",
      role: Role.CASHIER,
    });

    // 2. GET /api/customers -> 200 with payload
    const getReq = new NextRequest("http://localhost:3000/api/customers?search=0191111");
    const getRes = await getCustomersApi(getReq);
    assert.strictEqual(getRes.status, 200, "GET /api/customers must return 200");
    const getPayload = await getRes.json();
    assert.ok(Array.isArray(getPayload.customers), "Payload must contain customers array");
    assert.ok(getPayload.total >= 1, "Payload total must be >= 1");
    console.log(`  ✓ GET /api/customers returned 200 OK with ${getPayload.customers.length} customers`);

    // 3. GET /api/customers/[id] -> 200 with detailed profile
    const getIdReq = new NextRequest(`http://localhost:3000/api/customers/${cust1.id}`);
    const getIdRes = await getCustomerByIdApi(getIdReq, {
      params: Promise.resolve({ id: cust1.id }),
    });
    assert.strictEqual(getIdRes.status, 200, "GET /api/customers/[id] must return 200");
    const getIdPayload = await getIdRes.json();
    assert.strictEqual(getIdPayload.id, cust1.id);
    assert.strictEqual(getIdPayload.name, cust1Updated.name);
    assert.ok(getIdPayload.metrics, "Must include customer metrics");
    assert.ok(getIdPayload.problemSummary, "Must include problem summary");
    assert.ok(getIdPayload.loyaltyTier, "Must include loyalty tier");
    console.log(`  ✓ GET /api/customers/${cust1.id} returned 200 OK with complete customer profile`);

    // 4. DELETE /api/customers -> 405 METHOD_NOT_ALLOWED
    const delCollectionRes = await deleteCustomersApi();
    assert.strictEqual(delCollectionRes.status, 405, "DELETE /api/customers must return 405");
    const delCollectionBody = await delCollectionRes.json();
    assert.strictEqual(delCollectionBody.code, "METHOD_NOT_ALLOWED");
    console.log("  ✓ DELETE /api/customers returned 405 METHOD_NOT_ALLOWED (collection immutable)");

    // 5. DELETE /api/customers/[id] -> 405 METHOD_NOT_ALLOWED
    const delIdRes = await deleteCustomerByIdApi();
    assert.strictEqual(delIdRes.status, 405, "DELETE /api/customers/[id] must return 405");
    const delIdBody = await delIdRes.json();
    assert.strictEqual(delIdBody.code, "METHOD_NOT_ALLOWED");
    console.log("  ✓ DELETE /api/customers/[id] returned 405 METHOD_NOT_ALLOWED (individual records immutable)");

    // 6. Verify Customer service exports zero delete functions
    const customerService = await import("../src/services/customers");
    assert.ok(!("deleteCustomer" in customerService), "deleteCustomer must NOT exist");
    assert.ok(!("removeCustomer" in customerService), "removeCustomer must NOT exist");
    assert.ok(!("hardDeleteCustomer" in customerService), "hardDeleteCustomer must NOT exist");
    console.log("  ✓ Customer service exports zero delete functions (strict immutability verified)");

    console.log("\n================================================================================");
    console.log("🎉 ALL PHASE 11 VERIFICATION CHECKS PASSED 100%!");
    console.log("================================================================================\n");
  } finally {
    // ─────────────────────────────────────────────────────────────────────────────
    // CLEANUP
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("🧹 Cleaning up Phase 11 test artifacts...");
    __setMockSessionUser(undefined);

    const allUserIds = [cashierUserId].filter(Boolean);
    const allCustIds = Array.from(new Set(createdCustomerIds)).filter(Boolean);
    const allOrderIds = Array.from(new Set(createdOrderIds)).filter(Boolean);

    // Delete AuditLogs
    if (allUserIds.length > 0 || allCustIds.length > 0 || allOrderIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: {
          OR: [
            { userId: { in: allUserIds } },
            { entityType: "Customer", entityId: { in: allCustIds } },
            { entityType: "Order", entityId: { in: allOrderIds } },
          ],
        },
      });
    }

    // Delete OrderItems & Orders
    if (allOrderIds.length > 0) {
      await prisma.orderItem.deleteMany({
        where: { orderId: { in: allOrderIds } },
      });
      await prisma.order.deleteMany({
        where: { id: { in: allOrderIds } },
      });
    }

    // Delete Customers
    await prisma.customer.deleteMany({
      where: {
        OR: [
          { id: { in: allCustIds } },
          { phone: { in: [testPhone1, testPhone2, testPhone3] } },
          { phone: { startsWith: "0191111" } },
        ],
      },
    });

    // Delete Catalog Items
    if (testProductId) {
      await prisma.product.deleteMany({ where: { id: testProductId } });
    }
    if (testCategoryId) {
      await prisma.category.deleteMany({ where: { id: testCategoryId } });
    }
    if (testBrandId) {
      await prisma.brand.deleteMany({ where: { id: testBrandId } });
    }
    if (testPlatformId) {
      await prisma.platform.deleteMany({ where: { id: testPlatformId } });
    }

    // Delete Cashier User
    if (cashierUserId) {
      await prisma.user.deleteMany({ where: { id: cashierUserId } });
    }

    console.log("  ✓ Cleanup completed successfully.\n");
  }
}

runPhase11Verification()
  .catch((err) => {
    console.error("\n❌ PHASE 11 VERIFICATION FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
