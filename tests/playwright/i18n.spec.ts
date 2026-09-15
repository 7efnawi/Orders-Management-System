import { test, expect } from "./fixtures/auth";

test.describe("Bilingual & RTL/LTR Invariants — Browser E2E", () => {
  test("PW-I18N-01: Arabic page has dir=rtl and lang=ar on html root", async ({ ownerPage }) => {
    await ownerPage.goto("/ar/orders");
    await ownerPage.waitForLoadState("networkidle");

    const html = ownerPage.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(html).toHaveAttribute("lang", "ar");
  });

  test("PW-I18N-02: English page has dir=ltr and lang=en on html root", async ({ ownerPage }) => {
    await ownerPage.goto("/en/orders");
    await ownerPage.waitForLoadState("networkidle");

    const html = ownerPage.locator("html");
    await expect(html).toHaveAttribute("dir", "ltr");
    await expect(html).toHaveAttribute("lang", "en");
  });

  test("PW-I18N-03: Language switcher toggles between Arabic and English seamlessly", async ({ ownerPage }) => {
    await ownerPage.goto("/ar/orders");
    await ownerPage.waitForLoadState("networkidle");

    // Language switcher link
    const switcher = ownerPage.locator("a").filter({ hasText: /English|العربية/i }).first();
    await expect(switcher).toBeVisible({ timeout: 10_000 });
    await switcher.click();

    // After clicking, page should transition to /en/orders
    await ownerPage.waitForURL(/\/en\/orders/, { timeout: 10_000 });
    const html = ownerPage.locator("html");
    await expect(html).toHaveAttribute("dir", "ltr");

    // Click back to Arabic
    const switcherBack = ownerPage.locator("a").filter({ hasText: /العربية/i }).first();
    await expect(switcherBack).toBeVisible({ timeout: 10_000 });
    await switcherBack.click();

    await ownerPage.waitForURL(/\/(ar\/)?orders/, { timeout: 10_000 });
    await expect(ownerPage.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(ownerPage.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("PW-I18N-04: Zero MISSING_MESSAGE console errors across core dashboards", async ({ ownerPage }) => {
    const missingMessages: string[] = [];

    ownerPage.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("MISSING_MESSAGE")) {
        missingMessages.push(text);
      }
    });

    const testRoutes = [
      "/ar/orders",
      "/ar/expenses",
      "/ar/closing",
      "/ar/customers",
      "/ar/reports",
      "/en/orders",
      "/en/expenses",
      "/en/closing",
      "/en/customers",
      "/en/reports",
    ];

    for (const route of testRoutes) {
      await ownerPage.goto(route);
      await ownerPage.waitForLoadState("networkidle");
    }

    expect(missingMessages).toHaveLength(0);
  });
});
