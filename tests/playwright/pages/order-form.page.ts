import { type Page, type Locator, expect } from "@playwright/test";

export class OrderFormPage {
  readonly page: Page;
  readonly phoneInput: Locator;
  readonly customerNameInput: Locator;
  readonly customerAddressInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.phoneInput = page.locator("[data-testid='customer-phone-input']");
    this.customerNameInput = page.locator("[data-testid='customer-name-input']");
    this.customerAddressInput = page.locator("[data-testid='customer-address-input']");
    this.submitButton = page.locator("[data-testid='submit-order-button']").first();
  }

  async goto(locale = "ar") {
    await this.page.goto(`/${locale}/orders/new`);
    await this.page.waitForLoadState("networkidle");
  }

  async selectBrand(brandName: string) {
    const brandBtn = this.page.locator(`button:has-text("${brandName}")`).first();
    await expect(brandBtn).toBeVisible({ timeout: 10_000 });
    await brandBtn.click();
    await this.page.waitForTimeout(500);
  }

  async selectPlatform(platformName: string) {
    const selectTrigger = this.page.locator("button[role='combobox']").first();
    await selectTrigger.click();
    const option = this.page.locator(`[role='option']:has-text("${platformName}")`).first();
    await expect(option).toBeVisible({ timeout: 5_000 });
    await option.click();
  }

  async fillCustomer(phone: string, name = "عميل تجربة المتصفح", address = "شارع 9 المعادي") {
    await this.phoneInput.fill(phone);
    await this.page.waitForTimeout(500);
    if (await this.customerNameInput.isVisible()) {
      await this.customerNameInput.fill(name);
    }
    if (await this.customerAddressInput.isVisible()) {
      await this.customerAddressInput.fill(address);
    }
  }

  async addFirstProduct(preferredName?: string) {
    let productBtn;
    if (preferredName) {
      productBtn = this.page.locator(`.grid button.group:has-text("${preferredName}")`).first();
    } else {
      productBtn = this.page.locator(".grid button.group").filter({ hasNotText: /P7|Phase|Verification/i }).first();
      if ((await productBtn.count()) === 0) {
        productBtn = this.page.locator(".grid button.group").first();
      }
    }
    await expect(productBtn).toBeVisible({ timeout: 10_000 });
    await productBtn.click();
  }

  async submit() {
    await expect(this.submitButton).toBeEnabled({ timeout: 10_000 });
    await this.submitButton.click();
    await this.page.waitForSelector("[role='dialog']", { timeout: 15_000 });
  }

  async expectSuccess() {
    const dialog = this.page.locator("[role='dialog']");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/تم إنشاء الطلب|نجاح|success|ORD-/i);
  }
}
