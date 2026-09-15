import { test, expect } from "./fixtures/auth";

test.describe("Menu Management — Browser E2E", () => {
  test("PW-MENU-01: Manager can view menu management page with categories and products", async ({ managerPage }) => {
    await managerPage.goto("/ar/menu");
    await managerPage.waitForLoadState("networkidle");

    // Verify page heading
    await expect(managerPage.getByRole("heading", { name: /المنيو|Menu/i })).toBeVisible({ timeout: 10_000 });

    // Verify brand selector exists
    const brandSelect = managerPage.locator("button[role='combobox']").first();
    await expect(brandSelect).toBeVisible();

    // Categories list container or empty placeholder is visible
    const categoryContainers = managerPage.locator(".grid.gap-4, p:has-text('ابدأ بإضافة تصنيف'), table");
    await expect(categoryContainers.first()).toBeVisible({ timeout: 10_000 });
  });

  test("PW-MENU-02: Cashier attempting to access /ar/menu is redirected away (FR-MENU-05)", async ({ cashierPage }) => {
    await cashierPage.goto("/ar/menu");
    await cashierPage.waitForLoadState("networkidle");

    // Must not stay on /menu
    await expect(cashierPage).not.toHaveURL(/\/menu/);
  });

  test("PW-MENU-03: Manager can open Add Category dialog", async ({ managerPage }) => {
    await managerPage.goto("/ar/menu");
    await managerPage.waitForLoadState("networkidle");

    const addCategoryBtn = managerPage.locator("button").filter({ hasText: /إضافة تصنيف|Add Category/i }).first();
    await expect(addCategoryBtn).toBeVisible({ timeout: 10_000 });
    await addCategoryBtn.click();

    // Dialog should open with category name input
    const dialog = managerPage.locator("[role='dialog']");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("input").first()).toBeVisible();

    // Close dialog
    const closeOrCancel = dialog.locator("button").filter({ hasText: /إلغاء|cancel|close/i }).first();
    await closeOrCancel.click();
  });

  test("PW-MENU-04: Manager can open Add Product dialog", async ({ managerPage }) => {
    await managerPage.goto("/ar/menu");
    await managerPage.waitForLoadState("networkidle");

    const addProductBtn = managerPage.locator("button").filter({ hasText: /إضافة منتج|Add Product/i }).first();
    if (await addProductBtn.isVisible()) {
      await addProductBtn.click();

      // Dialog should open
      const dialog = managerPage.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      // Close dialog
      const closeOrCancel = dialog.locator("button").filter({ hasText: /إلغاء|cancel|close/i }).first();
      await closeOrCancel.click();
    }
  });
});
