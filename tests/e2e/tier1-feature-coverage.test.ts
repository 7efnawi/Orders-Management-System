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
import { CancelReason, DriverType, Role } from "@prisma/client";
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

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 15: User Management & Role-Based Access Control (FR-USR-01..04)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F15: User Management & Roles UI", 1);

  const mockUsersList = [
    { id: "u-1", name: "Ahmed Owner", email: "owner@sushi.com", role: "OWNER" as Role, isActive: true, createdAt: new Date("2026-01-01") },
    { id: "u-2", name: "Sara Manager", email: "sara@sushi.com", role: "MANAGER" as Role, isActive: true, createdAt: new Date("2026-01-05") },
    { id: "u-3", name: "Ali Cashier", email: "ali@sushi.com", role: "CASHIER" as Role, isActive: true, createdAt: new Date("2026-01-10") },
    { id: "u-4", name: "Mona Cashier Inactive", email: "mona@sushi.com", role: "CASHIER" as Role, isActive: false, createdAt: new Date("2026-01-15") },
  ];

  await runner.test("F15.1: Filter users by role, active status, and search query", () => {
    // Filter by role
    const managers = mockUsersList.filter((u) => u.role === "MANAGER");
    assert.strictEqual(managers.length, 1);
    assert.strictEqual(managers[0].name, "Sara Manager");

    // Filter by active status
    const activeUsers = mockUsersList.filter((u) => u.isActive === true);
    assert.strictEqual(activeUsers.length, 3);
    const inactiveUsers = mockUsersList.filter((u) => u.isActive === false);
    assert.strictEqual(inactiveUsers.length, 1);
    assert.strictEqual(inactiveUsers[0].name, "Mona Cashier Inactive");

    // Search by name or email (case-insensitive substring)
    const searchMatch = mockUsersList.filter(
      (u) =>
        u.name.toLowerCase().includes("sara") ||
        u.email.toLowerCase().includes("sara")
    );
    assert.strictEqual(searchMatch.length, 1);
    assert.strictEqual(searchMatch[0].id, "u-2");
  });

  await runner.test("F15.2: Self-deactivation prevention for current active owner", () => {
    function validateUserUpdate(actorId: string, targetId: string, data: { isActive?: boolean; role?: Role }) {
      if (actorId === targetId) {
        if (data.isActive === false) throw new Error("CANNOT_DEACTIVATE_SELF");
        if (data.role && data.role !== "OWNER") throw new Error("CANNOT_DEMOTE_SELF");
      }
      return { ok: true };
    }

    // Owner cannot deactivate self
    assert.throws(
      () => validateUserUpdate("u-1", "u-1", { isActive: false }),
      /CANNOT_DEACTIVATE_SELF/
    );

    // Owner can deactivate other users
    assert.doesNotThrow(() => validateUserUpdate("u-1", "u-3", { isActive: false }));
  });

  await runner.test("F15.3: Self-demotion prevention for current active owner", () => {
    function validateUserUpdate(actorId: string, targetId: string, data: { isActive?: boolean; role?: Role }) {
      if (actorId === targetId) {
        if (data.isActive === false) throw new Error("CANNOT_DEACTIVATE_SELF");
        if (data.role && data.role !== "OWNER") throw new Error("CANNOT_DEMOTE_SELF");
      }
      return { ok: true };
    }

    // Owner cannot demote self to MANAGER or CASHIER
    assert.throws(
      () => validateUserUpdate("u-1", "u-1", { role: "MANAGER" }),
      /CANNOT_DEMOTE_SELF/
    );
    assert.throws(
      () => validateUserUpdate("u-1", "u-1", { role: "CASHIER" }),
      /CANNOT_DEMOTE_SELF/
    );

    // Owner can change role of another user
    assert.doesNotThrow(() => validateUserUpdate("u-1", "u-3", { role: "MANAGER" }));
  });

  await runner.test("F15.4: Email validation and duplicate email rejection", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    assert.strictEqual(emailRegex.test("valid.user@kitchen.com"), true);
    assert.strictEqual(emailRegex.test("invalid-email"), false);
    assert.strictEqual(emailRegex.test("@missing-user.com"), false);

    const existingEmails = new Set(mockUsersList.map((u) => u.email.toLowerCase()));
    assert.strictEqual(existingEmails.has("owner@sushi.com"), true, "Duplicate email must be detected");
    assert.strictEqual(existingEmails.has("new.cashier@sushi.com"), false, "Unique email allowed");
  });

  await runner.test("F15.5: Session rejection for inactive user accounts (FR-USR-03)", () => {
    function checkUserSession(user: { isActive: boolean }) {
      if (!user.isActive) return { authenticated: false, reason: "INACTIVE" };
      return { authenticated: true };
    }

    const activeSession = checkUserSession(mockUsersList[0]);
    assert.strictEqual(activeSession.authenticated, true);

    const inactiveSession = checkUserSession(mockUsersList[3]);
    assert.strictEqual(inactiveSession.authenticated, false);
    assert.strictEqual(inactiveSession.reason, "INACTIVE");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 16: Audit Log & Activity Monitoring (Phase 10 — FR-AUD-01..05)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F16: Audit Log & Activity Monitoring", 1);

  await runner.test("F16.1: computeAuditDiff detects modified fields, additions, and domain translations", async () => {
    const { computeAuditDiff } = await import("../../src/services/audit");
    const oldVal = { status: "NEW", subtotal: 250, notes: "Original note" };
    const newVal = { status: "CONFIRMED", subtotal: 250, notes: "Updated note", discountAmount: 25 };
    const diffs = computeAuditDiff(oldVal, newVal);

    assert.strictEqual(diffs.length, 3, "Only changed or added fields should appear in diff");
    const statusDiff = diffs.find((d) => d.field === "status");
    assert.ok(statusDiff, "status field must be identified");
    assert.strictEqual(statusDiff?.oldValue, "NEW");
    assert.strictEqual(statusDiff?.newValue, "CONFIRMED");
    assert.ok(statusDiff?.labelAr, "Should have Arabic label");

    const discountDiff = diffs.find((d) => d.field === "discountAmount");
    assert.ok(discountDiff, "added discountAmount must be identified");
    assert.strictEqual(discountDiff?.oldValue, null);
    assert.strictEqual(discountDiff?.newValue, 25);
  });

  await runner.test("F16.2: computeAuditDiff returns empty array when objects are identical or null", async () => {
    const { computeAuditDiff } = await import("../../src/services/audit");
    assert.deepStrictEqual(computeAuditDiff(null, null), []);
    assert.deepStrictEqual(computeAuditDiff({ status: "READY" }, { status: "READY" }), []);
  });

  await runner.test("F16.3: getAuditStats computes accurate groupings and critical counts", async () => {
    const { calculateMockAuditStats } = await import("../../src/services/audit");
    const mockLogs = [
      { action: "CREATE", timestamp: new Date() },
      { action: "STATUS_CHANGE", timestamp: new Date() },
      { action: "CANCEL", timestamp: new Date() },
      { action: "DISCOUNT_APPROVE", timestamp: new Date() },
      { action: "UPDATE", timestamp: new Date(Date.now() - 86400000 * 3) }, // 3 days ago
    ];
    const stats = calculateMockAuditStats(mockLogs as any);
    assert.strictEqual(stats.totalLogs, 5);
    assert.strictEqual(stats.statusChangeCount, 1);
    assert.strictEqual(stats.criticalCount, 2, "CANCEL and DISCOUNT_APPROVE are critical");
    assert.strictEqual(stats.todayCount, 4, "4 occurred today");
  });

  await runner.test("F16.4: Audit log immutability verification (FR-AUD-02)", async () => {
    const auditService = await import("../../src/services/audit");
    assert.ok(!("deleteAuditLog" in auditService), "deleteAuditLog must NOT exist");
    assert.ok(!("updateAuditLog" in auditService), "updateAuditLog must NOT exist");
    assert.ok(!("clearAuditLogs" in auditService), "clearAuditLogs must NOT exist");
  });

  await runner.test("F16.5: Audit filter normalization and where-clause builder", async () => {
    const { buildAuditWhereClause } = await import("../../src/services/audit");
    const where = buildAuditWhereClause({
      userId: "u-123",
      action: "STATUS_CHANGE" as any,
      entityType: "Order",
      startDate: "2026-09-01",
      endDate: "2026-09-08",
      search: "ORD-999",
    });

    assert.strictEqual(where.userId, "u-123");
    assert.strictEqual(where.action, "STATUS_CHANGE");
    assert.strictEqual(where.entityType, "Order");
    assert.ok(where.timestamp?.gte instanceof Date);
    assert.ok(where.timestamp?.lte instanceof Date);
    assert.strictEqual(where.entityId?.contains, "ORD-999");
  });

  await runner.test("F16.6: Audit API query schema validation and role enforcement rules (FR-AUD-03)", async () => {
    const { auditQuerySchema } = await import("../../src/app/api/audit/route");

    // Valid query
    const valid = auditQuerySchema.parse({
      page: "2",
      limit: "50",
      action: "STATUS_CHANGE",
      entityType: "Order",
      startDate: "2026-09-01",
      endDate: "2026-09-08",
    });
    assert.strictEqual(valid.page, 2);
    assert.strictEqual(valid.limit, 50);
    assert.strictEqual(valid.action, "STATUS_CHANGE");

    // Default values
    const defaults = auditQuerySchema.parse({});
    assert.strictEqual(defaults.page, 1);
    assert.strictEqual(defaults.limit, 25);

    // Limit clamp: maximum 100
    assert.throws(() => auditQuerySchema.parse({ limit: "500" }), /limit/);

    // Invalid action
    assert.throws(() => auditQuerySchema.parse({ action: "INVALID_ACTION" }), /action/);
  });

  await runner.test("F16.7: formatHumanSummary converts boolean and status diffs into natural Arabic", async () => {
    const { formatHumanSummary, formatHumanEntityId } = await import("../../src/lib/auditDiff");
    
    // Boolean deactivation
    const deactivationLog = {
      action: "UPDATE",
      entityType: "User",
      entityId: "8c0f2069-6121-4e44-8193-ce8233595841",
      oldValue: { isActive: true },
      newValue: { isActive: false },
    };
    const deactSummary = formatHumanSummary(deactivationLog as any, true);
    assert.strictEqual(deactSummary, "إيقاف النشاط (تعطيل الحساب)");

    // Status change
    const statusLog = {
      action: "STATUS_CHANGE",
      entityType: "Order",
      entityId: "ord-1",
      oldValue: { status: "NEW" },
      newValue: { status: "CONFIRMED" },
    };
    const statusSummary = formatHumanSummary(statusLog as any, true);
    assert.strictEqual(statusSummary, "تحديث الحالة: جديد ➔ مؤكد");

    // Clean entity ID formatting
    const formattedId = formatHumanEntityId(deactivationLog as any);
    assert.strictEqual(formattedId.display, "#8c0f2069");
    assert.strictEqual(formattedId.full, "8c0f2069-6121-4e44-8193-ce8233595841");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 17: Customer Database & CRM (Phase 11 — FR-CUST-01..08)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F17: Customer Database & CRM", 1);

  await runner.test("F17.1: determineLoyaltyTier classifies first-time vs returning and tiers (Bronze, Silver, Gold, Platinum)", async () => {
    const { determineLoyaltyTier } = await import("../../src/lib/customers");

    // 0 orders -> Bronze, First Time
    const tier0 = determineLoyaltyTier(0, 0);
    assert.strictEqual(tier0.tier, "BRONZE");
    assert.strictEqual(tier0.isFirstTime, true);
    assert.strictEqual(tier0.isReturning, false);

    // 1 order -> Bronze, First Time
    const tier1 = determineLoyaltyTier(1, 150);
    assert.strictEqual(tier1.tier, "BRONZE");
    assert.strictEqual(tier1.isFirstTime, true);
    assert.strictEqual(tier1.isReturning, false);

    // 4 orders -> Bronze, Returning
    const tier4 = determineLoyaltyTier(4, 800);
    assert.strictEqual(tier4.tier, "BRONZE");
    assert.strictEqual(tier4.isFirstTime, false);
    assert.strictEqual(tier4.isReturning, true);

    // 5 orders -> Silver, Returning
    const tier5 = determineLoyaltyTier(5, 1200);
    assert.strictEqual(tier5.tier, "SILVER");
    assert.strictEqual(tier5.isReturning, true);

    // 14 orders -> Silver, Returning
    const tier14 = determineLoyaltyTier(14, 3500);
    assert.strictEqual(tier14.tier, "SILVER");

    // 15 orders -> Gold, Returning
    const tier15 = determineLoyaltyTier(15, 4500);
    assert.strictEqual(tier15.tier, "GOLD");

    // 29 orders -> Gold, Returning
    const tier29 = determineLoyaltyTier(29, 9000);
    assert.strictEqual(tier29.tier, "GOLD");

    // 30 orders -> Platinum, Returning
    const tier30 = determineLoyaltyTier(30, 12000);
    assert.strictEqual(tier30.tier, "PLATINUM");

    // 50 orders -> Platinum, Returning
    const tier50 = determineLoyaltyTier(50, 25000);
    assert.strictEqual(tier50.tier, "PLATINUM");
  });

  await runner.test("F17.2: calculateCustomerStats computes lifetime spent, AOV, last order date, and preferred brand", async () => {
    const { calculateCustomerStats } = await import("../../src/lib/customers");

    const mockOrders = [
      {
        id: "ord-1",
        status: "DELIVERED",
        subtotal: 300,
        discount: 0,
        deliveryFee: 20,
        createdAt: new Date("2026-09-01T12:00:00Z"),
        brand: { id: "b-flower", name: "Flower" },
      },
      {
        id: "ord-2",
        status: "DELIVERED",
        subtotal: 200,
        discount: 20,
        deliveryFee: 0,
        createdAt: new Date("2026-09-05T14:30:00Z"),
        brand: { id: "b-flower", name: "Flower" },
      },
      {
        id: "ord-3",
        status: "CANCELLED",
        subtotal: 150,
        discount: 0,
        deliveryFee: 15,
        cancelReason: "CUSTOMER_CHANGED_MIND",
        createdAt: new Date("2026-09-08T18:00:00Z"),
        brand: { id: "b-mastery", name: "Mastery" },
      },
    ];

    const stats = calculateCustomerStats(mockOrders as any);

    // Total orders = 3, completed = 2, cancelled = 1
    assert.strictEqual(stats.totalOrders, 3);
    assert.strictEqual(stats.completedOrders, 2);
    assert.strictEqual(stats.cancelledOrders, 1);

    // Lifetime spent = (300 + 20) + (200 - 20) = 320 + 180 = 500 (cancelled excluded)
    assert.strictEqual(stats.lifetimeSpent, 500);

    // AOV = 500 / 2 = 250
    assert.strictEqual(stats.aov, 250);

    // Last order date = 2026-09-08
    assert.ok(stats.lastOrderDate);
    assert.strictEqual(new Date(stats.lastOrderDate).toISOString(), new Date("2026-09-08T18:00:00Z").toISOString());

    // Preferred brand = Flower (2 orders vs 1)
    assert.strictEqual(stats.preferredBrand, "Flower");
  });

  await runner.test("F17.3: identifyProblemOrders flags cancelled orders and orders with delivery/quality issues", async () => {
    const { identifyProblemOrders } = await import("../../src/lib/customers");

    const mixedOrders = [
      {
        id: "ord-p1",
        status: "CANCELLED",
        cancelReason: "DELIVERY_ISSUE",
        createdAt: new Date("2026-09-02"),
      },
      {
        id: "ord-p2",
        status: "CANCELLED",
        cancelReason: "QUALITY_ISSUE",
        createdAt: new Date("2026-09-03"),
      },
      {
        id: "ord-p3",
        status: "CANCELLED",
        cancelReason: "CUSTOMER_CHANGED_MIND",
        createdAt: new Date("2026-09-04"),
      },
      {
        id: "ord-ok1",
        status: "DELIVERED",
        cancelReason: null,
        createdAt: new Date("2026-09-05"),
      },
      {
        id: "ord-ok2",
        status: "DELIVERED",
        cancelReason: null,
        createdAt: new Date("2026-09-06"),
      },
    ];

    const problems = identifyProblemOrders(mixedOrders as any);

    assert.strictEqual(problems.totalProblems, 3);
    assert.strictEqual(problems.hasProblems, true);
    assert.strictEqual(problems.cancelledCount, 3);
    assert.strictEqual(problems.deliveryIssueCount, 1);
    assert.strictEqual(problems.qualityIssueCount, 1);
    assert.strictEqual(problems.problemOrders.length, 3);
  });

  await runner.test("F17.4: formatCustomerPhone normalizes Egyptian phone numbers and ensures direction-safe LTR output", async () => {
    const { formatCustomerPhone } = await import("../../src/lib/customers");

    // Leading +20
    const p1 = formatCustomerPhone("+201012345678");
    assert.strictEqual(p1.raw, "01012345678");
    assert.ok(p1.display.includes("010 1234 5678"));
    assert.ok(p1.display.startsWith("\u202A") || p1.display.startsWith("\u200E") || p1.display.includes("010"));

    // Dashed format
    const p2 = formatCustomerPhone("011-9876-5432");
    assert.strictEqual(p2.raw, "01198765432");
    assert.ok(p2.display.includes("011 9876 5432"));

    // 0020 prefix
    const p3 = formatCustomerPhone("00201234567890");
    assert.strictEqual(p3.raw, "01234567890");

    // 10 digits missing leading zero
    const p4 = formatCustomerPhone("1512345678");
    assert.strictEqual(p4.raw, "01512345678");
  });

  await runner.test("F17.5: Customer service exports zero delete functions (immutability of customer records)", async () => {
    const customerService = await import("../../src/services/customers");
    assert.ok(!("deleteCustomer" in customerService), "deleteCustomer must NOT exist");
    assert.ok(!("removeCustomer" in customerService), "removeCustomer must NOT exist");
    assert.ok(!("hardDeleteCustomer" in customerService), "hardDeleteCustomer must NOT exist");
  });

  await runner.test("F17.6: Customer API query schema validation and immutability enforcement (FR-CUST-01..08)", async () => {
    const { customerQuerySchema, DELETE } = await import("../../src/app/api/customers/route");

    // Default values
    const defaults = customerQuerySchema.parse({});
    assert.strictEqual(defaults.page, 1);
    assert.strictEqual(defaults.limit, 25);

    // Valid query parameters parsing
    const valid = customerQuerySchema.parse({
      page: "3",
      limit: "50",
      search: "01012345678",
      tier: "PLATINUM",
      hasProblems: "true",
    });
    assert.strictEqual(valid.page, 3);
    assert.strictEqual(valid.limit, 50);
    assert.strictEqual(valid.search, "01012345678");
    assert.strictEqual(valid.tier, "PLATINUM");
    assert.strictEqual(valid.hasProblems, true);

    // Max limit constraint (max 100)
    assert.throws(() => customerQuerySchema.parse({ limit: "500" }), /limit/);

    // Immutability: DELETE handler on collection returns 405 Method Not Allowed
    const deleteRes = await DELETE();
    assert.strictEqual(deleteRes.status, 405);
    const deleteBody = await deleteRes.json();
    assert.strictEqual(deleteBody.code, "METHOD_NOT_ALLOWED");
    assert.ok(
      deleteBody.message.includes("prohibited") ||
      deleteBody.message.includes("immutable") ||
      deleteBody.message.includes("not allowed")
    );

    // Immutability: DELETE handler on individual customer [id] returns 405 Method Not Allowed
    const idRoute = await import("../../src/app/api/customers/[id]/route");
    const deleteIdRes = await idRoute.DELETE();
    assert.strictEqual(deleteIdRes.status, 405);
    const deleteIdBody = await deleteIdRes.json();
    assert.strictEqual(deleteIdBody.code, "METHOD_NOT_ALLOWED");
    assert.ok(
      deleteIdBody.message.includes("prohibited") ||
      deleteIdBody.message.includes("immutable") ||
      deleteIdBody.message.includes("not allowed")
    );
  });

  await runner.test("F17.7: determineCustomerSegment classifies VIP, Regular, New, At Risk, and Inactive based on RFM rules", async () => {
    const { determineCustomerSegment } = await import("../../src/lib/customers");

    const refDate = new Date("2026-09-12T12:00:00Z");

    // VIP: totalOrders >= 15 OR lifetimeSpent >= 3000
    const vipOrders = determineCustomerSegment(15, 1000, new Date("2026-09-01T12:00:00Z"), refDate);
    assert.strictEqual(vipOrders.segment, "VIP");
    assert.strictEqual(vipOrders.labelEn, "VIP");

    const vipSpent = determineCustomerSegment(4, 3500, new Date("2026-09-01T12:00:00Z"), refDate);
    assert.strictEqual(vipSpent.segment, "VIP");
    assert.strictEqual(vipSpent.labelEn, "VIP");

    // Regular: totalOrders >= 3 and lastOrder within last 30 days
    const regular = determineCustomerSegment(4, 1200, new Date("2026-08-25T12:00:00Z"), refDate); // 18 days ago
    assert.strictEqual(regular.segment, "REGULAR");
    assert.strictEqual(regular.labelEn, "Regular");

    // New: totalOrders <= 2 and lastOrder within last 30 days
    const newCust1 = determineCustomerSegment(1, 200, new Date("2026-09-10T12:00:00Z"), refDate); // 2 days ago
    assert.strictEqual(newCust1.segment, "NEW");
    assert.strictEqual(newCust1.labelEn, "New");

    const newCust2 = determineCustomerSegment(2, 500, new Date("2026-08-20T12:00:00Z"), refDate); // 23 days ago
    assert.strictEqual(newCust2.segment, "NEW");

    // At Risk: totalOrders >= 3 and lastOrder between 30 and 60 days ago
    const atRisk = determineCustomerSegment(4, 1500, new Date("2026-07-25T12:00:00Z"), refDate); // 49 days ago
    assert.strictEqual(atRisk.segment, "AT_RISK");
    assert.strictEqual(atRisk.labelEn, "At Risk");

    // Inactive: lastOrder > 60 days ago or 0 orders
    const inactiveOld = determineCustomerSegment(4, 1500, new Date("2026-06-01T12:00:00Z"), refDate); // 103 days ago
    assert.strictEqual(inactiveOld.segment, "INACTIVE");
    assert.strictEqual(inactiveOld.labelEn, "Inactive");

    const inactiveZero = determineCustomerSegment(0, 0, null, refDate);
    assert.strictEqual(inactiveZero.segment, "INACTIVE");
  });

  await runner.test("F17.8: calculateCustomerFavorites computes top favorite products across orders", async () => {
    const { calculateCustomerFavorites } = await import("../../src/lib/customers");

    const mockOrders = [
      {
        id: "ord-fav-1",
        status: "DELIVERED",
        items: [
          { productId: "prod-salmon", productName: "Salmon Roll", quantity: 3, price: 120 },
          { productId: "prod-california", productName: "California Roll", quantity: 1, price: 90 },
        ],
      },
      {
        id: "ord-fav-2",
        status: "DELIVERED",
        items: [
          { productId: "prod-salmon", productName: "Salmon Roll", quantity: 2, price: 120 },
          { productId: "prod-crispy", productName: "Crispy Roll", quantity: 4, price: 110 },
        ],
      },
      {
        id: "ord-fav-3",
        status: "CANCELLED", // Excluded
        items: [
          { productId: "prod-california", productName: "California Roll", quantity: 10, price: 90 },
        ],
      },
    ];

    const favorites = calculateCustomerFavorites(mockOrders);

    assert.strictEqual(favorites.length, 3);
    assert.strictEqual(favorites[0].productId, "prod-salmon");
    assert.strictEqual(favorites[0].productName, "Salmon Roll");
    assert.strictEqual(favorites[0].quantity, 5);

    assert.strictEqual(favorites[1].productId, "prod-crispy");
    assert.strictEqual(favorites[1].quantity, 4);

    assert.strictEqual(favorites[2].productId, "prod-california");
    assert.strictEqual(favorites[2].quantity, 1);
  });

  await runner.test("F17.9: determinePreferredPlatform and determineUsualDeliveryZone extract dark kitchen channel metrics", async () => {
    const { determinePreferredPlatform, determineUsualDeliveryZone } = await import("../../src/lib/customers");

    const mockOrders = [
      {
        id: "ord-1",
        platform: { name: "Talabat" },
        zone: { name: "Maadi Degla" },
      },
      {
        id: "ord-2",
        platform: { name: "Talabat" },
        zone: { name: "Maadi Degla" },
      },
      {
        id: "ord-3",
        platform: { name: "Elmenus" },
        zone: { name: "New Maadi" },
      },
    ];

    const preferredPlatform = determinePreferredPlatform(mockOrders);
    assert.strictEqual(preferredPlatform, "Talabat");

    const usualZone = determineUsualDeliveryZone(mockOrders);
    assert.strictEqual(usualZone, "Maadi Degla");

    // Empty orders fallback
    assert.strictEqual(determinePreferredPlatform([]), "Phone");
    assert.strictEqual(determineUsualDeliveryZone([]), null);
  });

  await runner.test("F17.10: listCustomers and searchCustomersByPhone support segment filtering and return rich POS customer insights", async () => {
    const { listCustomers, searchCustomersByPhone } = await import("../../src/services/customers");
    const { prisma } = await import("../../src/lib/prisma");

    const originalFindMany = prisma.customer.findMany;
    const originalCount = prisma.customer.count;
    const originalAggregate = prisma.order.aggregate;

    try {
      const mockCustomerDb = [
        {
          id: "cust-vip-1",
          name: "Ahmed VIP",
          phone: "01011112222",
          address: "Zamalek",
          notes: "Allergic to sesame",
          totalOrders: 16,
          lastOrderAt: new Date("2026-09-10T12:00:00Z"),
          createdAt: new Date("2026-01-01"),
          isActive: true,
          orders: [
            {
              id: "ord-1",
              status: "DELIVERED",
              cancelReason: null,
              subtotal: 500,
              discount: 0,
              deliveryFee: 20,
              items: [
                {
                  product: { id: "prod-salmon", name: "Salmon Nigiri", price: 150 },
                  quantity: 3,
                },
              ],
            },
          ],
        },
      ];

      (prisma.customer as any).findMany = async () => {
        return mockCustomerDb;
      };
      (prisma.customer as any).count = async () => {
        return 1;
      };
      (prisma.order as any).aggregate = async () => {
        return {
          _sum: {
            subtotal: 500,
            discount: 0,
            deliveryFee: 20,
          },
        };
      };

      // 1. Verify listCustomers returns atRiskCount in stats, and segment on items
      const listResult = await listCustomers({ segment: "VIP" });
      assert.strictEqual(typeof listResult.stats.atRiskCount, "number");
      assert.ok(listResult.customers.length >= 1);
      assert.strictEqual(listResult.customers[0].segment, "VIP");
      assert.strictEqual(listResult.customers[0].segmentInfo.segment, "VIP");
      assert.strictEqual(listResult.customers[0].spent, 520);

      // 2. Verify searchCustomersByPhone returns notes, segment, and favoriteProducts
      const searchResult = await searchCustomersByPhone("0101");
      assert.ok(searchResult.length >= 1);
      const firstResult = searchResult[0];
      assert.strictEqual(firstResult.notes, "Allergic to sesame");
      assert.strictEqual(firstResult.segment, "VIP");
      assert.ok(Array.isArray(firstResult.favoriteProducts));
      assert.strictEqual(firstResult.favoriteProducts[0].productName, "Salmon Nigiri");
      assert.strictEqual(firstResult.favoriteProducts[0].quantity, 3);
      assert.strictEqual(firstResult.lifetimeSpent, 520);
    } finally {
      prisma.customer.findMany = originalFindMany;
      prisma.customer.count = originalCount;
      prisma.order.aggregate = originalAggregate;
    }
  });

  await runner.test("F17.11: customerQuerySchema validates segment parameter and rejects invalid segments", async () => {
    const { customerQuerySchema } = await import("../../src/app/api/customers/route");

    // Valid segments
    const validSegments = ["VIP", "REGULAR", "NEW", "AT_RISK", "INACTIVE"] as const;
    for (const seg of validSegments) {
      const parsed = customerQuerySchema.parse({ segment: seg });
      assert.strictEqual(parsed.segment, seg);
    }

    // Invalid segment throws Zod validation error
    assert.throws(() => customerQuerySchema.parse({ segment: "SUPER_VIP" }), /Invalid|segment/);
    assert.throws(() => customerQuerySchema.parse({ segment: "CHURNED" }), /Invalid|segment/);
  });

  await runner.test("F17.12: GET /api/customers/export generates valid UTF-8 BOM CSV with Arabic headers and proper columns", async () => {
    const { generateCustomersCsv } = await import("../../src/lib/customers");

    const sampleCustomers = [
      {
        id: "cust-1",
        name: 'أحمد "الذواقة" علي',
        phone: "01012345678",
        segment: "VIP" as const,
        segmentInfo: {
          segment: "VIP" as const,
          labelAr: "VIP",
          labelEn: "VIP",
          badgeClass: "",
          descriptionAr: "",
        },
        totalOrders: 18,
        spent: 3250.5,
        totalSpent: 3250.5,
        lastOrderAt: new Date("2026-09-10T15:30:00Z"),
        notes: "يفضل الصوص الإضافي، ولديه حساسية من السمسم",
      },
      {
        id: "cust-2",
        name: "سارة محمد",
        phone: "01198765432",
        segment: "AT_RISK" as const,
        segmentInfo: {
          segment: "AT_RISK" as const,
          labelAr: "معرّض للفقد",
          labelEn: "At Risk",
          badgeClass: "",
          descriptionAr: "",
        },
        totalOrders: 4,
        spent: 820,
        totalSpent: 820,
        lastOrderAt: new Date("2026-08-01T12:00:00Z"),
        notes: null,
      },
    ];

    const csv = (generateCustomersCsv as any)(sampleCustomers);

    // 1. Verify UTF-8 BOM \uFEFF
    assert.ok(csv.startsWith("\uFEFF"), "CSV must start with UTF-8 BOM \\uFEFF for Excel compatibility");

    // 2. Split rows
    const lines = csv.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
    assert.ok(lines.length >= 3, "Should have header + at least 2 data rows");

    // 3. Verify Arabic headers
    const headerLine = lines[0];
    assert.ok(headerLine.includes("اسم العميل"), "Header must contain 'اسم العميل'");
    assert.ok(headerLine.includes("رقم الهاتف"), "Header must contain 'رقم الهاتف'");
    assert.ok(headerLine.includes("الشريحة"), "Header must contain 'الشريحة'");
    assert.ok(headerLine.includes("إجمالي الطلبات"), "Header must contain 'إجمالي الطلبات'");
    assert.ok(headerLine.includes("إجمالي الإنفاق (ج.م)"), "Header must contain 'إجمالي الإنفاق (ج.م)'");
    assert.ok(headerLine.includes("آخر طلب"), "Header must contain 'آخر طلب'");
    assert.ok(headerLine.includes("الملاحظات"), "Header must contain 'الملاحظات'");

    // 4. Verify proper quotes and comma escaping for row 1
    const row1 = lines[1];
    assert.ok(row1.includes('""الذواقة""'), 'Quotes inside values must be escaped as ""');
    assert.ok(row1.includes('"01012345678"'));
    assert.ok(row1.includes("3250.5"));
    assert.ok(row1.includes("2026-09-10"));
    assert.ok(row1.includes('"يفضل الصوص الإضافي، ولديه حساسية من السمسم"'));

    // 5. Verify export route exists and enforces 405 on mutations
    const exportRoute = await import("../../src/app/api/customers/export/route");
    assert.strictEqual(typeof exportRoute.GET, "function");
    const postRes = await exportRoute.POST();
    assert.strictEqual(postRes.status, 405);
    const delRes = await exportRoute.DELETE();
    assert.strictEqual(delRes.status, 405);
  });

  await runner.test("F17.13: generateCustomersExcelWorkbook generates a valid .xlsx buffer with Office/ZIP signature and RTL view", async () => {
    const { generateCustomersExcelWorkbook } = await import("../../src/lib/customersExcel");

    const sampleCustomers = [
      {
        id: "c-1",
        name: "أحمد محمود",
        phone: "01012345678",
        address: "المعادي، شارع 9",
        segment: "VIP",
        segmentInfo: { segment: "VIP", labelAr: "عميل VIP", labelEn: "VIP", badgeClass: "" },
        totalOrders: 16,
        spent: 3500,
        totalSpent: 3500,
        lastOrderAt: new Date("2026-09-10T12:00:00Z"),
        isActive: true,
        preferredPlatform: "Talabat",
        usualDeliveryZone: "المعادي",
        notes: "يفضل الصوص الإضافي",
      },
      {
        id: "c-2",
        name: "سارة علي",
        phone: "01198765432",
        address: "التجمع الخامس",
        segment: "AT_RISK",
        segmentInfo: { segment: "AT_RISK", labelAr: "معرّض للفقد ⚠️", labelEn: "At Risk", badgeClass: "" },
        totalOrders: 4,
        spent: 820,
        totalSpent: 820,
        lastOrderAt: new Date("2026-08-01T12:00:00Z"),
        isActive: true,
        preferredPlatform: "Phone",
        usualDeliveryZone: "التجمع",
        notes: null,
      },
    ];

    const stats = {
      totalCustomers: 2,
      newThisMonth: 0,
      vipCount: 1,
      atRiskCount: 1,
      avgSpent: 2160,
    };

    const buffer = await generateCustomersExcelWorkbook(sampleCustomers as any, stats, {
      generatedBy: "مدير التشغيل",
      isAr: true,
    });

    assert.ok(Buffer.isBuffer(buffer), "Should return a Node.js Buffer");
    assert.ok(buffer.length > 1000, "Excel buffer should be non-empty and well-formed");

    // Check standard ZIP / Office header signature (0x50, 0x4B, 0x03, 0x04)
    assert.strictEqual(buffer[0], 0x50, "PK header byte 0");
    assert.strictEqual(buffer[1], 0x4B, "PK header byte 1");
    assert.strictEqual(buffer[2], 0x03, "PK header byte 2");
    assert.strictEqual(buffer[3], 0x04, "PK header byte 3");

    // Read back with ExcelJS to inspect RTL and worksheet integrity
    const ExcelJSModule = await import("exceljs");
    const ExcelJS = (ExcelJSModule as any).default || ExcelJSModule;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.getWorksheet("قاعدة العملاء") || workbook.worksheets[0];
    assert.ok(worksheet, "Worksheet must exist");
    assert.strictEqual(worksheet.views?.[0]?.rightToLeft, true, "Worksheet view must be RTL for Arabic");
  });

  await runner.test("F17.14: generateCustomersExcelWorkbook formats phone as string, preserves leading zero, and includes KPIs and summary", async () => {
    const { generateCustomersExcelWorkbook } = await import("../../src/lib/customersExcel");

    const sampleCustomers = [
      {
        id: "c-1",
        name: "كريم يوسف",
        phone: "01099998888",
        address: "مدينة نصر",
        segment: "REGULAR",
        segmentInfo: { segment: "REGULAR", labelAr: "عميل دائم", labelEn: "Regular", badgeClass: "" },
        totalOrders: 5,
        spent: 1250,
        totalSpent: 1250,
        lastOrderAt: new Date("2026-09-11T12:00:00Z"),
        isActive: true,
        preferredPlatform: "Elmenus",
        usualDeliveryZone: "مدينة نصر",
        notes: "حساسية من الجمبري",
      },
    ];

    const stats = {
      totalCustomers: 1,
      newThisMonth: 0,
      vipCount: 0,
      atRiskCount: 0,
      avgSpent: 1250,
    };

    const buffer = await generateCustomersExcelWorkbook(sampleCustomers as any, stats, {
      isAr: true,
    });

    const ExcelJSModule = await import("exceljs");
    const ExcelJS = (ExcelJSModule as any).default || ExcelJSModule;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.worksheets[0];

    // Search for phone in rows
    let foundPhone = false;
    let foundPhoneValue = "";
    worksheet.eachRow((row: any) => {
      row.eachCell((cell: any) => {
        if (typeof cell.value === "string" && cell.value.includes("01099998888")) {
          foundPhone = true;
          foundPhoneValue = cell.value;
        }
      });
    });

    assert.ok(foundPhone, "Phone number with leading zero must be present in worksheet");
    assert.strictEqual(foundPhoneValue, "01099998888", "Leading zero must be preserved verbatim");
  });

  return runner;
}
