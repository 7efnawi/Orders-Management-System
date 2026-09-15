import { test, expect } from "./fixtures/auth";

test.describe("Dashboard — Role-Based Browser E2E", () => {
  test("PW-DASH-01: Cashier sees dedicated cashier operational dashboard", async ({ cashierPage }) => {
    await cashierPage.goto("/ar");
    await cashierPage.waitForLoadState("networkidle");

    // Welcome heading and role in main
    const mainHeading = cashierPage.locator("main h1").first();
    await expect(mainHeading).toBeVisible({ timeout: 10_000 });
    await expect(cashierPage.locator("main").getByText(/كاشير|Cashier/i).first()).toBeVisible();

    // Quick action buttons for cashier (New order, Live orders)
    const newOrderBtn = cashierPage.locator("a[href*='/orders/new']").first();
    await expect(newOrderBtn).toBeVisible();

    const ordersBtn = cashierPage.locator("a[href='/orders'], a[href*='/orders']").first();
    await expect(ordersBtn).toBeVisible();

    // Summary cards exist
    const cards = cashierPage.locator(".grid .rounded-xl, .grid .border");
    expect(await cards.count()).toBeGreaterThanOrEqual(2);
  });

  test("PW-DASH-02: Manager sees management overview, brand breakdown, and order feed", async ({ managerPage }) => {
    await managerPage.goto("/ar");
    await managerPage.waitForLoadState("networkidle");

    // Manager role badge in main
    const mainHeading = managerPage.locator("main h1").first();
    await expect(mainHeading).toBeVisible({ timeout: 10_000 });
    await expect(managerPage.locator("main").getByText(/مدير|Manager/i).first()).toBeVisible();

    // Management sections: brands and platforms overview
    const brandOrPlatformSection = managerPage.locator("main").getByText(/البراندات|المنصات|الطلبات|Brands|Platforms|Orders/i).first();
    await expect(brandOrPlatformSection).toBeVisible();

    // KPI cards exist
    const kpiCards = managerPage.locator(".grid .rounded-xl, .grid .border");
    expect(await kpiCards.count()).toBeGreaterThanOrEqual(3);
  });

  test("PW-DASH-03: Owner sees executive overview with full operational metrics", async ({ ownerPage }) => {
    await ownerPage.goto("/ar");
    await ownerPage.waitForLoadState("networkidle");

    // Owner role badge in main
    const mainHeading = ownerPage.locator("main h1").first();
    await expect(mainHeading).toBeVisible({ timeout: 10_000 });
    await expect(ownerPage.locator("main").getByText(/مالك|Owner/i).first()).toBeVisible();

    // Executive overview cards
    const cards = ownerPage.locator(".grid .rounded-xl, .grid .border");
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
  });
});
