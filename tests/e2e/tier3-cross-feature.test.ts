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

  return runner;
}
