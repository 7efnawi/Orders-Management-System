import { test, expect } from "./fixtures/auth";

test.describe("Reports & Operational Analytics — Browser E2E", () => {
  test("PW-RPT-01: Manager can view reports page with tabs and filter controls", async ({ managerPage }) => {
    await managerPage.goto("/ar/reports");
    await managerPage.waitForLoadState("networkidle");

    // Header title
    await expect(managerPage.getByRole("heading", { name: /التقارير|Reports/i })).toBeVisible({ timeout: 10_000 });

    // Tabs navigation exists and has 7 operational tabs
    const tabButtons = managerPage.locator("div.border-b button");
    expect(await tabButtons.count()).toBeGreaterThanOrEqual(5);

    // Overview tab is visible by default
    await expect(managerPage.getByText(/نظرة عامة|Overview/i).first()).toBeVisible();

    // Filter bar controls
    await expect(managerPage.getByText(/البراند|Brand/i).first()).toBeVisible();
    await expect(managerPage.getByText(/المنصة|Platform/i).first()).toBeVisible();
  });

  test("PW-RPT-02: Cashier is blocked from reports page and redirected", async ({ cashierPage }) => {
    await cashierPage.goto("/ar/reports");
    await cashierPage.waitForLoadState("networkidle");

    // Must not stay on /reports and be redirected away to orders
    await expect(cashierPage).not.toHaveURL(/\/reports/);
    await expect(cashierPage).toHaveURL(/\/orders/);
  });

  test("PW-RPT-03: Switching to Products and Payment tabs displays detailed breakdown", async ({ managerPage }) => {
    await managerPage.goto("/ar/reports");
    await managerPage.waitForLoadState("networkidle");

    // Switch to Products tab
    const productsTab = managerPage.locator("button").filter({ hasText: /المنتجات|Products/i }).first();
    await expect(productsTab).toBeVisible({ timeout: 10_000 });
    await productsTab.click();
    await managerPage.waitForTimeout(500);

    // Verify products content or leaderboard
    const productsContent = managerPage.locator("text=/الأصناف|أعلى|مبيعاً|الكمية|Products/i").first();
    await expect(productsContent).toBeVisible();

    // Switch to Payment tab
    const paymentTab = managerPage.locator("button").filter({ hasText: /المدفوعات|Payment/i }).first();
    await expect(paymentTab).toBeVisible();
    await paymentTab.click();
    await managerPage.waitForTimeout(500);

    // Verify payment methods content (Cash, Visa, Online)
    const paymentContent = managerPage.locator("text=/كاش|فيزا|أونلاين|Cash|Visa|Online/i").first();
    await expect(paymentContent).toBeVisible();
  });

  test("PW-RPT-04: Excel export triggers native .xlsx file download", async ({ managerPage }) => {
    await managerPage.goto("/ar/reports");
    await managerPage.waitForLoadState("networkidle");

    const exportBtn = managerPage.locator("button").filter({ hasText: /إكسل|\.xlsx|Excel/i }).first();
    await expect(exportBtn).toBeVisible({ timeout: 10_000 });

    const downloadPromise = managerPage.waitForEvent("download", { timeout: 30_000 });
    await exportBtn.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);
  });
});
