import { type Page, type Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator("#email");
    this.passwordInput = page.locator("#password");
    this.submitButton = page.locator("button[type='submit']");
    this.errorMessage = page.locator("[role='alert']");
  }

  async goto(locale = "ar") {
    await this.page.goto(`/${locale}/login`);
    await this.page.waitForLoadState("networkidle");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    // Wait until navigated away from login
    await this.page.waitForURL((url) => !url.pathname.endsWith("/login"), {
      timeout: 20_000,
    });
    await this.page.waitForLoadState("networkidle");
  }

  async expectError() {
    await expect(this.errorMessage).toBeVisible({ timeout: 5_000 });
  }
}
