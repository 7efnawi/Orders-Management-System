import { test, expect } from "./fixtures/auth";
import { LoginPage } from "./pages/login.page";

test.describe("Authentication Flows — Browser E2E", () => {
  test("PW-AUTH-01: Owner logs in and reaches dashboard", async ({ ownerPage }) => {
    await expect(ownerPage).not.toHaveURL(/\/login/);
    await expect(ownerPage.locator("body")).toBeVisible();
  });

  test("PW-AUTH-02: Session persists across page refresh", async ({ ownerPage }) => {
    await ownerPage.reload();
    await ownerPage.waitForLoadState("networkidle");
    await expect(ownerPage).not.toHaveURL(/\/login/);
  });

  test("PW-AUTH-03: Invalid credentials display error alert", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto("ar");
    await loginPage.emailInput.fill("wrong-email@sushi.local");
    await loginPage.passwordInput.fill("WrongPassword123!");
    await loginPage.submitButton.click();

    await loginPage.expectError();
    await expect(page).toHaveURL(/\/login/);
  });

  test("PW-AUTH-04: Manager logs in successfully", async ({ managerPage }) => {
    await expect(managerPage).not.toHaveURL(/\/login/);
    await expect(managerPage.locator("body")).toBeVisible();
  });

  test("PW-AUTH-05: Cashier logs in successfully", async ({ cashierPage }) => {
    await expect(cashierPage).not.toHaveURL(/\/login/);
    await expect(cashierPage.locator("body")).toBeVisible();
  });
});
