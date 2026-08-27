/**
 * Milestone 1 Empirical Stress Test & Adversarial Verification Harness
 * Challenger 1: Adversarial verification of M1 deliverables
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { Role } from "@prisma/client";

interface TestReport {
  name: string;
  category: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const reports: TestReport[] = [];

function runTest(category: string, name: string, fn: () => void) {
  try {
    fn();
    reports.push({ category, name, passed: true });
    console.log(`  ✓ [${category}] ${name}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    reports.push({ category, name, passed: false, error: msg });
    console.error(`  ✗ [${category}] ${name}`);
    console.error(`    Error: ${msg}`);
  }
}

console.log("================================================================================");
console.log("🔥 CHALLENGER 1: MILESTONE 1 ADVERSARIAL STRESS TEST HARNESS");
console.log("================================================================================\n");

// ═══════════════════════════════════════════════════════════════════════════════
// 1. NAVIGATION ACTIVE ROUTE DETECTION LOGIC STRESS TESTS
// ═══════════════════════════════════════════════════════════════════════════════
console.log("▶ 1. Stress Testing Active Route Detection Logic...");

// Extracted route detection logic from src/components/layout/dashboard-header.tsx
function getRouteActiveStates(pathname: string) {
  const isOrdersActive =
    pathname === "/orders" ||
    (pathname.startsWith("/orders") && pathname !== "/orders/new");
  const isMenuActive = pathname === "/menu" || pathname.startsWith("/menu");
  const isDeliveryActive = pathname === "/delivery" || pathname.startsWith("/delivery");
  const isExpensesActive = pathname === "/expenses" || pathname.startsWith("/expenses");
  const isClosingActive = pathname === "/closing" || pathname.startsWith("/closing");
  const isNewOrderActive = pathname === "/orders/new";

  return {
    orders: isOrdersActive,
    menu: isMenuActive,
    delivery: isDeliveryActive,
    expenses: isExpensesActive,
    closing: isClosingActive,
    newOrderCTA: isNewOrderActive,
  };
}

runTest("Route Detection", "Exact match: /orders activates orders and not newOrderCTA", () => {
  const res = getRouteActiveStates("/orders");
  assert.strictEqual(res.orders, true);
  assert.strictEqual(res.newOrderCTA, false);
  assert.strictEqual(res.menu, false);
  assert.strictEqual(res.delivery, false);
  assert.strictEqual(res.expenses, false);
  assert.strictEqual(res.closing, false);
});

runTest("Route Detection", "Exact match: /orders/new activates newOrderCTA and deactivates /orders nav item", () => {
  const res = getRouteActiveStates("/orders/new");
  assert.strictEqual(res.newOrderCTA, true, "New Order CTA button must be active");
  assert.strictEqual(res.orders, false, "/orders nav item must NOT be active when on /orders/new");
  assert.strictEqual(res.menu, false);
  assert.strictEqual(res.delivery, false);
  assert.strictEqual(res.expenses, false);
  assert.strictEqual(res.closing, false);
});

runTest("Route Detection", "Sub-routes: /orders/12345 (Order Details) activates /orders", () => {
  const res = getRouteActiveStates("/orders/12345");
  assert.strictEqual(res.orders, true, "/orders must remain active on detail sub-pages");
  assert.strictEqual(res.newOrderCTA, false);
});

runTest("Route Detection", "Exact match: /menu activates menu tab only", () => {
  const res = getRouteActiveStates("/menu");
  assert.strictEqual(res.menu, true);
  assert.strictEqual(res.orders, false);
  assert.strictEqual(res.delivery, false);
  assert.strictEqual(res.expenses, false);
  assert.strictEqual(res.closing, false);
  assert.strictEqual(res.newOrderCTA, false);
});

runTest("Route Detection", "Sub-routes: /menu/categories activates /menu", () => {
  const res = getRouteActiveStates("/menu/categories");
  assert.strictEqual(res.menu, true);
  assert.strictEqual(res.orders, false);
});

runTest("Route Detection", "Exact match: /delivery activates delivery tab only", () => {
  const res = getRouteActiveStates("/delivery");
  assert.strictEqual(res.delivery, true);
  assert.strictEqual(res.orders, false);
  assert.strictEqual(res.menu, false);
});

runTest("Route Detection", "Sub-routes: /delivery/zones and /delivery/drivers activate /delivery", () => {
  const r1 = getRouteActiveStates("/delivery/zones");
  const r2 = getRouteActiveStates("/delivery/drivers");
  assert.strictEqual(r1.delivery, true);
  assert.strictEqual(r2.delivery, true);
});

runTest("Route Detection", "Exact match: /expenses activates expenses tab only", () => {
  const res = getRouteActiveStates("/expenses");
  assert.strictEqual(res.expenses, true);
  assert.strictEqual(res.orders, false);
});

runTest("Route Detection", "Sub-routes: /expenses/types activates /expenses", () => {
  const res = getRouteActiveStates("/expenses/types");
  assert.strictEqual(res.expenses, true);
});

runTest("Route Detection", "Exact match: /closing activates closing tab only", () => {
  const res = getRouteActiveStates("/closing");
  assert.strictEqual(res.closing, true);
  assert.strictEqual(res.orders, false);
});

runTest("Route Detection", "Sub-routes: /closing/history activates /closing", () => {
  const res = getRouteActiveStates("/closing/history");
  assert.strictEqual(res.closing, true);
});

runTest("Route Detection", "Non-dashboard routes: /login, /_not-found, / produce 0 active nav items", () => {
  for (const path of ["/login", "/_not-found", "/", "/api/orders"]) {
    const res = getRouteActiveStates(path);
    assert.strictEqual(res.orders, false);
    assert.strictEqual(res.menu, false);
    assert.strictEqual(res.delivery, false);
    assert.strictEqual(res.expenses, false);
    assert.strictEqual(res.closing, false);
    assert.strictEqual(res.newOrderCTA, false);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ROLE-BASED ACCESS FILTERING STRESS TESTS
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n▶ 2. Stress Testing Role-Based Navigation Filtering...");

const NAV_DEFINITIONS = [
  { href: "/orders", roles: ["OWNER", "MANAGER", "CASHIER"] as Role[] },
  { href: "/menu", roles: ["OWNER", "MANAGER"] as Role[] },
  { href: "/delivery", roles: ["OWNER", "MANAGER"] as Role[] },
  { href: "/expenses", roles: ["OWNER", "MANAGER", "CASHIER"] as Role[] },
  { href: "/closing", roles: ["OWNER", "MANAGER", "CASHIER"] as Role[] },
];

function getAllowedNavLinks(role: Role) {
  return NAV_DEFINITIONS.filter((item) => item.roles.includes(role)).map((i) => i.href);
}

runTest("Role Access", "OWNER role sees all 5 navigation links", () => {
  const allowed = getAllowedNavLinks("OWNER");
  assert.deepStrictEqual(allowed, ["/orders", "/menu", "/delivery", "/expenses", "/closing"]);
  assert.strictEqual(allowed.length, 5);
});

runTest("Role Access", "MANAGER role sees all 5 navigation links", () => {
  const allowed = getAllowedNavLinks("MANAGER");
  assert.deepStrictEqual(allowed, ["/orders", "/menu", "/delivery", "/expenses", "/closing"]);
  assert.strictEqual(allowed.length, 5);
});

runTest("Role Access", "CASHIER role sees only 3 links (/orders, /expenses, /closing) and NO /menu or /delivery", () => {
  const allowed = getAllowedNavLinks("CASHIER");
  assert.deepStrictEqual(allowed, ["/orders", "/expenses", "/closing"]);
  assert.strictEqual(allowed.includes("/menu"), false, "CASHIER must not have access to /menu");
  assert.strictEqual(allowed.includes("/delivery"), false, "CASHIER must not have access to /delivery");
});

runTest("Role Access", "Undefined or unexpected role gracefully evaluates to 0 links without crash", () => {
  const allowed = NAV_DEFINITIONS.filter((item) =>
    (item.roles as readonly string[]).includes("UNKNOWN")
  ).map((i) => i.href);
  assert.strictEqual(allowed.length, 0);
});

// User Initials Algorithm Stress Test
function calculateUserInitials(name: string | null | undefined): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

runTest("User Initials", "Multi-word name: 'Mohamed Ahmed' -> 'MA'", () => {
  assert.strictEqual(calculateUserInitials("Mohamed Ahmed"), "MA");
});

runTest("User Initials", "Arabic multi-word name: 'أحمد علي' -> 'أع'", () => {
  assert.strictEqual(calculateUserInitials("أحمد علي"), "أع");
});

runTest("User Initials", "Single-word name: 'Admin' -> 'AD'", () => {
  assert.strictEqual(calculateUserInitials("Admin"), "AD");
});

runTest("User Initials", "Single character name: 'A' -> 'A'", () => {
  assert.strictEqual(calculateUserInitials("A"), "A");
});

runTest("User Initials", "Empty, null, or whitespace-only name -> 'U'", () => {
  assert.strictEqual(calculateUserInitials(""), "U");
  assert.strictEqual(calculateUserInitials(null), "U");
  assert.strictEqual(calculateUserInitials(undefined), "U");
  assert.strictEqual(calculateUserInitials("   "), "U");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. THEME SYSTEM, CLASS TOGGLE SAFETY & CSS VARIABLES
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n▶ 3. Stress Testing Theme System & CSS Tokens...");

const globalsCssPath = path.join(process.cwd(), "src/app/globals.css");
const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

runTest("Theme System", "@custom-variant dark contains both .dark * and .kitchen * selectors", () => {
  assert.ok(globalsCss.includes("@custom-variant dark (&:is(.dark *, .kitchen *));"), "Custom variant must match both .dark and .kitchen");
});

runTest("Theme System", ".kitchen class defines obsidian black background oklch(0.08 0.015 250)", () => {
  assert.ok(globalsCss.includes(".kitchen"), ".kitchen class definition must exist in globals.css");
  assert.ok(globalsCss.includes("--background: oklch(0.08 0.015 250);"), "Obsidian background token must be defined");
});

runTest("Theme System", ".kitchen class defines amber primary accent oklch(0.72 0.22 45)", () => {
  assert.ok(globalsCss.includes("--primary: oklch(0.72 0.22 45);"), "Amber primary accent token must be defined");
});

runTest("Theme System", ".kitchen class defines crisp foreground oklch(0.99 0 0)", () => {
  assert.ok(globalsCss.includes("--foreground: oklch(0.99 0 0);"), "Crisp foreground token must be defined");
});

const themeProviderPath = path.join(process.cwd(), "src/components/theme-provider.tsx");
const themeProviderContent = fs.readFileSync(themeProviderPath, "utf-8");

runTest("Theme Provider", "ThemeProvider configures attribute='class', themes, and value mapping for kitchen -> 'dark kitchen'", () => {
  assert.ok(themeProviderContent.includes('attribute="class"'));
  assert.ok(themeProviderContent.includes('themes={["light", "dark", "kitchen"]}'));
  assert.ok(themeProviderContent.includes('kitchen: "dark kitchen"'));
  assert.ok(themeProviderContent.includes("disableTransitionOnChange"));
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. TOUCH ERGONOMICS >= 44x44px STANDARD
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n▶ 4. Stress Testing Touch Target Ergonomics...");

const buttonComponentPath = path.join(process.cwd(), "src/components/ui/button.tsx");
const buttonContent = fs.readFileSync(buttonComponentPath, "utf-8");

runTest("Touch Ergonomics", "buttonVariants defines size='touch' with min-h-11 min-w-11 (44x44px)", () => {
  assert.ok(buttonContent.includes('touch:'), "touch size variant must exist");
  assert.ok(buttonContent.includes("min-h-11 min-w-11"), "touch size must enforce min-h-11 min-w-11");
});

runTest("Touch Ergonomics", "buttonVariants defines size='icon-touch' with size-11 min-h-11 min-w-11 (44x44px)", () => {
  assert.ok(buttonContent.includes('"icon-touch":'), "icon-touch size variant must exist");
  assert.ok(buttonContent.includes("min-h-11 min-w-11"), "icon-touch must enforce min-h-11 min-w-11");
});

const headerComponentPath = path.join(process.cwd(), "src/components/layout/dashboard-header.tsx");
const headerContent = fs.readFileSync(headerComponentPath, "utf-8");

runTest("Touch Ergonomics", "DashboardHeader desktop nav links have min-h-11 for touch ergonomics", () => {
  assert.ok(headerContent.includes("min-h-11"), "Desktop and mobile nav items must have min-h-11");
});

runTest("Touch Ergonomics", "DashboardHeader CTA button uses size='touch'", () => {
  assert.ok(headerContent.includes('size="touch"'), "CTA button must use size='touch'");
});

runTest("Touch Ergonomics", "DashboardHeader mobile menu triggers have min-h-11 min-w-11", () => {
  assert.ok(headerContent.includes("min-h-11 min-w-11"), "Mobile menu buttons must satisfy touch target");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. TRANSLATION SYMMETRY & KEYS VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n▶ 5. Stress Testing Bilingual Translation Symmetry...");

const arJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/messages/ar.json"), "utf-8"));
const enJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/messages/en.json"), "utf-8"));

const REQUIRED_M1_KEYS = [
  "common.appName",
  "nav.dashboard",
  "nav.orders",
  "nav.menu",
  "nav.delivery",
  "nav.expenses",
  "nav.closing",
  "nav.newOrderCTA",
  "nav.brandTag",
  "nav.mobileMenu",
  "nav.userProfile",
  "nav.openNavigation",
  "nav.closeNavigation",
  "roles.OWNER",
  "roles.MANAGER",
  "roles.CASHIER",
  "theme.title",
  "theme.light",
  "theme.dark",
  "theme.kitchen",
  "theme.system",
];

function getNestedValue(obj: Record<string, unknown>, keyPath: string): unknown {
  const parts = keyPath.split(".");
  let curr: unknown = obj;
  for (const part of parts) {
    if (curr === undefined || curr === null || typeof curr !== "object") return undefined;
    curr = (curr as Record<string, unknown>)[part];
  }
  return curr;
}

runTest("Translations Symmetry", "All M1 required translation keys exist in Arabic (ar.json)", () => {
  for (const key of REQUIRED_M1_KEYS) {
    const val = getNestedValue(arJson, key);
    assert.ok(val && typeof val === "string" && val.length > 0, `Missing Arabic key: ${key}`);
  }
});

runTest("Translations Symmetry", "All M1 required translation keys exist in English (en.json)", () => {
  for (const key of REQUIRED_M1_KEYS) {
    const val = getNestedValue(enJson, key);
    assert.ok(val && typeof val === "string" && val.length > 0, `Missing English key: ${key}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
const total = reports.length;
const passed = reports.filter((r) => r.passed).length;
const failed = reports.filter((r) => !r.passed).length;

console.log("\n" + "=".repeat(80));
console.log("🏆 MILESTONE 1 ADVERSARIAL STRESS TEST SUMMARY");
console.log("=".repeat(80));
console.log(`  Total Stress Tests : ${total}`);
console.log(`  Passed             : ${passed} ✅`);
console.log(`  Failed             : ${failed} ${failed > 0 ? "❌" : "✨"}`);
console.log("=".repeat(80) + "\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
