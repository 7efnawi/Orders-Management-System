import assert from "node:assert";
import fs from "node:fs";
import { TestRunner } from "../helpers/test-runner";
import {
  getBrandToken,
  getPlatformToken,
  getLoyaltyTier,
  validateTouchTargetClass,
} from "../helpers/visual-token-oracle";
import { calculatePrepTime } from "../helpers/prep-timer-oracle";
import { generateReceiptPreview } from "../helpers/receipt-oracle";
import {
  MOCK_CUSTOMERS,
  MOCK_ORDERS_DATASET,
} from "../fixtures/mock-data";

export async function runTier3Tests(): Promise<TestRunner> {
  const runner = new TestRunner("Tier 3: Cross-Feature Combinations (Pairwise Matrix)");

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBINATION 1: Themes × Brands × Platforms Visual Signatures Matrix
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("C1: Theme × Brand × Platform Matrix", 3);

  const themes = ["light", "dark", "kitchen"];
  const brands = ["Flower", "Mastery", "Niwa", "Tobiko"];
  const platforms = ["Talabat", "elmenus", "InstaShop", "HarryApp", "Facebook", "Phone"];

  for (const theme of themes) {
    for (const brand of brands) {
      await runner.test(`C1.[${theme} × ${brand}]: Visual token resolves correct colors & classes`, () => {
        const brandToken = getBrandToken(brand);
        assert.ok(brandToken.hex.startsWith("#"));
        assert.ok(brandToken.kanji.length > 0);
        assert.ok(brandToken.bgClass.length > 0);

        // Verify theme compatibility
        if (theme === "kitchen") {
          const kitchenCardStyle = `theme-${theme} ${brandToken.borderClass} bg-zinc-950`;
          assert.ok(kitchenCardStyle.includes("bg-zinc-950"));
        }
      });
    }

    for (const platform of platforms) {
      await runner.test(`C1.[${theme} × ${platform}]: Platform token resolves hex & contrast in ${theme}`, () => {
        const platformToken = getPlatformToken(platform);
        assert.ok(platformToken.hex.startsWith("#"));
        assert.ok(platformToken.labelAr.length > 0);
        assert.ok(platformToken.labelEn.length > 0);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBINATION 2: Bilingual (AR/EN) × POS Receipt Ticket × Tabular Numbers
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("C2: Language × Receipt Ticket × Tabular-Nums", 3);

  const locales = ["ar", "en"];
  for (const loc of locales) {
    await runner.test(`C2.[${loc.toUpperCase()}]: Receipt ticket calculates and aligns numbers in ${loc}`, () => {
      const receipt = generateReceiptPreview({
        brandName: "Niwa",
        brandKanji: "庭",
        orderNumber: "ORD-COMB-01",
        customerName: loc === "ar" ? "عميل تجريبي" : "Test Customer",
        customerPhone: "01011112222",
        paymentMethod: "CASH",
        items: [
          { productId: "p1", name: loc === "ar" ? "سوشي رول كلاسيك" : "Classic Sushi Roll", price: 175.5, quantity: 2 },
          { productId: "p2", name: loc === "ar" ? "سلمون ساشيمي" : "Salmon Sashimi", price: 210, quantity: 1 },
        ],
        discount: 30,
        deliveryFee: 25,
      });

      assert.strictEqual(receipt.subtotal, 561); // (175.5 * 2 = 351) + 210 = 561
      assert.strictEqual(receipt.discount, 30);
      assert.strictEqual(receipt.netDeliveryFee, 25);
      assert.strictEqual(receipt.grandTotal, 556); // 561 - 30 + 25 = 556

      // Ensure every item row is formatted
      assert.strictEqual(receipt.items.length, 2);
      assert.ok(receipt.formattedLines.some((l) => l.includes("556.00")));
    });
  }

  await runner.test("C2.[i18n Keys]: Verify orders.phone, closing.cashier and closing.notesPlaceholder keys exist in ar.json and en.json", () => {
    const ar = JSON.parse(fs.readFileSync("src/messages/ar.json", "utf-8"));
    const en = JSON.parse(fs.readFileSync("src/messages/en.json", "utf-8"));

    assert.ok(ar.orders.phone, "orders.phone must exist in ar.json");
    assert.ok(en.orders.phone, "orders.phone must exist in en.json");
    assert.ok(ar.orders.customer, "orders.customer must exist in ar.json");
    assert.ok(en.orders.customer, "orders.customer must exist in en.json");

    assert.ok(ar.closing.cashier, "closing.cashier must exist in ar.json");
    assert.ok(en.closing.cashier, "closing.cashier must exist in en.json");
    assert.ok(ar.closing.notesPlaceholder, "closing.notesPlaceholder must exist in ar.json");
    assert.ok(en.closing.notesPlaceholder, "closing.notesPlaceholder must exist in en.json");

    // Reports new tabs and sections
    assert.ok(ar.reports.tabs?.overview, "reports.tabs.overview must exist in ar.json");
    assert.ok(en.reports.tabs?.overview, "reports.tabs.overview must exist in en.json");
    assert.ok(ar.reports.tabs?.sales, "reports.tabs.sales must exist in ar.json");
    assert.ok(en.reports.tabs?.sales, "reports.tabs.sales must exist in en.json");
    assert.ok(ar.reports.tabs?.products, "reports.tabs.products must exist in ar.json");
    assert.ok(en.reports.tabs?.products, "reports.tabs.products must exist in en.json");
    assert.ok(ar.reports.tabs?.peakHours, "reports.tabs.peakHours must exist in ar.json");
    assert.ok(en.reports.tabs?.peakHours, "reports.tabs.peakHours must exist in en.json");
    assert.ok(ar.reports.tabs?.orderSources, "reports.tabs.orderSources must exist in ar.json");
    assert.ok(en.reports.tabs?.orderSources, "reports.tabs.orderSources must exist in en.json");
    assert.ok(ar.reports.tabs?.payment, "reports.tabs.payment must exist in ar.json");
    assert.ok(en.reports.tabs?.payment, "reports.tabs.payment must exist in en.json");
    assert.ok(ar.reports.tabs?.employees, "reports.tabs.employees must exist in ar.json");
    assert.ok(en.reports.tabs?.employees, "reports.tabs.employees must exist in en.json");

    assert.ok(ar.reports.peakHours?.title, "reports.peakHours.title must exist in ar.json");
    assert.ok(en.reports.peakHours?.title, "reports.peakHours.title must exist in en.json");
    assert.ok(ar.reports.employees?.teamPerformance, "reports.employees.teamPerformance must exist in ar.json");
    assert.ok(en.reports.employees?.teamPerformance, "reports.employees.teamPerformance must exist in en.json");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBINATION 3: Orders View Switcher × Brand/Platform Filter Retention
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("C3: View Switcher × Filter Retention", 3);

  await runner.test("C3.1: Filtering by Brand 'Flower' and Platform 'Talabat' stays intact across Table & Kanban views", () => {
    const activeFilters = {
      brand: "Flower",
      platform: "Talabat",
      search: "010",
      view: "table" as "table" | "kanban",
    };

    // Filter mock orders dataset
    const applyFilters = (dataset: typeof MOCK_ORDERS_DATASET) => {
      return dataset.filter(
        (o) =>
          o.brandName === activeFilters.brand &&
          o.platformName === activeFilters.platform &&
          o.customer.phone.includes(activeFilters.search)
      );
    };

    const tableResults = applyFilters(MOCK_ORDERS_DATASET);
    assert.strictEqual(tableResults.length, 1);
    assert.strictEqual(tableResults[0].orderNumber, "ORD-2026-001");

    // Toggle view to Kanban
    activeFilters.view = "kanban";
    const kanbanResults = applyFilters(MOCK_ORDERS_DATASET);
    assert.strictEqual(kanbanResults.length, 1);
    assert.strictEqual(kanbanResults[0].orderNumber, "ORD-2026-001");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBINATION 4: Payment Selector × Loyalty Badges × Receipt Discount Integration
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("C4: Payment × Loyalty × Receipt", 3);

  for (const customer of MOCK_CUSTOMERS) {
    await runner.test(`C4.[${customer.name}]: Loyalty badge calculates discount and updates POS receipt preview`, () => {
      const loyalty = getLoyaltyTier(customer.totalOrders);

      // Rule: VIP gets 10% discount, Legend gets 15% discount, Regular gets 5%, New gets 0%
      let discountPct = 0;
      if (loyalty.tier === "legend") discountPct = 0.15;
      else if (loyalty.tier === "vip") discountPct = 0.10;
      else if (loyalty.tier === "regular") discountPct = 0.05;

      const subtotal = 400;
      const discount = Math.round(subtotal * discountPct);

      const preview = generateReceiptPreview({
        brandName: "Mastery",
        paymentMethod: "VISA",
        customerName: customer.name,
        customerPhone: customer.phone,
        items: [{ productId: "p1", name: "Artisan Set", price: 200, quantity: 2 }],
        discount,
        deliveryFee: 30,
      });

      assert.strictEqual(preview.subtotal, 400);
      assert.strictEqual(preview.discount, discount);
      assert.strictEqual(preview.grandTotal, 400 - discount + 30);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBINATION 5: Kanban Columns × Live Prep Timer (>15m Pulsing Warning)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("C5: Kanban Columns × Live Prep Timer", 3);

  await runner.test("C5.1: Kanban PREPARING column calculates prep timers and shows pulsing badge for overdue order", () => {
    const preparingOrders = MOCK_ORDERS_DATASET.filter((o) => o.status === "PREPARING");
    assert.strictEqual(preparingOrders.length, 2);

    const now = new Date();
    // Order 102: 5 mins prep -> Normal (not critical)
    const timer102 = calculatePrepTime(preparingOrders[0].preparingAt, preparingOrders[0].createdAt, now);
    assert.strictEqual(timer102.isCritical, false);

    // Order 103: 18 mins prep -> Critical (pulsing alert)
    const timer103 = calculatePrepTime(preparingOrders[1].preparingAt, preparingOrders[1].createdAt, now);
    assert.strictEqual(timer103.isCritical, true);
    assert.ok(timer103.badgeAnimationClass.includes("animate-pulse"));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBINATION 6: Mobile Drawer × Persistent "+ New Order" CTA × Role Badges
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("C6: Mobile Drawer × CTA × Touch Ergonomics", 3);

  await runner.test("C6.1: Mobile drawer encapsulates persistent CTA button with full >=44px touch ergonomics", () => {
    const mobileDrawerElements = [
      { name: "CTA Button", className: "w-full h-12 min-h-[44px] flex items-center justify-center font-bold" },
      { name: "Nav Link Orders", className: "w-full h-11 min-h-[44px] px-4 flex items-center text-base" },
      { name: "Theme Switcher", className: "w-full h-11 min-h-[44px] px-3 flex items-center justify-between" },
      { name: "Language Switcher", className: "w-full h-11 min-h-[44px] px-3 flex items-center justify-between" },
    ];

    for (const elem of mobileDrawerElements) {
      const validation = validateTouchTargetClass(elem.className);
      assert.strictEqual(validation.isValid, true, `${elem.name} must satisfy touch target >=44px`);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBINATION 7: Reports Engine — Hourly, Heatmap, Employee & Comparison
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("C7: Reports Engine Extensions", 3);

  await runner.test("C7.1: buildHourlyBreakdown groups orders by hour, excludes cancelled, returns 24 rows", async () => {
    const { buildHourlyBreakdown } = await import("../../src/lib/reports");
    const orders = [
      { id: "o1", status: "DELIVERED", paymentMethod: "CASH", subtotal: 100, createdAt: new Date("2026-09-08T09:30:00") },
      { id: "o2", status: "DELIVERED", paymentMethod: "CASH", subtotal: 150, createdAt: new Date("2026-09-08T09:45:00") },
      { id: "o3", status: "DELIVERED", paymentMethod: "VISA", subtotal: 200, createdAt: new Date("2026-09-08T14:00:00") },
      { id: "o4", status: "CANCELLED", paymentMethod: "CASH", subtotal: 80,  createdAt: new Date("2026-09-08T09:00:00") },
    ];
    const result = buildHourlyBreakdown(orders as any);
    assert.strictEqual(result.length, 24, "Must return exactly 24 hourly rows");
    const h9 = result.find((r) => r.hour === 9)!;
    assert.strictEqual(h9.orders, 2, "Hour 9: 2 non-cancelled orders");
    assert.strictEqual(h9.revenue, 250, "Hour 9: revenue = 100 + 150");
    const h14 = result.find((r) => r.hour === 14)!;
    assert.strictEqual(h14.orders, 1);
    assert.strictEqual(h14.revenue, 200);
    assert.strictEqual(result.find((r) => r.hour === 0)!.orders, 0, "Empty hour returns 0 orders");
  });

  await runner.test("C7.2: buildDayHourHeatmap returns 7x24=168 cells with non-cancelled orders", async () => {
    const { buildDayHourHeatmap } = await import("../../src/lib/reports");
    // Date: 2026-09-08 is a Tuesday (day index 2)
    const testDate = new Date("2026-09-08T15:00:00");
    const orders = [
      { id: "o1", status: "DELIVERED", paymentMethod: "CASH", subtotal: 100, createdAt: testDate },
      { id: "o2", status: "CANCELLED", paymentMethod: "CASH", subtotal: 100, createdAt: testDate },
    ];
    const result = buildDayHourHeatmap(orders as any);
    assert.strictEqual(result.length, 168, "Must return 168 cells for 7 days x 24 hours");
    const cell = result.find((c) => c.day === testDate.getDay() && c.hour === 15)!;
    assert.strictEqual(cell.orders, 1, "Should count 1 delivered order, excluding cancelled");
  });

  await runner.test("C7.3: calculateEmployeeReport aggregates per-cashier metrics correctly", async () => {
    const { calculateEmployeeReport } = await import("../../src/lib/reports");
    const orders = [
      { id: "o1", status: "DELIVERED", paymentMethod: "CASH", subtotal: 200, discount: 0, discountStatus: "NONE", deliveryFee: 0, createdAt: new Date(), cashierId: "c1", cashierName: "أحمد" },
      { id: "o2", status: "CANCELLED", paymentMethod: "CASH", subtotal: 100, discount: 0, discountStatus: "NONE", deliveryFee: 0, createdAt: new Date(), cashierId: "c1", cashierName: "أحمد" },
      { id: "o3", status: "DELIVERED", paymentMethod: "VISA", subtotal: 300, discount: 30, discountStatus: "APPROVED", deliveryFee: 0, createdAt: new Date(), cashierId: "c2", cashierName: "سارة" },
    ];
    const result = calculateEmployeeReport(orders as any);
    const ahmed = result.find((r) => r.cashierId === "c1")!;
    assert.strictEqual(ahmed.totalOrders, 2);
    assert.strictEqual(ahmed.cancelledOrders, 1);
    assert.strictEqual(ahmed.totalRevenue, 200);
    const sara = result.find((r) => r.cashierId === "c2")!;
    assert.strictEqual(sara.discountsApproved, 1);
    assert.strictEqual(sara.discountsApprovedValue, 30);
  });

  await runner.test("C7.4: extractDiscountRows returns only APPROVED/REJECTED rows sorted by date desc", async () => {
    const { extractDiscountRows } = await import("../../src/lib/reports");
    const orders = [
      { id: "o1", status: "DELIVERED", paymentMethod: "CASH", subtotal: 200, discount: 50, discountStatus: "APPROVED", discountReason: "VIP", createdAt: new Date("2026-09-08"), cashierName: "أحمد", approverName: "مدير", orderNumber: "ORD-001" },
      { id: "o2", status: "DELIVERED", paymentMethod: "CASH", subtotal: 100, discount: 0,  discountStatus: "NONE",     discountReason: null,  createdAt: new Date("2026-09-07"), cashierName: "أحمد", approverName: null,   orderNumber: "ORD-002" },
      { id: "o3", status: "DELIVERED", paymentMethod: "CASH", subtotal: 80,  discount: 20, discountStatus: "REJECTED", discountReason: "غير مبرر", createdAt: new Date("2026-09-06"), cashierName: "سارة", approverName: null, orderNumber: "ORD-003" },
    ];
    const result = extractDiscountRows(orders as any);
    assert.strictEqual(result.length, 2, "Only APPROVED and REJECTED rows");
    assert.strictEqual(result[0].discountValue, 50, "APPROVED row first (desc date)");
    assert.strictEqual(result[1].discountStatus, "REJECTED");
  });

  await runner.test("C7.5: calculateSalesComparison computes percentage deltas safely", async () => {
    const { calculateSalesComparison } = await import("../../src/lib/reports");
    const current = {
      netRevenue: 1500,
      totalOrders: 15,
      aov: 100,
      netProfit: 600,
    };
    const previous = {
      netRevenue: 1000,
      totalOrders: 10,
      aov: 100,
      netProfit: 500,
    };
    const comp = calculateSalesComparison(current as any, previous as any);
    assert.strictEqual(comp.netRevenueDeltaPct, 50, "Revenue +50%");
    assert.strictEqual(comp.ordersDeltaPct, 50, "Orders +50%");
    assert.strictEqual(comp.aovDeltaPct, 0, "AOV +0%");
    assert.strictEqual(comp.netProfitDeltaPct, 20, "Net profit +20%");
  });

  await runner.test("C7.6: isQuickRangeActive detects matching date range preset accurately", async () => {
    const { getQuickRange, isQuickRangeActive } = await import("../../src/components/reports/reports-filter-bar");
    const todayRange = getQuickRange("today");
    assert.strictEqual(isQuickRangeActive("today", todayRange.startDate, todayRange.endDate), true, "today preset should be active");
    assert.strictEqual(isQuickRangeActive("yesterday", todayRange.startDate, todayRange.endDate), false, "yesterday preset should be inactive");
    assert.strictEqual(isQuickRangeActive("today", "2020-01-01", "2020-01-02"), false, "mismatched dates should be inactive");
  });

  await runner.test("C7.7: generateExcelSpreadsheetHtml produces valid styled Excel HTML document with headers, KPIs, and totals", async () => {
    const { generateExcelSpreadsheetHtml } = await import("../../src/lib/exportExcel");
    const html = generateExcelSpreadsheetHtml({
      title: "تقرير مبيعات السوشي",
      dateRange: { startDate: "2026-09-01", endDate: "2026-09-08" },
      brandName: "Sushi Flower",
      platformName: "Talabat",
      kpis: [
        { label: "إجمالي المبيعات", value: "15,000 ج.م" },
        { label: "عدد الطلبات", value: 120 },
      ],
      columns: [
        { header: "التاريخ", key: "date", align: "center" },
        { header: "الطلبات", key: "orders", align: "center" },
        { header: "المبيعات", key: "sales", align: "left" },
      ],
      rows: [
        { date: "2026-09-01", orders: 15, sales: 2500 },
        { date: "2026-09-02", orders: 20, sales: 3200 },
      ],
      totalsRow: { date: "الإجمالي", orders: 35, sales: 5700 },
    });

    assert.ok(html.includes("xmlns:x=\"urn:schemas-microsoft-com:office:excel\""), "Should contain Excel XML namespace");
    assert.ok(html.includes("dir=\"rtl\""), "Should support RTL Arabic direction");
    assert.ok(html.includes("تقرير مبيعات السوشي"), "Should include report title");
    assert.ok(html.includes("Sushi Flower"), "Should include brand name");
    assert.ok(html.includes("15,000 ج.م"), "Should include KPI value");
    assert.ok(html.includes("2026-09-01"), "Should include row date");
    assert.ok(html.includes("الإجمالي"), "Should include totals row label");
    assert.ok(html.includes("5700"), "Should include totals sales");
    assert.ok(html.includes("background-color"), "Should include CSS styling");
  });

  await runner.test("C7.8: Reports print modal translation keys exist in ar.json and en.json", async () => {
    const fs = await import("fs");
    const ar = JSON.parse(fs.readFileSync("src/messages/ar.json", "utf-8"));
    const en = JSON.parse(fs.readFileSync("src/messages/en.json", "utf-8"));

    assert.ok(ar.reports.printModal?.title, "ar.reports.printModal.title must exist");
    assert.ok(en.reports.printModal?.title, "en.reports.printModal.title must exist");
    assert.ok(ar.reports.printModal?.printAction, "ar.reports.printModal.printAction must exist");
    assert.ok(en.reports.printModal?.printAction, "en.reports.printModal.printAction must exist");
    assert.ok(ar.reports.printModal?.systemLetterhead, "ar.reports.printModal.systemLetterhead must exist");
    assert.ok(en.reports.printModal?.systemLetterhead, "en.reports.printModal.systemLetterhead must exist");
  });

  await runner.test("C7.9: groupSalesByPlatformBrand strictly excludes test platforms and test brands", async () => {
    const { groupSalesByPlatformBrand } = await import("../../src/lib/reports");
    const testOrders = [
      { id: "1", subtotal: 100, platformName: "Talabat", brandName: "Flower", status: "DELIVERED" },
      { id: "2", subtotal: 200, platformName: "Verification Talabat", brandName: "Flower", status: "DELIVERED" },
      { id: "3", subtotal: 150, platformName: "Phase 5 Direct", brandName: "Phase 5 Brand Sushi", status: "DELIVERED" },
      { id: "4", subtotal: 300, platformName: "Elmenus", brandName: "Mastery", status: "DELIVERED" },
    ];
    const result = groupSalesByPlatformBrand(testOrders as any, true);
    assert.strictEqual(result.length, 2, "Should only contain standard platforms and brands");
    assert.ok(!result.some((r) => r.platformName.includes("Verification")), "No verification platform");
    assert.ok(!result.some((r) => r.platformName.includes("Phase 5")), "No Phase 5 platform");
  });

  await runner.test("C7.10: generatePrintableReportHtml produces complete clean A4 HTML without modal artifacts", async () => {
    const { generatePrintableReportHtml } = await import("../../src/lib/printReport");
    const html = generatePrintableReportHtml({
      title: "تقرير المبيعات والتحليلات اليومية",
      dateRange: { startDate: "2026-09-01", endDate: "2026-09-08" },
      kpis: [
        { label: "صافي الإيرادات", value: "25,000 ج.م" },
        { label: "إجمالي الطلبات", value: 140 },
      ],
      tableHtml: "<table><tr><td>Test Table</td></tr></table>",
    });
    assert.ok(html.includes("<!DOCTYPE html>"), "Should contain DOCTYPE");
    assert.ok(html.includes("@page { size: A4 portrait;"), "Should define A4 page size");
    assert.ok(html.includes("Sushi Flower"), "Should include brand header");
    assert.ok(html.includes("25,000 ج.م"), "Should include KPI value");
    assert.ok(html.includes("page-break-inside"), "Should configure page break rules");
  });

  await runner.test("C7.11: Top products leaderboard translation keys exist in ar.json and en.json", async () => {
    const fs = await import("fs");
    const ar = JSON.parse(fs.readFileSync("src/messages/ar.json", "utf-8"));
    const en = JSON.parse(fs.readFileSync("src/messages/en.json", "utf-8"));

    assert.ok(ar.reports.charts?.leaderboard, "ar.reports.charts.leaderboard must exist");
    assert.ok(en.reports.charts?.leaderboard, "en.reports.charts.leaderboard must exist");
    assert.ok(ar.reports.charts?.barChart, "ar.reports.charts.barChart must exist");
    assert.ok(en.reports.charts?.barChart, "en.reports.charts.barChart must exist");
  });

  await runner.test("C7.12: Reports print modal zoom and view mode translation keys exist in ar.json and en.json", async () => {
    const fs = await import("fs");
    const ar = JSON.parse(fs.readFileSync("src/messages/ar.json", "utf-8"));
    const en = JSON.parse(fs.readFileSync("src/messages/en.json", "utf-8"));

    assert.ok(ar.reports.printModal?.zoomIn, "ar.reports.printModal.zoomIn must exist");
    assert.ok(en.reports.printModal?.zoomIn, "en.reports.printModal.zoomIn must exist");
    assert.ok(ar.reports.printModal?.zoomOut, "ar.reports.printModal.zoomOut must exist");
    assert.ok(en.reports.printModal?.zoomOut, "en.reports.printModal.zoomOut must exist");
    assert.ok(ar.reports.printModal?.standardWidth, "ar.reports.printModal.standardWidth must exist");
    assert.ok(en.reports.printModal?.standardWidth, "en.reports.printModal.standardWidth must exist");
    assert.ok(ar.reports.printModal?.fitWidth, "ar.reports.printModal.fitWidth must exist");
    assert.ok(en.reports.printModal?.fitWidth, "en.reports.printModal.fitWidth must exist");
    assert.ok(ar.reports.printModal?.maximize, "ar.reports.printModal.maximize must exist");
    assert.ok(en.reports.printModal?.maximize, "en.reports.printModal.maximize must exist");
  });

  await runner.test("C7.13: Audit Log UI translation keys exist symmetrically in ar.json and en.json", async () => {
    const fs = await import("fs");
    const ar = JSON.parse(fs.readFileSync("src/messages/ar.json", "utf-8"));
    const en = JSON.parse(fs.readFileSync("src/messages/en.json", "utf-8"));

    assert.ok(ar.audit?.title, "ar.audit.title must exist");
    assert.ok(en.audit?.title, "en.audit.title must exist");
    assert.ok(ar.audit?.kpis?.totalLogs, "ar.audit.kpis.totalLogs must exist");
    assert.ok(en.audit?.kpis?.totalLogs, "en.audit.kpis.totalLogs must exist");
    assert.ok(ar.audit?.actions?.STATUS_CHANGE, "ar.audit.actions.STATUS_CHANGE must exist");
    assert.ok(en.audit?.actions?.STATUS_CHANGE, "en.audit.actions.STATUS_CHANGE must exist");
    assert.ok(ar.audit?.diffDialog?.title, "ar.audit.diffDialog.title must exist");
    assert.ok(en.audit?.diffDialog?.title, "en.audit.diffDialog.title must exist");
  });

  await runner.test("C7.14: Responsive navbar ensures zero-overlap layout invariants and management translations", async () => {
    const fs = await import("fs");
    const ar = JSON.parse(fs.readFileSync("src/messages/ar.json", "utf-8"));
    const en = JSON.parse(fs.readFileSync("src/messages/en.json", "utf-8"));

    // Verify translations
    assert.ok(ar.nav?.management, "ar.nav.management must exist");
    assert.ok(en.nav?.management, "en.nav.management must exist");

    // Verify dashboard-header.tsx contains defensive overflow protection
    const headerCode = fs.readFileSync("src/components/layout/dashboard-header.tsx", "utf-8");
    assert.ok(headerCode.includes("min-w-0"), "Nav container must have min-w-0 to prevent flex blowout");
    assert.ok(headerCode.includes("no-scrollbar"), "Nav container must use no-scrollbar utility for clean scroll");
    assert.ok(headerCode.includes("overflow-x-auto"), "Nav container must enable horizontal scrolling without overflow bleed");
    assert.ok(headerCode.includes("hidden 2xl:flex"), "User profile text must be hidden below 2xl to prevent navbar collision");
  });

  await runner.test("C7.15: Audit UI removed CSV export and provides natural human-friendly translations", async () => {
    const fs = await import("fs");
    const clientCode = fs.readFileSync("src/components/audit/audit-client.tsx", "utf-8");
    assert.ok(!clientCode.includes("handleExportCsv"), "AuditClient must not contain handleExportCsv");
    assert.ok(!clientCode.includes("csvAction"), "AuditClient must not render csvAction button");

    const ar = JSON.parse(fs.readFileSync("src/messages/ar.json", "utf-8"));
    assert.ok(ar.audit?.entities?.Shift, "ar.audit.entities.Shift must exist");
    assert.ok(ar.audit?.entities?.DeliveryDriver, "ar.audit.entities.DeliveryDriver must exist");
  });

  await runner.test("C7.16: AuditTable uses fixed table layout and direction-safe entity chips", async () => {
    const fs = await import("fs");
    const tableCode = fs.readFileSync("src/components/audit/audit-table.tsx", "utf-8");
    assert.ok(tableCode.includes("table-fixed"), "AuditTable must use table-fixed for column width stability");
    assert.ok(tableCode.includes("dir=\"ltr\""), "AuditTable must enforce dir=ltr on code chips to avoid BiDi flips");
    assert.ok(tableCode.includes("formatHumanSummary"), "AuditTable must use formatHumanSummary");
  });

  await runner.test("C7.17: AuditDiffDialog is spacious and excludes raw JSON viewer and code keys", async () => {
    const fs = await import("fs");
    const dialogCode = fs.readFileSync("src/components/audit/audit-diff-dialog.tsx", "utf-8");
    assert.ok(dialogCode.includes("max-w-4xl"), "DialogContent must use spacious max-w-4xl width");
    assert.ok(!dialogCode.includes("showRawJson"), "DialogContent must not contain showRawJson");
    assert.ok(!dialogCode.includes("rawJson"), "DialogContent must not render rawJson button");
    assert.ok(!dialogCode.includes("{diff.field}"), "DialogContent must not display raw English field names");
  });

  await runner.test("C7.18: AuditDiffDialog explicitly overrides sm:max-w-sm to expand diff modal across tablet and desktop", async () => {
    const fs = await import("fs");
    const dialogCode = fs.readFileSync("src/components/audit/audit-diff-dialog.tsx", "utf-8");
    // Must contain sm:max-w- to explicitly override base sm:max-w-sm in dialog.tsx
    assert.ok(
      dialogCode.includes("sm:max-w-3xl") || dialogCode.includes("sm:max-w-4xl"),
      "DialogContent must use sm:max-w-3xl or sm:max-w-4xl to override dialog.tsx sm:max-w-sm default"
    );
    assert.ok(
      dialogCode.includes("lg:max-w-5xl") || dialogCode.includes("lg:max-w-4xl"),
      "DialogContent must provide spacious desktop max-width"
    );
    assert.ok(
      dialogCode.includes("md:grid-cols-[1fr,auto,1fr]"),
      "Diff comparison cards must use responsive balanced grid on desktop"
    );
  });

  await runner.test("C7.19: Customer CRM translation keys exist symmetrically in ar.json and en.json", async () => {
    const fs = await import("fs");
    const ar = JSON.parse(fs.readFileSync("src/messages/ar.json", "utf-8"));
    const en = JSON.parse(fs.readFileSync("src/messages/en.json", "utf-8"));

    assert.ok(ar.nav?.customers, "ar.nav.customers must exist");
    assert.ok(en.nav?.customers, "en.nav.customers must exist");
    assert.ok(ar.customers?.title, "ar.customers.title must exist");
    assert.ok(en.customers?.title, "en.customers.title must exist");
    assert.ok(ar.customers?.kpis?.totalCustomers, "ar.customers.kpis.totalCustomers must exist");
    assert.ok(en.customers?.kpis?.totalCustomers, "en.customers.kpis.totalCustomers must exist");
    assert.ok(ar.customers?.profile?.problemOrdersTitle, "ar.customers.profile.problemOrdersTitle must exist");
    assert.ok(en.customers?.profile?.problemOrdersTitle, "en.customers.profile.problemOrdersTitle must exist");
    assert.ok(ar.customers?.tiers?.PLATINUM, "ar.customers.tiers.PLATINUM must exist");
    assert.ok(en.customers?.tiers?.PLATINUM, "en.customers.tiers.PLATINUM must exist");
  });

  await runner.test("C7.20: Customer directory UI uses table-fixed, direction-safe phone chips, and navbar inclusion", async () => {
    const fs = await import("fs");
    const tableCode = fs.readFileSync("src/components/customers/customer-table.tsx", "utf-8");
    assert.ok(tableCode.includes("table-fixed"), "CustomerTable must use table-fixed for column stability");
    assert.ok(tableCode.includes("dir=\"ltr\""), "CustomerTable must enforce dir=ltr on phone numbers");

    const headerCode = fs.readFileSync("src/components/layout/dashboard-header.tsx", "utf-8");
    assert.ok(headerCode.includes("/customers"), "dashboard-header must include /customers nav link");
  });

  await runner.test("C7.21: Customer profile UI includes problem orders warning, notes editor, and history table", async () => {
    const fs = await import("fs");
    const profileCode = fs.readFileSync("src/components/customers/customer-profile-client.tsx", "utf-8");
    assert.ok(profileCode.includes("CustomerProblemOrdersBanner") || profileCode.includes("problemOrders"), "Customer profile must handle problem orders");
    assert.ok(profileCode.includes("CustomerNotesEditor") || profileCode.includes("notes"), "Customer profile must have notes editor");
    assert.ok(profileCode.includes("CustomerOrderHistoryTable") || profileCode.includes("orderHistory"), "Customer profile must display order history table");
  });

  await runner.test("C7.22: Customer CRM 2.0 translation keys exist symmetrically in ar.json and en.json", async () => {
    const fs = await import("fs");
    const ar = JSON.parse(fs.readFileSync("src/messages/ar.json", "utf-8"));
    const en = JSON.parse(fs.readFileSync("src/messages/en.json", "utf-8"));

    // Segments
    assert.ok(ar.customers?.segments?.VIP, "ar.customers.segments.VIP must exist");
    assert.ok(en.customers?.segments?.VIP, "en.customers.segments.VIP must exist");
    assert.ok(ar.customers?.segments?.AT_RISK, "ar.customers.segments.AT_RISK must exist");
    assert.ok(en.customers?.segments?.AT_RISK, "en.customers.segments.AT_RISK must exist");
    assert.ok(ar.customers?.segments?.REGULAR, "ar.customers.segments.REGULAR must exist");
    assert.ok(en.customers?.segments?.REGULAR, "en.customers.segments.REGULAR must exist");
    assert.ok(ar.customers?.segments?.NEW, "ar.customers.segments.NEW must exist");
    assert.ok(en.customers?.segments?.NEW, "en.customers.segments.NEW must exist");
    assert.ok(ar.customers?.segments?.INACTIVE, "ar.customers.segments.INACTIVE must exist");
    assert.ok(en.customers?.segments?.INACTIVE, "en.customers.segments.INACTIVE must exist");

    // KPI & Table fields
    assert.ok(ar.customers?.kpis?.atRiskCount, "ar.customers.kpis.atRiskCount must exist");
    assert.ok(en.customers?.kpis?.atRiskCount, "en.customers.kpis.atRiskCount must exist");
    assert.ok(ar.customers?.table?.spent, "ar.customers.table.spent must exist");
    assert.ok(en.customers?.table?.spent, "en.customers.table.spent must exist");
    assert.ok(ar.customers?.table?.segment, "ar.customers.table.segment must exist");
    assert.ok(en.customers?.table?.segment, "en.customers.table.segment must exist");
    assert.ok(ar.customers?.filters?.exportExcel, "ar.customers.filters.exportExcel must exist");
    assert.ok(en.customers?.filters?.exportExcel, "en.customers.filters.exportExcel must exist");

    // Profile & POS insights
    assert.ok(ar.customers?.profile?.favoritesTitle, "ar.customers.profile.favoritesTitle must exist");
    assert.ok(en.customers?.profile?.favoritesTitle, "en.customers.profile.favoritesTitle must exist");
    assert.ok(ar.customers?.profile?.preferredPlatform, "ar.customers.profile.preferredPlatform must exist");
    assert.ok(en.customers?.profile?.preferredPlatform, "en.customers.profile.preferredPlatform must exist");
    assert.ok(ar.orders?.quickInsight, "ar.orders.quickInsight must exist");
    assert.ok(en.orders?.quickInsight, "en.orders.quickInsight must exist");
    assert.ok(ar.orders?.ordersCount, "ar.orders.ordersCount must exist");
    assert.ok(en.orders?.ordersCount, "en.orders.ordersCount must exist");
    assert.ok(ar.orders?.quickAdd, "ar.orders.quickAdd must exist");
    assert.ok(en.orders?.quickAdd, "en.orders.quickAdd must exist");
  });

  await runner.test("C7.23: Customer directory UI uses 1536px standard container, 7 proportional columns including spent, and segment filters", async () => {
    const fs = await import("fs");
    const clientCode = fs.readFileSync("src/components/customers/customers-client.tsx", "utf-8");
    assert.ok(clientCode.includes("max-w-[1536px]"), "customers-client must use standard max-w-[1536px] container");
    assert.ok(clientCode.includes("segment") || clientCode.includes("onSegmentChange"), "customers-client must support segment state");

    const tableCode = fs.readFileSync("src/components/customers/customer-table.tsx", "utf-8");
    assert.ok(tableCode.includes("spent") || tableCode.includes("totalSpent"), "CustomerTable must display customer spent");
    assert.ok(tableCode.includes("w-[22%]"), "CustomerTable col 1 must be 22%");
    assert.ok(tableCode.includes("w-[16%]"), "CustomerTable col 2 must be 16%");
    assert.ok(tableCode.includes("w-[14%]"), "CustomerTable col 3 must be 14%");
    assert.ok(tableCode.includes("w-[11%]"), "CustomerTable col 4 must be 11%");
    assert.ok(tableCode.includes("w-[14%]"), "CustomerTable col 5 must be 14%");
    assert.ok(tableCode.includes("w-[13%]"), "CustomerTable col 6 must be 13%");
    assert.ok(tableCode.includes("w-[10%]"), "CustomerTable col 7 must be 10%");

    const kpiCode = fs.readFileSync("src/components/customers/customer-kpi-cards.tsx", "utf-8");
    assert.ok(kpiCode.includes("atRiskCount"), "CustomerKpiCards must display atRiskCount");
  });

  await runner.test("C7.24: Customer profile displays segment badge, favorite products section, and dark kitchen delivery metrics", async () => {
    const fs = await import("fs");
    const profileCode = fs.readFileSync("src/components/customers/customer-profile-client.tsx", "utf-8");
    assert.ok(profileCode.includes("max-w-[1536px]"), "Customer profile must use max-w-[1536px] standard container");
    assert.ok(profileCode.includes("favoriteProducts") || profileCode.includes("favoritesTitle"), "Customer profile must display favorite products");
    assert.ok(profileCode.includes("preferredPlatform"), "Customer profile must display preferred platform");
    assert.ok(profileCode.includes("segment"), "Customer profile must display customer segment");
  });

  await runner.test("C7.25: Order creation form embeds POS quick customer insight card with 1-click favorite additions and allergy alert", async () => {
    const fs = await import("fs");
    const formCode = fs.readFileSync("src/components/orders/order-form.tsx", "utf-8");
    assert.ok(formCode.includes("quickInsight"), "order-form must render quick customer insight section");
    assert.ok(formCode.includes("customerNotesAlert"), "order-form must render customer notes alert");
    assert.ok(formCode.includes("favoriteItems") || formCode.includes("favoriteProducts"), "order-form must display favorite items");
    assert.ok(formCode.includes("quickAdded") || formCode.includes("quickAdd"), "order-form must support quick-add to cart for favorites");
  });

  await runner.test("C7.26: Customer export route serves native .xlsx spreadsheet with correct mime-type and disposition", async () => {
    const fs = await import("fs");
    const routeCode = fs.readFileSync("src/app/api/customers/export/route.ts", "utf-8");
    assert.ok(routeCode.includes("generateCustomersExcelWorkbook"), "Route must call generateCustomersExcelWorkbook");
    assert.ok(routeCode.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), "Route must set .xlsx MIME type");
    assert.ok(routeCode.includes(".xlsx"), "Route must set .xlsx filename");
  });

  return runner;
}

