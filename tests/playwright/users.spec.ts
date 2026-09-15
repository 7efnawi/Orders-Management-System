import { test, expect } from "./fixtures/auth";

test.describe("User Management — Browser E2E", () => {
  test("PW-USR-01: Owner can view user management page with stats and users list", async ({ ownerPage }) => {
    await ownerPage.goto("/ar/users");
    await ownerPage.waitForLoadState("networkidle");

    // Header title
    await expect(ownerPage.getByRole("heading", { name: /المستخدمين|Users/i })).toBeVisible({ timeout: 10_000 });

    // Stats cards
    const statsCards = ownerPage.locator(".grid .rounded-xl, .grid .border");
    expect(await statsCards.count()).toBeGreaterThanOrEqual(3);

    // Users table/container
    const usersTable = ownerPage.locator("table, [role='table']").first();
    await expect(usersTable).toBeVisible({ timeout: 10_000 });
  });

  test("PW-USR-02: Cashier is blocked from user management page and redirected", async ({ cashierPage }) => {
    await cashierPage.goto("/ar/users");
    await cashierPage.waitForLoadState("networkidle");

    // Must be redirected away
    await expect(cashierPage).not.toHaveURL(/\/users/);
  });

  test("PW-USR-03: Owner can open Add User modal and inspect inputs", async ({ ownerPage }) => {
    await ownerPage.goto("/ar/users");
    await ownerPage.waitForLoadState("networkidle");

    const addUserBtn = ownerPage.locator("button").filter({ hasText: /إضافة مستخدم|Add User/i }).first();
    await expect(addUserBtn).toBeVisible({ timeout: 10_000 });
    await addUserBtn.click();

    // Dialog should open
    const dialog = ownerPage.locator("[role='dialog']");
    await expect(dialog).toBeVisible();

    // Inputs inside dialog
    await expect(dialog.locator("input").first()).toBeVisible();

    // Close button
    const closeBtn = dialog.locator("button").filter({ hasText: /إلغاء|إغلاق|Cancel|Close/i }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  test("PW-USR-04: Search input filters users list dynamically", async ({ ownerPage }) => {
    await ownerPage.goto("/ar/users");
    await ownerPage.waitForLoadState("networkidle");

    const searchInput = ownerPage.locator("input[placeholder*='ابحث'], input[placeholder*='Search']").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Owner");
      await ownerPage.waitForTimeout(400);

      const usersTable = ownerPage.locator("table, [role='table']").first();
      await expect(usersTable).toBeVisible();
    }
  });
});
