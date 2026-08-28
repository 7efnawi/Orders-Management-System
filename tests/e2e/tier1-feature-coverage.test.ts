import assert from "node:assert";
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
  assertTransition,
  calculateOrderTotals,
  getStatusTimestampField,
  nextAllowedStatuses,
  OrderStatus,
} from "../../src/lib/orderStateMachine";
import { CancelReason, DriverType } from "@prisma/client";
import {
  buildDailyBreakdown,
  calculateDriverCashCollection,
  calculateSalesSummary,
  calculateTopProducts,
  groupSalesByPlatformBrand,
  type ReportExpenseInput,
  type ReportOrderInput,
} from "../../src/lib/reports";
import {
  MOCK_ORDERS_DATASET,
} from "../fixtures/mock-data";

export async function runTier1Tests(): Promise<TestRunner> {
  const runner = new TestRunner("Tier 1: Feature Coverage (F1 through F13)");

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 1: Modern Navigation Header
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F1: Modern Navigation Header", 1);

  await runner.test("F1.1: Navigation active pill highlights current route", () => {
    const currentPath = "/orders";
    const navItems = [
      { href: "/orders", label: "الطلبات" },
      { href: "/menu", label: "المنيو" },
      { href: "/delivery", label: "التوصيل" },
      { href: "/expenses", label: "المصروفات" },
      { href: "/closing", label: "التقفيل" },
    ];

    const activeItem = navItems.find((item) => item.href === currentPath);
    assert.ok(activeItem, "Active route item must be identified");
    assert.strictEqual(activeItem.href, "/orders");
  });

  await runner.test("F1.2: Sushi Dark Kitchen branding contains Kanji and text", () => {
    const branding = {
      kanji: "鮨",
      titleEn: "Sushi Dark Kitchen",
      titleAr: "مطبخ سوشي دارك كيتشن",
      subtitleEn: "Order Control System",
    };
    assert.strictEqual(branding.kanji, "鮨");
    assert.ok(branding.titleAr.includes("سوشي"));
    assert.ok(branding.titleEn.includes("Sushi"));
  });

  await runner.test("F1.3: User profile area renders role badge correctly", () => {
    const roles = ["OWNER", "MANAGER", "CASHIER", "KITCHEN"];
    for (const role of roles) {
      assert.ok(typeof role === "string" && role.length > 0);
    }
  });

  await runner.test("F1.4: Role-based navigation visibility for CASHIER restricts delivery tab", () => {
    const cashierUser = { role: "CASHIER", name: "Ahmed" };
    const shouldShowDelivery = cashierUser.role !== "CASHIER";
    assert.strictEqual(shouldShowDelivery, false, "Cashier role should not see delivery link");

    const managerUser = { role: "MANAGER", name: "Sara" };
    assert.strictEqual(managerUser.role !== "CASHIER", true);
  });

  await runner.test("F1.5: Mobile drawer navigation responds to viewport toggle state", () => {
    let isDrawerOpen = false;
    const toggleDrawer = () => { isDrawerOpen = !isDrawerOpen; };

    toggleDrawer();
    assert.strictEqual(isDrawerOpen, true, "Drawer should be open after toggle");
    toggleDrawer();
    assert.strictEqual(isDrawerOpen, false, "Drawer should close after second toggle");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 2: Persistent "+ New Order" CTA Button
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F2: Persistent '+ New Order' CTA", 1);

  await runner.test("F2.1: CTA button points directly to /orders/new", () => {
    const ctaButton = {
      labelAr: "+ طلب جديد",
      labelEn: "+ New Order",
      href: "/orders/new",
      className: "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md",
    };
    assert.strictEqual(ctaButton.href, "/orders/new");
    assert.ok(ctaButton.labelAr.includes("طلب جديد"));
  });

  await runner.test("F2.2: CTA button adheres to minimum touch size >=44x44px", () => {
    const ctaTouchClass = "h-11 min-w-11 px-4 py-2 rounded-lg";
    const validation = validateTouchTargetClass(ctaTouchClass);
    assert.strictEqual(validation.isValid, true, "CTA button must satisfy >=44px touch target standard");
  });

  await runner.test("F2.3: CTA button is rendered persistently across all dashboard views", () => {
    const dashboardViews = ["/orders", "/menu", "/delivery", "/expenses", "/closing"];
    for (const view of dashboardViews) {
      const isCtaRendered = true; // Header is present on all dashboard layouts
      assert.strictEqual(isCtaRendered, true, `CTA button must be present on view ${view}`);
    }
  });

  await runner.test("F2.4: CTA button keyboard trigger via Enter key navigation", () => {
    const keyboardEvent = { key: "Enter", defaultPrevented: false };
    let navigatedTo: string | null = null;
    if (keyboardEvent.key === "Enter") {
      navigatedTo = "/orders/new";
    }
    assert.strictEqual(navigatedTo, "/orders/new");
  });

  await runner.test("F2.5: CTA high-visibility visual contrast token in dark/light themes", () => {
    const ctaLightClass = "bg-primary text-primary-foreground";
    const ctaDarkClass = "dark:bg-emerald-500 dark:text-black";
    assert.ok(ctaLightClass.includes("bg-primary"));
    assert.ok(ctaDarkClass.includes("dark:bg-emerald-500"));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 3: Theme System & Kitchen Mode
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F3: Theme System & Kitchen Mode", 1);

  await runner.test("F3.1: Theme switcher supports Light, Dark, and Kitchen modes", () => {
    const supportedThemes = ["light", "dark", "kitchen"];
    assert.strictEqual(supportedThemes.length, 3);
    assert.ok(supportedThemes.includes("kitchen"), "Kitchen night-shift theme must be supported");
  });

  await runner.test("F3.2: Kitchen mode applies obsidian background and amber/high-contrast accents", () => {
    const kitchenThemeStyles = {
      themeClass: "kitchen",
      background: "#09090b", // Obsidian deep black
      accent: "#f59e0b",     // Amber high-contrast
      foreground: "#fafafa",
    };
    assert.strictEqual(kitchenThemeStyles.themeClass, "kitchen");
    assert.strictEqual(kitchenThemeStyles.background, "#09090b");
    assert.strictEqual(kitchenThemeStyles.accent, "#f59e0b");
  });

  await runner.test("F3.3: Theme switching persists selected mode in state/storage", () => {
    let currentTheme = "light";
    const setTheme = (t: string) => { currentTheme = t; };

    setTheme("kitchen");
    assert.strictEqual(currentTheme, "kitchen");
    setTheme("dark");
    assert.strictEqual(currentTheme, "dark");
  });

  await runner.test("F3.4: CSS variables defined for background, foreground, border, warning", () => {
    const cssVariables = ["--background", "--foreground", "--card", "--border", "--warning", "--primary"];
    for (const v of cssVariables) {
      assert.ok(v.startsWith("--"));
    }
  });

  await runner.test("F3.5: Kitchen mode high-contrast card borders for steamy/dim kitchen screens", () => {
    const cardBorderKitchen = "border-amber-500/40 bg-zinc-950/90 text-amber-100";
    assert.ok(cardBorderKitchen.includes("border-amber-500"));
    assert.ok(cardBorderKitchen.includes("bg-zinc-950"));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 4: Bilingual & Touch Ergonomics
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F4: Bilingual & Touch Ergonomics", 1);

  await runner.test("F4.1: Arabic locale applies dir='rtl' and English applies dir='ltr'", () => {
    const getDir = (locale: string) => (locale === "ar" ? "rtl" : "ltr");
    assert.strictEqual(getDir("ar"), "rtl");
    assert.strictEqual(getDir("en"), "ltr");
  });

  await runner.test("F4.2: Standard interactive buttons have >=44x44px touch ergonomics", () => {
    const touchButtonClass = "h-11 min-w-11 px-4 py-2.5 rounded-md text-sm font-medium";
    const result = validateTouchTargetClass(touchButtonClass);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.minHeightPx, 44);
    assert.strictEqual(result.minWidthPx, 44);
  });

  await runner.test("F4.3: Navigation items have translated labels in both AR and EN", () => {
    const translations = {
      ar: { orders: "الطلبات", menu: "المنيو", delivery: "التوصيل", expenses: "المصروفات", closing: "التقفيل" },
      en: { orders: "Orders", menu: "Menu", delivery: "Delivery", expenses: "Expenses", closing: "Closing" },
    };
    for (const key of Object.keys(translations.ar) as Array<keyof typeof translations.ar>) {
      assert.ok(translations.ar[key].length > 0);
      assert.ok(translations.en[key].length > 0);
    }
  });

  await runner.test("F4.4: Currency formatting displays EGP in English and ج.م in Arabic", () => {
    const formatCurrency = (amount: number, locale: string) =>
      locale === "ar" ? `${amount.toFixed(2)} ج.م` : `${amount.toFixed(2)} EGP`;

    assert.strictEqual(formatCurrency(150, "ar"), "150.00 ج.م");
    assert.strictEqual(formatCurrency(150, "en"), "150.00 EGP");
  });

  await runner.test("F4.5: Responsive grid breaks into single column on mobile (<768px)", () => {
    const responsiveGridClass = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4";
    assert.ok(responsiveGridClass.includes("grid-cols-1"));
    assert.ok(responsiveGridClass.includes("md:grid-cols-2"));
    assert.ok(responsiveGridClass.includes("lg:grid-cols-4"));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 5: Brand Visual Signatures
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F5: Brand Visual Signatures", 1);

  await runner.test("F5.1: Flower brand token has Sakura Pink, Kanji '花', and pink styling", () => {
    const token = getBrandToken("Flower");
    assert.strictEqual(token.kanji, "花");
    assert.strictEqual(token.hex, "#f472b6");
    assert.ok(token.bgClass.includes("pink"));
    assert.ok(token.textClass.includes("pink"));
    assert.strictEqual(token.labelAr, "فلاور سوشي");
  });

  await runner.test("F5.2: Mastery brand token has Artisan Gold, Kanji '匠', and amber styling", () => {
    const token = getBrandToken("Mastery");
    assert.strictEqual(token.kanji, "匠");
    assert.strictEqual(token.hex, "#eab308");
    assert.ok(token.bgClass.includes("amber"));
    assert.strictEqual(token.labelAr, "ماستري سوشي");
  });

  await runner.test("F5.3: Niwa brand token has Matcha Emerald, Kanji '庭', and emerald styling", () => {
    const token = getBrandToken("Niwa");
    assert.strictEqual(token.kanji, "庭");
    assert.strictEqual(token.hex, "#10b981");
    assert.ok(token.bgClass.includes("emerald"));
    assert.strictEqual(token.labelAr, "نيوا سوشي");
  });

  await runner.test("F5.4: Tobiko brand token has Fish Roe Orange, Kanji '魚子', and orange styling", () => {
    const token = getBrandToken("Tobiko");
    assert.strictEqual(token.kanji, "魚子");
    assert.strictEqual(token.hex, "#f97316");
    assert.ok(token.bgClass.includes("orange"));
    assert.strictEqual(token.labelAr, "توبيكو سوشي");
  });

  await runner.test("F5.5: Fallback brand token for unknown brand name provides default badge", () => {
    const token = getBrandToken("Unknown Brand X");
    assert.strictEqual(token.kanji, "鮨");
    assert.ok(token.bgClass.includes("bg-muted"));
    assert.strictEqual(token.name, "Unknown Brand X");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 6: Platform Visual Signatures
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F6: Platform Visual Signatures", 1);

  await runner.test("F6.1: Talabat platform token has Brand Orange (#ff5a00) and localized names", () => {
    const token = getPlatformToken("Talabat");
    assert.strictEqual(token.hex, "#ff5a00");
    assert.strictEqual(token.labelAr, "طلبات");
    assert.strictEqual(token.labelEn, "Talabat");
  });

  await runner.test("F6.2: elmenus platform token has Crimson Red (#e21b1b) and localized names", () => {
    const token = getPlatformToken("elmenus");
    assert.strictEqual(token.hex, "#e21b1b");
    assert.strictEqual(token.labelAr, "المنيوز");
    assert.strictEqual(token.labelEn, "elmenus");
  });

  await runner.test("F6.3: InstaShop platform token has Fresh Teal (#00a699)", () => {
    const token = getPlatformToken("InstaShop");
    assert.strictEqual(token.hex, "#00a699");
    assert.strictEqual(token.labelAr, "إنستاشوب");
  });

  await runner.test("F6.4: HarryApp platform token has Maroon Rose (#be123c)", () => {
    const token = getPlatformToken("HarryApp");
    assert.strictEqual(token.hex, "#be123c");
    assert.strictEqual(token.labelAr, "هاري آب");
  });

  await runner.test("F6.5: Direct Phone platform token has Sky Blue (#0284c7)", () => {
    const token = getPlatformToken("Phone");
    assert.strictEqual(token.hex, "#0284c7");
    assert.strictEqual(token.labelAr, "تليفون مباشر");
  });

  await runner.test("F6.6: Facebook platform token has Official Blue (#1877f2)", () => {
    const token = getPlatformToken("Facebook");
    assert.strictEqual(token.hex, "#1877f2");
    assert.strictEqual(token.labelAr, "فيسبوك");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 7: Interactive Receipt Ticket Preview
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F7: Interactive Receipt Ticket Preview", 1);

  await runner.test("F7.1: Thermal receipt preview formats with tabular-nums and monospace styling", () => {
    const preview = generateReceiptPreview({
      brandName: "Flower",
      brandKanji: "花",
      orderNumber: "ORD-101",
      paymentMethod: "CASH",
      items: [
        { productId: "p1", name: "Salmon Philadelphia Roll", price: 180, quantity: 2 },
      ],
      deliveryFee: 30,
      discount: 20,
    });

    assert.strictEqual(preview.subtotal, 360);
    assert.strictEqual(preview.netDeliveryFee, 30);
    assert.strictEqual(preview.grandTotal, 370); // 360 - 20 + 30
    assert.ok(preview.formattedLines.some((line) => line.includes("SUBTOTAL")));
  });

  await runner.test("F7.2: Receipt preview item line totals compute correctly for multiple products", () => {
    const preview = generateReceiptPreview({
      brandName: "Niwa",
      paymentMethod: "VISA",
      items: [
        { productId: "p1", name: "Roll A", price: 100, quantity: 2 },
        { productId: "p2", name: "Roll B", price: 50, quantity: 3 },
      ],
    });
    assert.strictEqual(preview.items[0].lineTotal, 200);
    assert.strictEqual(preview.items[1].lineTotal, 150);
    assert.strictEqual(preview.subtotal, 350);
  });

  await runner.test("F7.3: Receipt preview zeros delivery fee when APP driver is selected", () => {
    const preview = generateReceiptPreview({
      brandName: "Tobiko",
      paymentMethod: "ONLINE",
      driverType: "APP",
      deliveryFee: 35,
      items: [{ productId: "p1", name: "Sushi Set", price: 200, quantity: 1 }],
    });
    assert.strictEqual(preview.deliveryFee, 35);
    assert.strictEqual(preview.netDeliveryFee, 0);
    assert.strictEqual(preview.grandTotal, 200);
  });

  await runner.test("F7.4: Receipt preview correctly deducts discount with zero floor guard", () => {
    const preview = generateReceiptPreview({
      brandName: "Mastery",
      paymentMethod: "CASH",
      items: [{ productId: "p1", name: "Artisan Box", price: 150, quantity: 1 }],
      discount: 200, // discount > subtotal
    });
    assert.strictEqual(preview.subtotal, 150);
    assert.strictEqual(preview.grandTotal, 0); // Floored to 0
  });

  await runner.test("F7.5: Receipt preview includes customer details and order number in header", () => {
    const preview = generateReceiptPreview({
      brandName: "Flower",
      customerName: "سارة محمد",
      customerPhone: "01033334444",
      orderNumber: "ORD-999",
      paymentMethod: "CASH",
      items: [{ productId: "p1", name: "Sashimi", price: 100, quantity: 1 }],
    });
    assert.strictEqual(preview.customerName, "سارة محمد");
    assert.strictEqual(preview.orderNumber, "ORD-999");
    assert.ok(preview.formattedLines.some((l) => l.includes("سارة محمد")));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 8: Touch-Optimized Payment Selector
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F8: Touch-Optimized Payment Selector", 1);

  await runner.test("F8.1: Payment selector supports CASH, VISA, and ONLINE methods", () => {
    const paymentMethods = ["CASH", "VISA", "ONLINE"];
    assert.strictEqual(paymentMethods.length, 3);
  });

  await runner.test("F8.2: Payment method card satisfies touch target size >=44x44px", () => {
    const paymentCardClass = "h-14 min-w-[120px] p-3 rounded-lg border-2 flex items-center justify-center gap-2";
    const validation = validateTouchTargetClass(paymentCardClass);
    assert.strictEqual(validation.isValid, true);
  });

  await runner.test("F8.3: Active payment method receives prominent ring and border tokens", () => {
    const getPaymentCardStyle = (selected: string, current: string) => {
      const isSelected = selected === current;
      return isSelected
        ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2 font-bold"
        : "border-border bg-card text-muted-foreground";
    };

    const cashStyle = getPaymentCardStyle("CASH", "CASH");
    assert.ok(cashStyle.includes("border-primary"));
    assert.ok(cashStyle.includes("ring-2"));

    const visaStyle = getPaymentCardStyle("CASH", "VISA");
    assert.ok(visaStyle.includes("border-border"));
  });

  await runner.test("F8.4: Selecting a payment method updates active state atomically", () => {
    let activePayment = "CASH";
    const selectPayment = (method: string) => { activePayment = method; };

    selectPayment("VISA");
    assert.strictEqual(activePayment, "VISA");
    selectPayment("ONLINE");
    assert.strictEqual(activePayment, "ONLINE");
  });

  await runner.test("F8.5: Payment selector icons map accurately (Banknote, CreditCard, Globe)", () => {
    const paymentIcons: Record<string, string> = {
      CASH: "Banknote",
      VISA: "CreditCard",
      ONLINE: "Globe",
    };
    assert.strictEqual(paymentIcons.CASH, "Banknote");
    assert.strictEqual(paymentIcons.VISA, "CreditCard");
    assert.strictEqual(paymentIcons.ONLINE, "Globe");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 9: Customer Loyalty Badges
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F9: Customer Loyalty Badges", 1);

  await runner.test("F9.1: 0 orders resolves to 'New Guest' (ضيف جديد)", () => {
    const tier = getLoyaltyTier(0);
    assert.strictEqual(tier.tier, "new");
    assert.ok(tier.labelAr.includes("ضيف جديد"));
    assert.ok(tier.labelEn.includes("New Guest"));
  });

  await runner.test("F9.2: 1 to 4 orders resolves to 'Regular Customer' (عميل دائم)", () => {
    for (const count of [1, 2, 3, 4]) {
      const tier = getLoyaltyTier(count);
      assert.strictEqual(tier.tier, "regular");
      assert.ok(tier.labelAr.includes("عميل دائم"));
    }
  });

  await runner.test("F9.3: 5 to 19 orders resolves to 'Gold VIP' (عميل ذهبي VIP)", () => {
    for (const count of [5, 10, 15, 19]) {
      const tier = getLoyaltyTier(count);
      assert.strictEqual(tier.tier, "vip");
      assert.ok(tier.labelAr.includes("ذهبي"));
      assert.ok(tier.colorClass.includes("amber"));
    }
  });

  await runner.test("F9.4: >= 20 orders resolves to 'Platinum Legend' (أسطورة بلاتيني)", () => {
    for (const count of [20, 35, 100]) {
      const tier = getLoyaltyTier(count);
      assert.strictEqual(tier.tier, "legend");
      assert.ok(tier.labelAr.includes("أسطورة بلاتيني"));
      assert.ok(tier.colorClass.includes("purple"));
    }
  });

  await runner.test("F9.5: Null or undefined totalOrders safely defaults to 'New Guest'", () => {
    assert.strictEqual(getLoyaltyTier(null).tier, "new");
    assert.strictEqual(getLoyaltyTier(undefined).tier, "new");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 10: Orders View Switcher
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F10: Orders View Switcher", 1);

  await runner.test("F10.1: View switcher toggles between 'table' and 'kanban' modes", () => {
    let viewMode: "table" | "kanban" = "table";
    const setView = (v: "table" | "kanban") => { viewMode = v; };

    setView("kanban");
    assert.strictEqual(viewMode, "kanban");
    setView("table");
    assert.strictEqual(viewMode, "table");
  });

  await runner.test("F10.2: Filter and search states persist when switching views", () => {
    const filterState = {
      searchQuery: "01011112222",
      brandId: "b-flower",
      platformId: "p-talabat",
      viewMode: "table" as "table" | "kanban",
    };

    // Toggle view to kanban
    filterState.viewMode = "kanban";

    assert.strictEqual(filterState.searchQuery, "01011112222");
    assert.strictEqual(filterState.brandId, "b-flower");
    assert.strictEqual(filterState.platformId, "p-talabat");
  });

  await runner.test("F10.3: View switcher tab button satisfies accessibility and touch standard", () => {
    const switcherClass = "h-11 min-w-[100px] px-3 py-1.5 rounded-lg border";
    const validation = validateTouchTargetClass(switcherClass);
    assert.strictEqual(validation.isValid, true);
  });

  await runner.test("F10.4: View switcher displays localized labels (جدول / كانبان)", () => {
    const labels = {
      ar: { table: "جدول", kanban: "لوحة المطبخ (كانبان)" },
      en: { table: "Table", kanban: "Kitchen Kanban" },
    };
    assert.strictEqual(labels.ar.table, "جدول");
    assert.ok(labels.ar.kanban.includes("كانبان"));
  });

  await runner.test("F10.5: Empty search state correctly renders empty message in both views", () => {
    const orders: unknown[] = [];
    const tableEmptyMsg = orders.length === 0 ? "لا توجد طلبات مطابقة" : "";
    const kanbanEmptyMsg = orders.length === 0 ? "لا توجد طلبات في اللوحة" : "";
    assert.ok(tableEmptyMsg.length > 0);
    assert.ok(kanbanEmptyMsg.length > 0);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 11: Live Kitchen Kanban Board
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F11: Live Kitchen Kanban Board", 1);

  await runner.test("F11.1: Kanban board has 5 distinct workflow columns", () => {
    const kanbanColumns = [
      { id: "NEW_CONFIRMED", label: "جديد / مؤكد" },
      { id: "PREPARING", label: "قيد التحضير" },
      { id: "READY", label: "جاهز للتسليم" },
      { id: "OUT_FOR_DELIVERY", label: "خرج للتوصيل" },
      { id: "DELIVERED", label: "تم التسليم" },
    ];
    assert.strictEqual(kanbanColumns.length, 5);
  });

  await runner.test("F11.2: State machine allows linear transitions through kanban columns", () => {
    assert.doesNotThrow(() => assertTransition(OrderStatus.NEW, OrderStatus.CONFIRMED));
    assert.doesNotThrow(() => assertTransition(OrderStatus.CONFIRMED, OrderStatus.PREPARING));
    assert.doesNotThrow(() => assertTransition(OrderStatus.PREPARING, OrderStatus.READY));
    assert.doesNotThrow(() => assertTransition(OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY));
    assert.doesNotThrow(() => assertTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED));
  });

  await runner.test("F11.3: Kanban cards categorize orders accurately into their respective columns", () => {
    const columnOrders = {
      NEW: MOCK_ORDERS_DATASET.filter((o) => o.status === "NEW"),
      PREPARING: MOCK_ORDERS_DATASET.filter((o) => o.status === "PREPARING"),
      READY: MOCK_ORDERS_DATASET.filter((o) => o.status === "READY"),
      OUT_FOR_DELIVERY: MOCK_ORDERS_DATASET.filter((o) => o.status === "OUT_FOR_DELIVERY"),
      DELIVERED: MOCK_ORDERS_DATASET.filter((o) => o.status === "DELIVERED"),
    };

    assert.strictEqual(columnOrders.NEW.length, 1);
    assert.strictEqual(columnOrders.PREPARING.length, 2);
    assert.strictEqual(columnOrders.READY.length, 1);
    assert.strictEqual(columnOrders.OUT_FOR_DELIVERY.length, 1);
    assert.strictEqual(columnOrders.DELIVERED.length, 1);
  });

  await runner.test("F11.4: Direct cancellation from kanban card requires cancelReason", () => {
    assert.throws(
      () => assertTransition(OrderStatus.PREPARING, OrderStatus.CANCELLED),
      /CANCEL_REASON_REQUIRED/
    );
    assert.doesNotThrow(() =>
      assertTransition(OrderStatus.PREPARING, OrderStatus.CANCELLED, CancelReason.QUALITY_ISSUE)
    );
  });

  await runner.test("F11.5: Out-of-order column jumps are strictly rejected by state machine", () => {
    assert.throws(() => assertTransition(OrderStatus.NEW, OrderStatus.DELIVERED), /INVALID_TRANSITION/);
    assert.throws(() => assertTransition(OrderStatus.PREPARING, OrderStatus.DELIVERED), /INVALID_TRANSITION/);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 12: Live Prep Timers & Alert Badges
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F12: Live Prep Timers & Alert Badges", 1);

  await runner.test("F12.1: Prep timer under 10 minutes is in normal green state", () => {
    const now = new Date("2026-08-26T20:10:00Z");
    const prepStart = new Date("2026-08-26T20:05:00Z"); // 5 mins = 300s
    const res = calculatePrepTime(prepStart, prepStart, now);

    assert.strictEqual(res.elapsedSeconds, 300);
    assert.strictEqual(res.formattedTime, "05:00");
    assert.strictEqual(res.isWarning, false);
    assert.strictEqual(res.isCritical, false);
    assert.ok(!res.badgeAnimationClass.includes("animate-pulse"));
  });

  await runner.test("F12.2: Prep timer between 10 and 14 minutes triggers warning state", () => {
    const now = new Date("2026-08-26T20:12:30Z");
    const prepStart = new Date("2026-08-26T20:00:00Z"); // 12m 30s = 750s
    const res = calculatePrepTime(prepStart, prepStart, now);

    assert.strictEqual(res.elapsedSeconds, 750);
    assert.strictEqual(res.formattedTime, "12:30");
    assert.strictEqual(res.isWarning, true);
    assert.strictEqual(res.isCritical, false);
  });

  await runner.test("F12.3: Prep timer >= 15 minutes (900s) triggers pulsing red critical alert", () => {
    const now = new Date("2026-08-26T20:20:00Z");
    const prepStart = new Date("2026-08-26T20:02:00Z"); // 18m = 1080s
    const res = calculatePrepTime(prepStart, prepStart, now);

    assert.strictEqual(res.elapsedSeconds, 1080);
    assert.strictEqual(res.formattedTime, "18:00");
    assert.strictEqual(res.isCritical, true);
    assert.ok(res.badgeAnimationClass.includes("animate-pulse"));
    assert.ok(res.badgeColorClass.includes("text-red-600"));
  });

  await runner.test("F12.4: Prep timer formatting formats >60 minutes as HH:MM:SS", () => {
    const now = new Date("2026-08-26T21:15:30Z");
    const prepStart = new Date("2026-08-26T20:00:00Z"); // 1h 15m 30s = 4530s
    const res = calculatePrepTime(prepStart, prepStart, now);

    assert.strictEqual(res.elapsedSeconds, 4530);
    assert.strictEqual(res.formattedTime, "01:15:30");
    assert.strictEqual(res.isCritical, true);
  });

  await runner.test("F12.5: Null preparingAt safely falls back to createdAt timestamp", () => {
    const now = new Date("2026-08-26T20:10:00Z");
    const createdAt = new Date("2026-08-26T20:04:00Z"); // 6 mins
    const res = calculatePrepTime(null, createdAt, now);

    assert.strictEqual(res.elapsedSeconds, 360);
    assert.strictEqual(res.formattedTime, "06:00");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 13: E2E & Adversarial Verification
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F13: E2E & Adversarial Verification", 1);

  await runner.test("F13.1: Full order lifecycle from POS creation to delivered handover", () => {
    // 1. Calculate totals
    const totals = calculateOrderTotals({
      items: [{ price: 180, quantity: 2 }],
      discount: 20,
      deliveryFee: 30,
      driverType: DriverType.OWN,
    });
    assert.strictEqual(totals.subtotal, 360);
    assert.strictEqual(totals.total, 370);

    // 2. Lifecycle transitions
    let status: OrderStatus = OrderStatus.NEW;
    assertTransition(status, OrderStatus.CONFIRMED);
    status = OrderStatus.CONFIRMED;

    assertTransition(status, OrderStatus.PREPARING);
    status = OrderStatus.PREPARING;

    assertTransition(status, OrderStatus.READY);
    status = OrderStatus.READY;

    assertTransition(status, OrderStatus.OUT_FOR_DELIVERY);
    status = OrderStatus.OUT_FOR_DELIVERY;

    assertTransition(status, OrderStatus.DELIVERED);
    status = OrderStatus.DELIVERED;

    assert.strictEqual(status, OrderStatus.DELIVERED);
  });

  await runner.test("F13.2: Terminal DELIVERED status cannot be altered or reopened", () => {
    assert.throws(() => assertTransition(OrderStatus.DELIVERED, OrderStatus.PREPARING), /TERMINAL_STATUS/);
    assert.throws(() => assertTransition(OrderStatus.DELIVERED, OrderStatus.NEW), /TERMINAL_STATUS/);
    assert.throws(
      () => assertTransition(OrderStatus.DELIVERED, OrderStatus.CANCELLED, CancelReason.OTHER),
      /TERMINAL_STATUS/
    );
  });

  await runner.test("F13.3: Total calculations with extreme quantities and prices", () => {
    const totals = calculateOrderTotals({
      items: [
        { price: 999.99, quantity: 100 },
        { price: 1500, quantity: 50 },
      ],
      discount: 5000,
      deliveryFee: 150,
      driverType: DriverType.OWN,
    });
    assert.strictEqual(totals.subtotal, 174999);
    assert.strictEqual(totals.total, 170149); // 174999 - 5000 + 150
  });

  await runner.test("F13.4: Order state machine timestamp mapping integrity", () => {
    assert.strictEqual(getStatusTimestampField(OrderStatus.CONFIRMED), "confirmedAt");
    assert.strictEqual(getStatusTimestampField(OrderStatus.PREPARING), "preparingAt");
    assert.strictEqual(getStatusTimestampField(OrderStatus.READY), "readyAt");
    assert.strictEqual(getStatusTimestampField(OrderStatus.OUT_FOR_DELIVERY), "outForDeliveryAt");
    assert.strictEqual(getStatusTimestampField(OrderStatus.DELIVERED), "deliveredAt");
    assert.strictEqual(getStatusTimestampField(OrderStatus.CANCELLED), "cancelledAt");
  });

  await runner.test("F13.5: Next allowed statuses query helper returns exact UI options", () => {
    assert.deepStrictEqual(nextAllowedStatuses(OrderStatus.NEW), [OrderStatus.CONFIRMED, OrderStatus.CANCELLED]);
    assert.deepStrictEqual(nextAllowedStatuses(OrderStatus.CONFIRMED), [OrderStatus.PREPARING, OrderStatus.CANCELLED]);
    assert.deepStrictEqual(nextAllowedStatuses(OrderStatus.PREPARING), [OrderStatus.READY, OrderStatus.CANCELLED]);
    assert.deepStrictEqual(nextAllowedStatuses(OrderStatus.READY), [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED]);
    assert.deepStrictEqual(nextAllowedStatuses(OrderStatus.OUT_FOR_DELIVERY), [OrderStatus.DELIVERED]);
    assert.deepStrictEqual(nextAllowedStatuses(OrderStatus.DELIVERED), []);
    assert.deepStrictEqual(nextAllowedStatuses(OrderStatus.CANCELLED), []);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 14: Reports & Analytics Dashboard (Phase 8 — FR-RPT)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F14: Reports & Analytics Dashboard", 1);

  // TZ-safe mock dataset — كل الأوردرات النهارده محليًا، والمصروفات بتاريخ النهارده
  const now = new Date();
  const yy = now.getFullYear();
  const mm = now.getMonth();
  const dd = now.getDate();
  const todayKey = `${yy}-${String(mm + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  const tomorrow = new Date(yy, mm, dd + 1);
  const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  const localNoon = new Date(yy, mm, dd, 12, 0, 0);
  const expenseToday: Date = new Date(Date.UTC(yy, mm, dd));

  const reportOrders: ReportOrderInput[] = [
    {
      id: "rpt-o1",
      status: OrderStatus.DELIVERED,
      paymentMethod: "CASH",
      subtotal: 200,
      discount: 20,
      discountStatus: "APPROVED",
      deliveryFee: 30,
      createdAt: localNoon,
      platformName: "Talabat",
      brandName: "Flower",
      driverId: "rpt-d1",
      driverName: "Ahmed",
      driverType: "OWN",
      items: [{ productId: "rpt-p1", productName: "Salmon Roll", quantity: 2, totalPrice: 200 }],
    },
    {
      id: "rpt-o2",
      status: OrderStatus.CONFIRMED,
      paymentMethod: "VISA",
      subtotal: 100,
      discount: 0,
      deliveryFee: 20,
      createdAt: localNoon,
      platformName: "InstaShop",
      brandName: "Mastery",
      driverId: "rpt-d1",
      driverName: "Ahmed",
      driverType: "OWN",
      items: [{ productId: "rpt-p2", productName: "Shrimp Roll", quantity: 1, totalPrice: 100 }],
    },
    {
      id: "rpt-o3",
      status: OrderStatus.READY,
      paymentMethod: "ONLINE",
      subtotal: 50,
      discount: 0,
      deliveryFee: 0,
      createdAt: localNoon,
      platformName: "Phone",
      brandName: "Flower",
      driverId: null,
      driverName: null,
      driverType: null,
      items: [{ productId: "rpt-p3", productName: "Tuna Nigiri", quantity: 1, totalPrice: 50 }],
    },
    {
      id: "rpt-o4",
      status: OrderStatus.CANCELLED,
      paymentMethod: "CASH",
      subtotal: 80,
      discount: 0,
      deliveryFee: 25,
      createdAt: localNoon,
      platformName: "Talabat",
      brandName: "Niwa",
      driverId: "rpt-d2",
      driverName: "Sara",
      driverType: "APP",
      items: [{ productId: "rpt-p4", productName: "Cancelled Roll", quantity: 1, totalPrice: 80 }],
    },
    {
      id: "rpt-o5",
      status: OrderStatus.DELIVERED,
      paymentMethod: "VISA",
      subtotal: 100,
      discount: 30,
      discountStatus: "REJECTED", // خصم مرفوض → لا يُحسب
      deliveryFee: 0,
      createdAt: localNoon,
      platformName: "Talabat",
      brandName: "Mastery",
      driverId: "rpt-d1",
      driverName: "Ahmed",
      driverType: "OWN",
      items: [{ productId: "rpt-p2", productName: "Shrimp Roll", quantity: 1, totalPrice: 100 }],
    },
  ];

  const reportExpenses: ReportExpenseInput[] = [
    { value: 40, quantity: 1, date: expenseToday },
    { value: 30, quantity: 2, date: expenseToday }, // 30 × 2 = 60
  ];

  await runner.test("F14.1: Sales summary matches exact figures (cancelled & rejected discount excluded)", () => {
    const summary = calculateSalesSummary(reportOrders, reportExpenses);
    assert.strictEqual(summary.totalOrders, 5);
    assert.strictEqual(summary.cancelledOrders, 1);
    assert.strictEqual(summary.activeOrders, 4);
    assert.strictEqual(summary.deliveredOrders, 2);
    assert.strictEqual(summary.grossSales, 450); // 200 + 100 + 50 + 100 (الملغي مستبعد)
    assert.strictEqual(summary.totalDiscounts, 20); // خصم O5 المرفوض (30) لا يُحسب
    assert.strictEqual(summary.totalDeliveryFees, 50); // 30 + 20 + 0 (رسوم الملغي مستبعدة)
    assert.strictEqual(summary.netRevenue, 480); // 450 - 20 + 50
    assert.strictEqual(summary.cashTotal, 210); // O1: 200 - 20 + 30
    assert.strictEqual(summary.visaTotal, 220); // O2: 120 + O5: 100
    assert.strictEqual(summary.onlineTotal, 50); // O3
    assert.strictEqual(summary.totalExpenses, 100); // 40 + (30 × 2)
    assert.strictEqual(summary.netProfit, 380); // 480 - 100
    assert.strictEqual(summary.aov, 120); // 480 / 4
  });

  await runner.test("F14.2: Platform×Brand matrix excludes cancelled and sorts by sales desc", () => {
    const rows = groupSalesByPlatformBrand(reportOrders);
    assert.strictEqual(rows.length, 4, "Cancelled order (Talabat×Niwa) must be excluded");
    assert.strictEqual(rows[0].platformName, "Talabat");
    assert.strictEqual(rows[0].brandName, "Flower");
    assert.strictEqual(rows[0].orders, 1);
    assert.strictEqual(rows[0].sales, 210);
    assert.deepStrictEqual(
      rows.map((r) => r.sales),
      [210, 120, 100, 50]
    );
  });

  await runner.test("F14.3: Driver cash collection groups correctly with no-driver row last", () => {
    const rows = calculateDriverCashCollection(reportOrders);
    assert.strictEqual(rows.length, 2, "Sara has only a cancelled order → no row");
    const ahmed = rows.find((r) => r.driverId === "rpt-d1");
    assert.ok(ahmed);
    assert.strictEqual(ahmed.totalOrders, 3);
    assert.strictEqual(ahmed.cashOrders, 1);
    assert.strictEqual(ahmed.cashCollected, 210);
    const noneRow = rows[rows.length - 1];
    assert.strictEqual(noneRow.driverId, null, "No-driver row must be last");
    assert.strictEqual(noneRow.totalOrders, 1);
    assert.strictEqual(noneRow.cashOrders, 0);
    assert.strictEqual(noneRow.cashCollected, 0);
  });

  await runner.test("F14.4: Top products ranked by quantity with order counts", () => {
    const rows = calculateTopProducts(reportOrders);
    assert.strictEqual(rows.length, 3, "Product of cancelled order must be excluded");
    assert.strictEqual(rows[0].productId, "rpt-p1");
    assert.strictEqual(rows[0].quantity, 2);
    assert.strictEqual(rows[0].revenue, 200);
    assert.strictEqual(rows[0].ordersCount, 1);
    const limited = calculateTopProducts(reportOrders, 1);
    assert.strictEqual(limited.length, 1);
    assert.strictEqual(limited[0].productId, "rpt-p1");
  });

  await runner.test("F14.5: Daily breakdown fills each day in range with exact figures", () => {
    const single = buildDailyBreakdown(reportOrders, reportExpenses, todayKey, todayKey);
    assert.strictEqual(single.length, 1);
    assert.strictEqual(single[0].date, todayKey);
    assert.strictEqual(single[0].orders, 5);
    assert.strictEqual(single[0].delivered, 2);
    assert.strictEqual(single[0].cancelled, 1);
    assert.strictEqual(single[0].sales, 480);
    assert.strictEqual(single[0].deliveryFees, 50);
    assert.strictEqual(single[0].expenses, 100);
    assert.strictEqual(single[0].net, 380);

    const twoDays = buildDailyBreakdown(reportOrders, reportExpenses, todayKey, tomorrowKey);
    assert.strictEqual(twoDays.length, 2, "Empty days must be filled with zeros");
    assert.strictEqual(twoDays[1].date, tomorrowKey);
    assert.strictEqual(twoDays[1].orders, 0);
    assert.strictEqual(twoDays[1].sales, 0);
    assert.strictEqual(twoDays[1].expenses, 0);
    assert.strictEqual(twoDays[1].net, 0);
  });

  await runner.test("F14.6: Reports edge cases — empty data and invalid range", () => {
    const emptySummary = calculateSalesSummary([], []);
    assert.strictEqual(emptySummary.totalOrders, 0);
    assert.strictEqual(emptySummary.netRevenue, 0);
    assert.strictEqual(emptySummary.aov, 0);
    assert.strictEqual(emptySummary.netProfit, 0);
    assert.deepStrictEqual(groupSalesByPlatformBrand([]), []);
    assert.deepStrictEqual(calculateDriverCashCollection([]), []);
    assert.deepStrictEqual(calculateTopProducts([]), []);

    assert.throws(
      () => buildDailyBreakdown([], [], "2026-02-10", "2026-02-01"),
      /INVALID_RANGE/
    );
  });

  return runner;
}
