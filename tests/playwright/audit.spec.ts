import { test, expect } from "./fixtures/auth";

test.describe("Audit Log & Activity Monitoring — Browser E2E", () => {
  test("PW-AUD-01: Owner can access audit log dashboard with KPI cards and activity table", async ({ ownerPage }) => {
    await ownerPage.goto("/ar/audit");
    await ownerPage.waitForLoadState("networkidle");

    // Header title
    await expect(ownerPage.getByRole("heading", { name: /سجل المراقبة|Audit/i })).toBeVisible({ timeout: 10_000 });

    // 4 KPI cards
    const kpiCards = ownerPage.locator(".grid .rounded-xl, .grid .border");
    expect(await kpiCards.count()).toBeGreaterThanOrEqual(4);

    // Audit table or container
    const tableOrEmpty = ownerPage.locator("table, [role='table']").or(ownerPage.getByText(/لا توجد سجلات|No logs/i)).first();
    await expect(tableOrEmpty).toBeVisible({ timeout: 10_000 });
  });

  test("PW-AUD-02: Manager and Cashier are blocked from audit log and redirected (FR-AUD-03)", async ({ managerPage }) => {
    await managerPage.goto("/ar/audit");
    await managerPage.waitForLoadState("networkidle");

    // Manager must be redirected away from /audit
    await expect(managerPage).not.toHaveURL(/\/audit/);
  });

  test("PW-AUD-03: Cashier is blocked from audit log and redirected (FR-AUD-03)", async ({ cashierPage }) => {
    await cashierPage.goto("/ar/audit");
    await cashierPage.waitForLoadState("networkidle");

    // Cashier must be redirected away from /audit
    await expect(cashierPage).not.toHaveURL(/\/audit/);
  });

  test("PW-AUD-04: Owner can interact with filter bar and open semantic diff modal", async ({ ownerPage }) => {
    await ownerPage.goto("/ar/audit");
    await ownerPage.waitForLoadState("networkidle");

    // Preset filter buttons exist
    const todayPreset = ownerPage.locator("button").filter({ hasText: /اليوم|Today|الكل|All/i }).first();
    if (await todayPreset.isVisible()) {
      await todayPreset.click();
      await ownerPage.waitForTimeout(400);
    }

    // If an audit entry exists, test opening the diff modal
    const diffButton = ownerPage.locator("button").filter({ hasText: /فحص الفارق|الفارق|Diff|View/i }).first();
    if (await diffButton.isVisible()) {
      await diffButton.click();
      const dialog = ownerPage.locator("[role='dialog']");
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      // Close dialog
      const closeBtn = dialog.locator("button").filter({ hasText: /إغلاق|Close/i }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });
});
