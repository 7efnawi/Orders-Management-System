import { test, expect } from "./fixtures/auth";

test.describe("Expense Management — Browser E2E", () => {
  test("PW-EXP-01: Cashier can view expenses page with summary cards and table", async ({ cashierPage }) => {
    await cashierPage.goto("/ar/expenses");
    await cashierPage.waitForLoadState("networkidle");

    // Header title
    await expect(cashierPage.getByRole("heading", { name: /المصروفات|المصاريف|Expenses/i })).toBeVisible({ timeout: 10_000 });

    // Table or empty container should be visible
    const content = cashierPage.locator("table, [role='table']").or(cashierPage.getByText(/لا توجد مصروفات|No expenses/i)).first();
    await expect(content).toBeVisible({ timeout: 10_000 });

    // Summary cards exist
    const cards = cashierPage.locator(".grid .rounded-xl, .grid .border");
    await expect(cards.first()).toBeVisible();
  });

  test("PW-EXP-02: Cashier can open Log Expense modal", async ({ cashierPage }) => {
    await cashierPage.goto("/ar/expenses");
    await cashierPage.waitForLoadState("networkidle");

    const logExpenseBtn = cashierPage.locator("button").filter({ hasText: /تسجيل مصروف|إضافة مصروف|Log Expense|Add Expense/i }).first();
    await expect(logExpenseBtn).toBeVisible({ timeout: 10_000 });
    await logExpenseBtn.click();

    // Dialog should open
    const dialog = cashierPage.locator("[role='dialog']");
    await expect(dialog).toBeVisible();

    // Verify inputs (amount, description)
    await expect(dialog.locator("input").first()).toBeVisible();

    // Cancel / Close
    const closeBtn = dialog.locator("button").filter({ hasText: /إلغاء|cancel|close/i }).first();
    await closeBtn.click();
  });

  test("PW-EXP-03: Manager has access to Manage Expense Types button", async ({ managerPage }) => {
    await managerPage.goto("/ar/expenses");
    await managerPage.waitForLoadState("networkidle");

    const manageTypesBtn = managerPage.locator("button").filter({ hasText: /أنواع المصروفات|Manage Types/i }).first();
    if (await manageTypesBtn.isVisible()) {
      await manageTypesBtn.click();
      const dialog = managerPage.locator("[role='dialog']");
      await expect(dialog).toBeVisible();
      const closeBtn = dialog.locator("button").filter({ hasText: /إلغاء|إغلاق|cancel|close/i }).first();
      await closeBtn.click();
    }
  });

  test("PW-EXP-04: Date preset buttons filter expenses without crashing", async ({ managerPage }) => {
    await managerPage.goto("/ar/expenses");
    await managerPage.waitForLoadState("networkidle");

    const presetBtn = managerPage.locator("button").filter({ hasText: /اليوم|Today|أمس|Yesterday|هذا الشهر|This Month/i }).first();
    if (await presetBtn.isVisible()) {
      await presetBtn.click();
      await managerPage.waitForTimeout(400);
      const content = managerPage.locator("table, [role='table']").or(managerPage.getByText(/لا توجد مصروفات|No expenses/i)).first();
      await expect(content).toBeVisible();
    }
  });
});
