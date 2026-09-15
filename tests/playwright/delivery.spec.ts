import { test, expect } from "./fixtures/auth";

test.describe("Delivery & Fleet Management — Browser E2E", () => {
  test("PW-DEL-01: Manager can view delivery management page with zones and drivers tabs", async ({ managerPage }) => {
    await managerPage.goto("/ar/delivery");
    await managerPage.waitForLoadState("networkidle");

    // Heading or title
    await expect(managerPage.getByRole("heading", { name: /التوصيل|Delivery/i })).toBeVisible({ timeout: 10_000 });

    // Verify tabs (Zones & Drivers)
    const zonesTab = managerPage.locator("button").filter({ hasText: /مناطق التوصيل|Zones/i }).first();
    const driversTab = managerPage.locator("button").filter({ hasText: /مناديب التوصيل|Drivers/i }).first();
    await expect(zonesTab).toBeVisible({ timeout: 10_000 });
    await expect(driversTab).toBeVisible({ timeout: 10_000 });

    // Table should be visible
    await expect(managerPage.locator("table, [role='table']").first()).toBeVisible({ timeout: 10_000 });
  });

  test("PW-DEL-02: Cashier is blocked from delivery settings page (redirected to dashboard)", async ({ cashierPage }) => {
    await cashierPage.goto("/ar/delivery");
    await cashierPage.waitForLoadState("networkidle");

    // Must not stay on /delivery
    await expect(cashierPage).not.toHaveURL(/\/delivery/);
  });

  test("PW-DEL-03: Manager can open Add Zone dialog", async ({ managerPage }) => {
    await managerPage.goto("/ar/delivery");
    await managerPage.waitForLoadState("networkidle");

    const addZoneBtn = managerPage.locator("button").filter({ hasText: /إضافة منطقة|Add Zone/i }).first();
    await expect(addZoneBtn).toBeVisible({ timeout: 10_000 });
    await addZoneBtn.click();

    // Dialog should open
    const dialog = managerPage.locator("[role='dialog']");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("input").first()).toBeVisible();

    // Cancel / Close
    const closeBtn = dialog.locator("button").filter({ hasText: /إلغاء|cancel|close/i }).first();
    await closeBtn.click();
  });

  test("PW-DEL-04: Manager can switch to Drivers tab and open Add Driver dialog", async ({ managerPage }) => {
    await managerPage.goto("/ar/delivery");
    await managerPage.waitForLoadState("networkidle");

    // Switch to Drivers tab
    const driversTab = managerPage.locator("button").filter({ hasText: /مناديب التوصيل|Drivers/i }).first();
    await expect(driversTab).toBeVisible({ timeout: 10_000 });
    await driversTab.click();
    await managerPage.waitForTimeout(400);

    const addDriverBtn = managerPage.locator("button").filter({ hasText: /إضافة مندوب|Add Driver/i }).first();
    await expect(addDriverBtn).toBeVisible({ timeout: 10_000 });
    await addDriverBtn.click();

    // Dialog should open
    const dialog = managerPage.locator("[role='dialog']");
    await expect(dialog).toBeVisible();

    // Cancel / Close
    const closeBtn = dialog.locator("button").filter({ hasText: /إلغاء|cancel|close/i }).first();
    await closeBtn.click();
  });
});
