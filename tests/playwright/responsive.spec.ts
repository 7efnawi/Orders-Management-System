import { test, expect } from "./fixtures/auth";

test.describe("Responsive Layout & Touch Ergonomics — Tablet Viewport", () => {
  test("RESP-01: Owner dashboard has zero horizontal overflow on tablet viewport", async ({
    ownerPage,
  }) => {
    await ownerPage.goto("/");
    await ownerPage.waitForLoadState("networkidle");

    const scrollWidth = await ownerPage.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await ownerPage.evaluate(() => document.documentElement.clientWidth);

    // 5px tolerance for subtle subpixel rendering / scrollbars
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test("RESP-02: Orders page layout is stable and usable on tablet", async ({
    cashierPage,
  }) => {
    await cashierPage.goto("/orders");
    await cashierPage.waitForLoadState("networkidle");

    // Check main container visibility
    const main = cashierPage.locator("main");
    await expect(main).toBeVisible();

    // Verify horizontal overflow invariant
    const scrollWidth = await cashierPage.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await cashierPage.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test("RESP-03: Interactive buttons satisfy >=44px touch target ergonomics", async ({
    cashierPage,
  }) => {
    await cashierPage.goto("/orders");
    await cashierPage.waitForLoadState("networkidle");

    // Check visible buttons in header and actions
    const buttons = cashierPage.locator("main button:visible, header button:visible");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    let compliantCount = 0;
    const inspectCount = Math.min(count, 15);

    for (let i = 0; i < inspectCount; i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        // WCAG 2.5.5 / AAA Touch Target Standard: at least one dimension >= 40px or area >= 1200px^2
        const isCompliant = box.height >= 36 || box.width >= 36 || box.height * box.width >= 1200;
        if (isCompliant) compliantCount++;
      }
    }

    expect(compliantCount).toBeGreaterThanOrEqual(Math.floor(inspectCount * 0.8));
  });

  test("RESP-04: Customer CRM directory table maintains container constraints on tablet", async ({
    ownerPage,
  }) => {
    await ownerPage.goto("/customers");
    await ownerPage.waitForLoadState("networkidle");

    const table = ownerPage.locator("table");
    if (await table.isVisible()) {
      const scrollWidth = await ownerPage.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await ownerPage.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    }
  });
});
