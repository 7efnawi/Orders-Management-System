import { test as base, type Page } from "@playwright/test";
import { TEST_ACCOUNTS } from "./test-accounts";
import { LoginPage } from "../pages/login.page";

type AuthFixtures = {
  ownerPage: Page;
  managerPage: Page;
  cashierPage: Page;
};

async function loginAs(page: Page, account: { email: string; password: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.goto("ar");
  await loginPage.login(account.email, account.password);
}

export const test = base.extend<AuthFixtures>({
  ownerPage: async ({ page }, use) => {
    await loginAs(page, TEST_ACCOUNTS.owner);
    await use(page);
  },
  managerPage: async ({ page }, use) => {
    await loginAs(page, TEST_ACCOUNTS.manager);
    await use(page);
  },
  cashierPage: async ({ page }, use) => {
    await loginAs(page, TEST_ACCOUNTS.cashier);
    await use(page);
  },
});

export { expect } from "@playwright/test";
