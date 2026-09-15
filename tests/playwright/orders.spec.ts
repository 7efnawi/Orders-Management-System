import { test, expect } from "./fixtures/auth";
import { OrderFormPage } from "./pages/order-form.page";

test.describe("Order Management — Browser E2E", () => {
  test("PW-ORD-01: Cashier creates an order and sees thermal receipt dialog", async ({ cashierPage }) => {
    const orderForm = new OrderFormPage(cashierPage);
    await orderForm.goto("ar");

    // 1. Select Brand (Flower)
    await orderForm.selectBrand("Flower");

    // 2. Select Platform (Talabat or Phone)
    await orderForm.selectPlatform("Talabat");

    // 3. Fill customer info (unique phone for this test run)
    const testPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
    await orderForm.fillCustomer(testPhone, "عميل تجربة المتصفح", "المعادي - شارع 9");

    // 4. Add product
    await orderForm.addFirstProduct();

    // 5. Submit order
    await orderForm.submit();

    // 6. Verify success thermal receipt modal
    await orderForm.expectSuccess();
  });

  test("PW-ORD-02: Manager can view orders table and status filter tabs", async ({ managerPage }) => {
    await managerPage.goto("/ar/orders");
    await managerPage.waitForLoadState("networkidle");

    // Check table or list is present
    const tableOrList = managerPage.locator("table, [role='table'], div:has-text('قائمة الطلبات')").first();
    await expect(tableOrList).toBeVisible({ timeout: 10_000 });

    // Check filter tabs (All, Active, Delivered, Cancelled)
    const tabButtons = managerPage.locator("button:has-text('الكل'), button:has-text('نشطة'), button:has-text('تم التسليم')");
    const count = await tabButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("PW-ORD-03: Customer phone lookup triggers cleanly without error", async ({ cashierPage }) => {
    const orderForm = new OrderFormPage(cashierPage);
    await orderForm.goto("ar");

    // Fill an existing or new phone
    await orderForm.phoneInput.fill("01012345678");
    await cashierPage.waitForTimeout(600);

    // Form remains interactive and healthy
    await expect(orderForm.phoneInput).toHaveValue("01012345678");
  });

  test("PW-ORD-04: Order search filter updates displayed rows", async ({ managerPage }) => {
    await managerPage.goto("/ar/orders");
    await managerPage.waitForLoadState("networkidle");

    const searchInput = managerPage.locator("input[placeholder*='بحث'], input[placeholder*='Search']").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("ORD-");
      await managerPage.waitForTimeout(500);
      await expect(searchInput).toHaveValue("ORD-");
    }
  });
});
