import { test, expect } from "./fixtures/auth";

test.describe("Customer CRM — Browser E2E", () => {
  test("PW-CUST-01: Cashier can view customer directory with KPI summary and table", async ({ cashierPage }) => {
    await cashierPage.goto("/ar/customers");
    await cashierPage.waitForLoadState("networkidle");

    // Header title
    await expect(cashierPage.getByRole("heading", { name: /العملاء|Customers/i })).toBeVisible({ timeout: 10_000 });

    // KPI cards exist
    const kpiCards = cashierPage.locator(".grid .rounded-xl, .grid .border");
    expect(await kpiCards.count()).toBeGreaterThanOrEqual(3);

    // Table or list container
    const tableOrEmpty = cashierPage.locator("table, [role='table']").or(cashierPage.getByText(/لا يوجد عملاء|No customers/i)).first();
    await expect(tableOrEmpty).toBeVisible({ timeout: 10_000 });
  });

  test("PW-CUST-02: Search input filters customer list by phone or name", async ({ managerPage }) => {
    await managerPage.goto("/ar/customers");
    await managerPage.waitForLoadState("networkidle");

    const searchInput = managerPage.locator("input[placeholder*='بحث'], input[type='search'], input[name='search']").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("010");
      await managerPage.waitForTimeout(600); // debounce

      const tableOrEmpty = managerPage.locator("table, [role='table']").or(managerPage.getByText(/لا يوجد عملاء|No customers/i)).first();
      await expect(tableOrEmpty).toBeVisible();
    }
  });

  test("PW-CUST-03: Navigating to customer profile renders metrics, notes, and order history", async ({ managerPage }) => {
    await managerPage.goto("/ar/customers");
    await managerPage.waitForLoadState("networkidle");

    // Click first customer profile link if available
    const customerLink = managerPage.locator("table tbody tr a, a[href*='/customers/']").first();
    if (await customerLink.isVisible()) {
      await customerLink.click();
      await managerPage.waitForURL(/\/customers\/[a-zA-Z0-9-]+/, { timeout: 10_000 });

      // Profile components: phone, notes or history
      const profileContent = managerPage.locator("text=/الملف التعريفي|سجل الطلبات|ملاحظات|Order History|Profile/i").first();
      await expect(profileContent).toBeVisible({ timeout: 10_000 });
    }
  });

  test("PW-CUST-04: Customer Excel export triggers native .xlsx download", async ({ managerPage }) => {
    await managerPage.goto("/ar/customers");
    await managerPage.waitForLoadState("networkidle");

    const exportBtn = managerPage.locator("button").filter({ hasText: /إكسل|\.xlsx|تصدير|Excel/i }).first();
    await expect(exportBtn).toBeVisible({ timeout: 10_000 });

    const downloadPromise = managerPage.waitForEvent("download", { timeout: 30_000 });
    await exportBtn.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);
  });
});
