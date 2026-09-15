import { test, expect } from "./fixtures/auth";

test.describe("Shift & Daily Closing — Browser E2E", () => {
  test("PW-CLOSE-01: Cashier can access closing page and see shift status", async ({ cashierPage }) => {
    await cashierPage.goto("/ar/closing");
    await cashierPage.waitForLoadState("networkidle");

    // Header title
    await expect(cashierPage.getByRole("heading", { name: /إغلاق اليوم|الشيفتات|الورديات|Closing/i })).toBeVisible({ timeout: 10_000 });

    // Active shift tab is present
    const activeTab = cashierPage.locator("button").filter({ hasText: /الشيفت الحالي|الوردية الحالية|Active Shift/i }).first();
    await expect(activeTab).toBeVisible();

    // Either active shift summary OR open shift card is visible
    const shiftState = cashierPage.locator("button").filter({ hasText: /فتح شيفت جديد|فتح وردية جديدة|Open Shift/i })
      .or(cashierPage.locator("text=/ملخص|الخزينة|صافي النقدية|Net Cash|Shift Summary/i"));
    await expect(shiftState.first()).toBeVisible();
  });

  test("PW-CLOSE-02: Manager can switch to closing history tab and inspect records", async ({ managerPage }) => {
    await managerPage.goto("/ar/closing");
    await managerPage.waitForLoadState("networkidle");

    // Click history tab
    const historyTab = managerPage.locator("button").filter({ hasText: /سجل الإغلاقات|History/i }).first();
    await expect(historyTab).toBeVisible({ timeout: 10_000 });
    await historyTab.click();

    // History content container or table should be visible
    await managerPage.waitForTimeout(500);
    const historyContent = managerPage.locator("table, [role='table']").or(managerPage.getByText(/لا توجد إغلاقات|No closings/i)).first();
    await expect(historyContent).toBeVisible();
  });
});
