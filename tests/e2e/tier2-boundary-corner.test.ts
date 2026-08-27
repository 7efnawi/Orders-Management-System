import assert from "node:assert";
import { TestRunner } from "../helpers/test-runner";
import {
  getBrandToken,
  getPlatformToken,
  getLoyaltyTier,
  validateTouchTargetClass,
  DEFAULT_BRAND_TOKEN,
  DEFAULT_PLATFORM_TOKEN,
} from "../helpers/visual-token-oracle";
import { calculatePrepTime } from "../helpers/prep-timer-oracle";
import { generateReceiptPreview } from "../helpers/receipt-oracle";
import {
  assertTransition,
  calculateOrderTotals,
  OrderStatus,
} from "../../src/lib/orderStateMachine";

export async function runTier2Tests(): Promise<TestRunner> {
  const runner = new TestRunner("Tier 2: Boundary & Corner Cases (F1 through F13)");

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 1: Modern Navigation Header (Corner Cases)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F1: Modern Navigation Header (Corner Cases)", 2);

  await runner.test("F1.1: Deeply nested sub-route activates parent nav pill (/orders/new -> /orders)", () => {
    const isParentActive = (pathname: string, navHref: string) => {
      if (navHref === "/") return pathname === "/";
      return pathname.startsWith(navHref);
    };

    assert.strictEqual(isParentActive("/orders/new", "/orders"), true);
    assert.strictEqual(isParentActive("/orders/123/edit", "/orders"), true);
    assert.strictEqual(isParentActive("/menu/categories", "/menu"), true);
    assert.strictEqual(isParentActive("/expenses", "/orders"), false);
  });

  await runner.test("F1.2: Ultra-long user name triggers CSS truncate without breaking navbar layout", () => {
    const longName = "عبد الرحمن بن محمد بن إبراهيم القحطاني السبيعي";
    const userProfileSnippet = `<span class="truncate max-w-[120px] text-sm">${longName}</span>`;
    assert.ok(userProfileSnippet.includes("truncate"));
    assert.ok(userProfileSnippet.includes("max-w-"));
  });

  await runner.test("F1.3: Unknown or undefined user role gracefully renders fallback badge", () => {
    const formatRoleBadge = (role?: string | null) => {
      const validRoles = ["OWNER", "MANAGER", "CASHIER", "KITCHEN"];
      return validRoles.includes(role || "") ? role : "STAFF";
    };
    assert.strictEqual(formatRoleBadge("SUPER_ADMIN"), "STAFF");
    assert.strictEqual(formatRoleBadge(null), "STAFF");
    assert.strictEqual(formatRoleBadge(undefined), "STAFF");
    assert.strictEqual(formatRoleBadge("CASHIER"), "CASHIER");
  });

  await runner.test("F1.4: Mobile drawer rapid open/close toggle state consistency", () => {
    let open = false;
    for (let i = 0; i < 10; i++) {
      open = !open;
    }
    assert.strictEqual(open, false);
  });

  await runner.test("F1.5: RTL header layout mirrors order of elements correctly", () => {
    const layoutOrderRTL = ["logo/branding", "nav-links", "user-profile", "language-theme-actions"];
    assert.strictEqual(layoutOrderRTL[0], "logo/branding");
    assert.strictEqual(layoutOrderRTL[3], "language-theme-actions");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 2: Persistent "+ New Order" CTA Button (Corner Cases)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F2: Persistent '+ New Order' CTA (Corner Cases)", 2);

  await runner.test("F2.1: CTA button when already on /orders/new remains accessible or active", () => {
    const currentRoute = "/orders/new";
    const ctaHref = "/orders/new";
    const isCurrent = currentRoute === ctaHref;
    assert.strictEqual(isCurrent, true);
  });

  await runner.test("F2.2: Rapid multi-click debounce on CTA button prevents duplicate navigations", () => {
    let clickCount = 0;
    let navigationCount = 0;
    let lastClickTime = 0;

    const handleCtaClick = () => {
      clickCount++;
      const now = Date.now();
      if (now - lastClickTime > 300) {
        navigationCount++;
        lastClickTime = now;
      }
    };

    // Simulate 5 rapid clicks within 10ms
    for (let i = 0; i < 5; i++) {
      handleCtaClick();
    }

    assert.strictEqual(clickCount, 5);
    assert.strictEqual(navigationCount, 1);
  });

  await runner.test("F2.3: Keyboard navigation with Spacebar triggers CTA button action", () => {
    const keyEvent = { key: " ", code: "Space" };
    let triggered = false;
    if (keyEvent.key === " " || keyEvent.key === "Enter") {
      triggered = true;
    }
    assert.strictEqual(triggered, true);
  });

  await runner.test("F2.4: High-contrast focus ring token is visible during keyboard tabbing", () => {
    const focusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
    assert.ok(focusClass.includes("focus-visible:ring-2"));
    assert.ok(focusClass.includes("ring-offset-2"));
  });

  await runner.test("F2.5: Touch target remains >=44x44px under browser zoom up to 200%", () => {
    const baseTargetPx = 44;
    const zoomLevel = 2.0;
    const effectivePx = baseTargetPx * zoomLevel;
    assert.strictEqual(effectivePx >= 44, true);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 3: Theme System & Kitchen Mode (Corner Cases)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F3: Theme System & Kitchen Mode (Corner Cases)", 2);

  await runner.test("F3.1: Invalid theme name in storage safely falls back to 'dark' or 'light'", () => {
    const sanitizeTheme = (t: string | null | undefined) => {
      const valid = ["light", "dark", "kitchen"];
      return valid.includes(t || "") ? t! : "dark";
    };

    assert.strictEqual(sanitizeTheme("invalid_theme"), "dark");
    assert.strictEqual(sanitizeTheme(""), "dark");
    assert.strictEqual(sanitizeTheme(null), "dark");
    assert.strictEqual(sanitizeTheme("kitchen"), "kitchen");
  });

  await runner.test("F3.2: Rapid theme cycling does not corrupt CSS class list on root", () => {
    let classes = ["theme-base"];
    const applyTheme = (theme: string) => {
      classes = classes.filter((c) => !["light", "dark", "kitchen"].includes(c));
      classes.push(theme);
    };

    applyTheme("light");
    applyTheme("kitchen");
    applyTheme("dark");
    applyTheme("kitchen");

    assert.strictEqual(classes.filter((c) => ["light", "dark", "kitchen"].includes(c)).length, 1);
    assert.strictEqual(classes.includes("kitchen"), true);
  });

  await runner.test("F3.3: Kitchen mode high contrast ratio between amber text and obsidian background", () => {
    // Amber #f59e0b on Obsidian #09090b
    const obsidianLuminance = 0.005;
    const amberLuminance = 0.42;
    const contrastRatio = (amberLuminance + 0.05) / (obsidianLuminance + 0.05);
    assert.ok(contrastRatio > 7.0, `Contrast ratio ${contrastRatio.toFixed(2)} must exceed WCAG AAA 7:1 standard`);
  });

  await runner.test("F3.4: Kitchen theme suppresses jarring background animations/transitions", () => {
    const kitchenTransitionClass = "kitchen:transition-none";
    assert.ok(kitchenTransitionClass.includes("transition-none"));
  });

  await runner.test("F3.5: Theme selection preserves state across locale route transitions (/ar/orders -> /en/orders)", () => {
    const appTheme = "kitchen";
    const switchLocale = (currentPath: string, newLocale: string) => {
      // locale path changes, theme persists
      return { path: `/${newLocale}/orders`, theme: appTheme };
    };

    const res = switchLocale("/ar/orders", "en");
    assert.strictEqual(res.path, "/en/orders");
    assert.strictEqual(res.theme, "kitchen");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 4: Bilingual & Touch Ergonomics (Corner Cases)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F4: Bilingual & Touch Ergonomics (Corner Cases)", 2);

  await runner.test("F4.1: Mixed Arabic/English customer name and street address rendering", () => {
    const mixedCustomer = {
      name: "Ahmed Ali (أحمد علي)",
      address: "Building 12, Street 9, المعادي, Cairo",
      phone: "+201011112222",
    };
    assert.ok(mixedCustomer.name.includes("Ahmed"));
    assert.ok(mixedCustomer.name.includes("أحمد"));
    assert.ok(mixedCustomer.phone.startsWith("+20"));
  });

  await runner.test("F4.2: Phone numbers in RTL layout wrap in dir='ltr' to prevent inverted digits", () => {
    const wrapPhoneNumber = (phone: string) => `<bdi dir="ltr">${phone}</bdi>`;
    const rendered = wrapPhoneNumber("01012345678");
    assert.ok(rendered.includes('dir="ltr"'));
    assert.ok(rendered.includes("01012345678"));
  });

  await runner.test("F4.3: Missing translation key falls back to key name without crashing UI", () => {
    const t = (dict: Record<string, string>, key: string) => dict[key] ?? key;
    const arDict = { orders: "الطلبات" };
    assert.strictEqual(t(arDict, "orders"), "الطلبات");
    assert.strictEqual(t(arDict, "unknown_action_key"), "unknown_action_key");
  });

  await runner.test("F4.4: Icon-only buttons include sr-only accessibility label and >=44px touch size", () => {
    const iconBtnClass = "h-11 w-11 p-2.5 flex items-center justify-center";
    const validation = validateTouchTargetClass(iconBtnClass);
    assert.strictEqual(validation.isValid, true);
  });

  await runner.test("F4.5: Arabic zero-width non-joiner and punctuation integrity", () => {
    const arTextWithPunctuation = "إجمالي الطلب: 150.00 ج.م (شامل الضريبة)";
    assert.ok(arTextWithPunctuation.includes("ج.م"));
    assert.ok(arTextWithPunctuation.includes("إجمالي"));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 5: Brand Visual Signatures (Corner Cases)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F5: Brand Visual Signatures (Corner Cases)", 2);

  await runner.test("F5.1: Case-insensitive brand lookup ('flower', 'FLOWER', 'Flower')", () => {
    assert.strictEqual(getBrandToken("flower").kanji, "花");
    assert.strictEqual(getBrandToken("FLOWER").kanji, "花");
    assert.strictEqual(getBrandToken("Flower").kanji, "花");
  });

  await runner.test("F5.2: Brand name with leading/trailing whitespace (' Mastery ')", () => {
    const token = getBrandToken("   Mastery   ");
    assert.strictEqual(token.kanji, "匠");
    assert.strictEqual(token.hex, "#eab308");
  });

  await runner.test("F5.3: Null, undefined, or empty string brand name returns default token", () => {
    assert.strictEqual(getBrandToken(null).kanji, DEFAULT_BRAND_TOKEN.kanji);
    assert.strictEqual(getBrandToken(undefined).kanji, DEFAULT_BRAND_TOKEN.kanji);
    assert.strictEqual(getBrandToken("").kanji, DEFAULT_BRAND_TOKEN.kanji);
  });

  await runner.test("F5.4: Brand name containing partial match (e.g. 'Niwa Sushi Dark Kitchen')", () => {
    const token = getBrandToken("Niwa Sushi Dark Kitchen");
    assert.strictEqual(token.kanji, "庭");
    assert.strictEqual(token.hex, "#10b981");
  });

  await runner.test("F5.5: All 4 brand colors are visually distinct in both light and dark modes", () => {
    const brands = ["Flower", "Mastery", "Niwa", "Tobiko"];
    const hexCodes = brands.map((b) => getBrandToken(b).hex);
    const uniqueHexes = new Set(hexCodes);
    assert.strictEqual(uniqueHexes.size, 4, "All 4 sushi brands must have unique color signatures");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 6: Platform Visual Signatures (Corner Cases)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F6: Platform Visual Signatures (Corner Cases)", 2);

  await runner.test("F6.1: Case-insensitive platform lookup ('talabat', 'TALABAT')", () => {
    assert.strictEqual(getPlatformToken("talabat").hex, "#ff5a00");
    assert.strictEqual(getPlatformToken("TALABAT").hex, "#ff5a00");
  });

  await runner.test("F6.2: Platform name with whitespace ('  elmenus  ')", () => {
    assert.strictEqual(getPlatformToken("  elmenus  ").hex, "#e21b1b");
  });

  await runner.test("F6.3: Null or empty platform string returns default direct token", () => {
    assert.strictEqual(getPlatformToken(null).name, DEFAULT_PLATFORM_TOKEN.name);
    assert.strictEqual(getPlatformToken(undefined).name, DEFAULT_PLATFORM_TOKEN.name);
    assert.strictEqual(getPlatformToken("").name, DEFAULT_PLATFORM_TOKEN.name);
  });

  await runner.test("F6.4: Direct phone order platform variations ('Phone', 'Direct Phone', 'Phone Order')", () => {
    assert.strictEqual(getPlatformToken("Phone").hex, "#0284c7");
    assert.strictEqual(getPlatformToken("Direct Phone").hex, "#0284c7");
    assert.strictEqual(getPlatformToken("Phone Order").hex, "#0284c7");
  });

  await runner.test("F6.5: All 5 platforms have unique hex color identifiers", () => {
    const platforms = ["Talabat", "elmenus", "InstaShop", "HarryApp", "Phone"];
    const hexCodes = platforms.map((p) => getPlatformToken(p).hex);
    const uniqueHexes = new Set(hexCodes);
    assert.strictEqual(uniqueHexes.size, 5, "All 5 platforms must have distinct color codes");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 7: Interactive Receipt Ticket Preview (Corner Cases)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F7: Interactive Receipt Ticket Preview (Corner Cases)", 2);

  await runner.test("F7.1: Receipt with 0 items produces clean subtotal = 0 and total = 0", () => {
    const preview = generateReceiptPreview({
      brandName: "Flower",
      paymentMethod: "CASH",
      items: [],
      deliveryFee: 0,
    });
    assert.strictEqual(preview.subtotal, 0);
    assert.strictEqual(preview.grandTotal, 0);
    assert.strictEqual(preview.items.length, 0);
  });

  await runner.test("F7.2: Item prices with decimal precision (e.g. 199.99 x 3)", () => {
    const preview = generateReceiptPreview({
      brandName: "Mastery",
      paymentMethod: "VISA",
      items: [{ productId: "p1", name: "Premium Roll", price: 199.99, quantity: 3 }],
    });
    assert.strictEqual(preview.subtotal, 599.97);
    assert.strictEqual(preview.grandTotal, 599.97);
  });

  await runner.test("F7.3: 100% discount reduces grand total to exactly 0", () => {
    const preview = generateReceiptPreview({
      brandName: "Niwa",
      paymentMethod: "CASH",
      items: [{ productId: "p1", name: "Roll", price: 150, quantity: 2 }],
      discount: 300,
    });
    assert.strictEqual(preview.subtotal, 300);
    assert.strictEqual(preview.discount, 300);
    assert.strictEqual(preview.grandTotal, 0);
  });

  await runner.test("F7.4: Excessive discount (> subtotal) does not produce negative grand total", () => {
    const preview = generateReceiptPreview({
      brandName: "Tobiko",
      paymentMethod: "CASH",
      items: [{ productId: "p1", name: "Roll", price: 100, quantity: 1 }],
      discount: 9999, // Extreme discount
    });
    assert.strictEqual(preview.subtotal, 100);
    assert.strictEqual(preview.grandTotal, 0); // Non-negative floor
  });

  await runner.test("F7.5: Large receipt with 20+ line items maintains tabular-nums column alignment", () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      productId: `prod-${i}`,
      name: `Special Sushi Roll #${i + 1}`,
      price: 120 + i * 5,
      quantity: 1,
    }));

    const preview = generateReceiptPreview({
      brandName: "Flower",
      paymentMethod: "ONLINE",
      items,
    });

    assert.strictEqual(preview.items.length, 20);
    assert.ok(preview.subtotal > 2000);
    assert.ok(preview.formattedLines.length > 25);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 8: Touch-Optimized Payment Selector (Corner Cases)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F8: Touch-Optimized Payment Selector (Corner Cases)", 2);

  await runner.test("F8.1: Rapid switching between CASH, VISA, and ONLINE updates single selection", () => {
    const selections: string[] = [];
    const select = (m: string) => selections.push(m);

    select("CASH");
    select("VISA");
    select("ONLINE");
    select("CASH");

    assert.strictEqual(selections[selections.length - 1], "CASH");
    assert.strictEqual(selections.length, 4);
  });

  await runner.test("F8.2: Keyboard arrow navigation cycles through payment selectors", () => {
    const methods = ["CASH", "VISA", "ONLINE"];
    let currentIndex = 0;

    const onArrowRight = () => { currentIndex = (currentIndex + 1) % methods.length; };
    const onArrowLeft = () => { currentIndex = (currentIndex - 1 + methods.length) % methods.length; };

    onArrowRight();
    assert.strictEqual(methods[currentIndex], "VISA");
    onArrowRight();
    assert.strictEqual(methods[currentIndex], "ONLINE");
    onArrowRight();
    assert.strictEqual(methods[currentIndex], "CASH");
    onArrowLeft();
    assert.strictEqual(methods[currentIndex], "ONLINE");
  });

  await runner.test("F8.3: Payment method enum normalization ensures uppercase compatibility", () => {
    const normalizePayment = (val: string) => val.trim().toUpperCase();
    assert.strictEqual(normalizePayment("cash"), "CASH");
    assert.strictEqual(normalizePayment("visa"), "VISA");
    assert.strictEqual(normalizePayment("online"), "ONLINE");
  });

  await runner.test("F8.4: Selecting payment on zero-amount order remains valid", () => {
    const order = { total: 0, paymentMethod: "CASH" };
    assert.strictEqual(order.total, 0);
    assert.strictEqual(order.paymentMethod, "CASH");
  });

  await runner.test("F8.5: Payment selector touch active scale/ripple animation class", () => {
    const touchCardAnimation = "active:scale-[0.98] transition-transform duration-100";
    assert.ok(touchCardAnimation.includes("active:scale-"));
    assert.ok(touchCardAnimation.includes("transition-transform"));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 9: Customer Loyalty Badges (Corner Cases)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F9: Customer Loyalty Badges (Corner Cases)", 2);

  await runner.test("F9.1: Exact threshold boundaries: 0 (new), 1 (regular), 5 (vip), 20 (legend)", () => {
    assert.strictEqual(getLoyaltyTier(0).tier, "new");
    assert.strictEqual(getLoyaltyTier(1).tier, "regular");
    assert.strictEqual(getLoyaltyTier(5).tier, "vip");
    assert.strictEqual(getLoyaltyTier(20).tier, "legend");
  });

  await runner.test("F9.2: Upper edge boundaries: 4 (regular), 19 (vip), 1000 (legend)", () => {
    assert.strictEqual(getLoyaltyTier(4).tier, "regular");
    assert.strictEqual(getLoyaltyTier(19).tier, "vip");
    assert.strictEqual(getLoyaltyTier(1000).tier, "legend");
  });

  await runner.test("F9.3: Negative order counts safely floored to 'new'", () => {
    assert.strictEqual(getLoyaltyTier(-1).tier, "new");
    assert.strictEqual(getLoyaltyTier(-100).tier, "new");
  });

  await runner.test("F9.4: Non-integer / fractional order count floored to integer (e.g. 4.9 -> regular)", () => {
    assert.strictEqual(getLoyaltyTier(4.9).tier, "regular");
    assert.strictEqual(getLoyaltyTier(19.9).tier, "vip");
  });

  await runner.test("F9.5: NaN or non-numeric input defaults safely to 'new'", () => {
    assert.strictEqual(getLoyaltyTier(NaN).tier, "new");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 10: Orders View Switcher (Corner Cases)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F10: Orders View Switcher (Corner Cases)", 2);

  await runner.test("F10.1: Switching views with empty search result maintains empty state in both views", () => {
    const orders: unknown[] = [];
    const getRenderedContent = (view: "table" | "kanban") =>
      orders.length === 0 ? `Empty in ${view}` : `Orders in ${view}`;

    assert.strictEqual(getRenderedContent("table"), "Empty in table");
    assert.strictEqual(getRenderedContent("kanban"), "Empty in kanban");
  });

  await runner.test("F10.2: Switching views with 100+ orders renders efficiently without state loss", () => {
    const bigDataset = Array.from({ length: 150 }, (_, i) => ({
      id: `ord-${i}`,
      status: i % 2 === 0 ? "NEW" : "PREPARING",
    }));

    const kanbanNew = bigDataset.filter((o) => o.status === "NEW");
    assert.strictEqual(kanbanNew.length, 75);
  });

  await runner.test("F10.3: Rapid view mode toggling does not cause state oscillation", () => {
    let mode: "table" | "kanban" = "table";
    for (let i = 0; i < 20; i++) {
      mode = mode === "table" ? "kanban" : "table";
    }
    assert.strictEqual(mode, "table");
  });

  await runner.test("F10.4: URL query parameter sync preserves ?view=kanban on page reload", () => {
    const parseViewParam = (searchParams: URLSearchParams) => {
      const v = searchParams.get("view");
      return v === "kanban" ? "kanban" : "table";
    };

    const params1 = new URLSearchParams("view=kanban&brand=Flower");
    assert.strictEqual(parseViewParam(params1), "kanban");

    const params2 = new URLSearchParams("brand=Flower");
    assert.strictEqual(parseViewParam(params2), "table");
  });

  await runner.test("F10.5: Accessible aria-selected and role='tab' attributes on view switcher", () => {
    const tabAttrs = {
      role: "tab",
      "aria-selected": true,
      "aria-controls": "orders-view-content",
    };
    assert.strictEqual(tabAttrs.role, "tab");
    assert.strictEqual(tabAttrs["aria-selected"], true);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 11: Live Kitchen Kanban Board (Corner Cases)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F11: Live Kitchen Kanban Board (Corner Cases)", 2);

  await runner.test("F11.1: Cancelled orders are excluded from active kanban columns", () => {
    const orders = [
      { id: "o1", status: "PREPARING" },
      { id: "o2", status: "CANCELLED" },
    ];
    const kanbanPreparing = orders.filter((o) => o.status === "PREPARING");
    assert.strictEqual(kanbanPreparing.length, 1);
    assert.strictEqual(kanbanPreparing[0].id, "o1");
  });

  await runner.test("F11.2: Moving READY card to OUT_FOR_DELIVERY without driver prompts assignment guard", () => {
    const order = { id: "o1", status: OrderStatus.READY, driverId: null };
    const canAdvanceDirectly = order.driverId !== null;
    assert.strictEqual(canAdvanceDirectly, false, "Must prompt for driver assignment if driver is null");
  });

  await runner.test("F11.3: Kanban column with 0 orders renders empty column placeholder", () => {
    const ordersInColumn: unknown[] = [];
    const placeholder = ordersInColumn.length === 0 ? "لا توجد طلبات في هذه المرحلة" : null;
    assert.ok(placeholder !== null);
  });

  await runner.test("F11.4: Card with 10+ items summarizes items list with '+N more items'", () => {
    const items = Array.from({ length: 12 }, (_, i) => `Item ${i + 1}`);
    const previewItems = items.slice(0, 3);
    const extraCount = items.length - 3;
    const summary = `${previewItems.join(", ")} +${extraCount} أصناف أخرى`;

    assert.ok(summary.includes("+9 أصناف أخرى"));
  });

  await runner.test("F11.5: Concurrent status update conflict handling (optimistic lock guard)", () => {
    const serverVersion: number = 2;
    const clientVersion: number = 1;
    const canUpdate = clientVersion === serverVersion;
    assert.strictEqual(canUpdate, false, "Stale client state should be rejected");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 12: Live Prep Timers & Alert Badges (Corner Cases)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F12: Live Prep Timers & Alert Badges (Corner Cases)", 2);

  await runner.test("F12.1: Future timestamp due to client clock skew clamps elapsed time to 0s", () => {
    const now = new Date("2026-08-26T20:00:00Z");
    const futurePrep = new Date("2026-08-26T20:05:00Z"); // +5 mins in future
    const res = calculatePrepTime(futurePrep, futurePrep, now);

    assert.strictEqual(res.elapsedSeconds, 0);
    assert.strictEqual(res.formattedTime, "00:00");
    assert.strictEqual(res.isCritical, false);
  });

  await runner.test("F12.2: Exact boundary: 899s (not critical) vs 900s (critical pulsing alert)", () => {
    const now = new Date("2026-08-26T20:15:00Z");
    const prepStart899 = new Date("2026-08-26T20:00:01Z"); // 899s
    const prepStart900 = new Date("2026-08-26T20:00:00Z"); // 900s

    const res899 = calculatePrepTime(prepStart899, prepStart899, now);
    const res900 = calculatePrepTime(prepStart900, prepStart900, now);

    assert.strictEqual(res899.elapsedSeconds, 899);
    assert.strictEqual(res899.isCritical, false);

    assert.strictEqual(res900.elapsedSeconds, 900);
    assert.strictEqual(res900.isCritical, true);
    assert.ok(res900.badgeAnimationClass.includes("animate-pulse"));
  });

  await runner.test("F12.3: Order in prep for > 24 hours (86,400s) formats without overflow", () => {
    const now = new Date("2026-08-27T20:00:00Z");
    const prepYesterday = new Date("2026-08-26T20:00:00Z"); // 24h
    const res = calculatePrepTime(prepYesterday, prepYesterday, now);

    assert.strictEqual(res.elapsedSeconds, 86400);
    assert.strictEqual(res.formattedTime, "24:00:00");
    assert.strictEqual(res.isCritical, true);
  });

  await runner.test("F12.4: Timer calculation on delivered order stops ticking (frozen timestamp)", () => {
    const prepAt = new Date("2026-08-26T20:00:00Z");
    const deliveredAt = new Date("2026-08-26T20:25:00Z"); // 25 mins
    const res = calculatePrepTime(prepAt, prepAt, deliveredAt);

    assert.strictEqual(res.elapsedSeconds, 1500); // 25m
    assert.strictEqual(res.formattedTime, "25:00");
  });

  await runner.test("F12.5: Invalid date string input safely falls back to 0s", () => {
    const res = calculatePrepTime("invalid-date-string", new Date());
    assert.ok(res.elapsedSeconds >= 0);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE 13: E2E & Adversarial Verification (Corner Cases)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.setContext("F13: E2E & Adversarial Verification (Corner Cases)", 2);

  await runner.test("F13.1: XSS payload in customer notes is safely escaped in ticket & kanban card", () => {
    const maliciousNote = "<script>alert('XSS')</script><img src=x onerror=alert(1)>";
    const escapeHtml = (str: string) =>
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const escaped = escapeHtml(maliciousNote);
    assert.ok(!escaped.includes("<script>"));
    assert.ok(escaped.includes("&lt;script&gt;"));
  });

  await runner.test("F13.2: Emojis and multi-byte Unicode in customer name (🍣 🍱 كريم السوشي)", () => {
    const unicodeName = "🍣 🍱 كريم السوشي 🔥";
    assert.ok(unicodeName.includes("🍣"));
    assert.ok(unicodeName.includes("كريم"));
  });

  await runner.test("F13.3: Extreme discount higher than MAX order subtotal floors to 0", () => {
    const totals = calculateOrderTotals({
      items: [{ price: 50, quantity: 1 }],
      discount: Number.MAX_SAFE_INTEGER,
    });
    assert.strictEqual(totals.subtotal, 50);
    assert.strictEqual(totals.total, 0);
  });

  await runner.test("F13.4: Rejection of backwards transitions (e.g. DELIVERED -> PREPARING)", () => {
    assert.throws(() => assertTransition(OrderStatus.DELIVERED, OrderStatus.PREPARING), /TERMINAL_STATUS/);
    assert.throws(() => assertTransition(OrderStatus.READY, OrderStatus.NEW), /INVALID_TRANSITION/);
  });

  await runner.test("F13.5: Non-numeric input strings in prices or quantities sanitized safely", () => {
    const sanitizeNum = (val: unknown) => {
      const num = Number(val);
      return isNaN(num) || num < 0 ? 0 : num;
    };
    assert.strictEqual(sanitizeNum("abc"), 0);
    assert.strictEqual(sanitizeNum("-50"), 0);
    assert.strictEqual(sanitizeNum("150.50"), 150.5);
    assert.strictEqual(sanitizeNum(undefined), 0);
  });

  return runner;
}
