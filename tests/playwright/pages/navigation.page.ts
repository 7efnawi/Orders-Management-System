import { type Page, expect } from "@playwright/test";

export class NavigationPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(path: string, locale = "ar") {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    await this.page.goto(`/${locale}/${cleanPath}`);
    await this.page.waitForLoadState("networkidle");
  }

  async expectOnPage(pathPattern: RegExp) {
    await expect(this.page).toHaveURL(pathPattern);
  }

  async logout() {
    // Open user menu if on desktop or mobile
    const userMenuTrigger = this.page.locator("button[aria-haspopup='menu'], button:has-text('Test')");
    if (await userMenuTrigger.isVisible()) {
      await userMenuTrigger.click();
    }

    const logoutBtn = this.page.getByRole("button", { name: /خروج|sign out|logout/i });
    if (await logoutBtn.first().isVisible()) {
      await logoutBtn.first().click();
    } else {
      // Direct call or find in mobile menu
      const mobileMenuBtn = this.page.locator("button[aria-label='Toggle Menu'], button:has(svg.lucide-menu)");
      if (await mobileMenuBtn.isVisible()) {
        await mobileMenuBtn.click();
      }
      await this.page.getByRole("button", { name: /خروج|sign out|logout/i }).first().click();
    }

    await this.page.waitForURL(/\/login/, { timeout: 15_000 });
  }

  async switchLanguage() {
    const switcher = this.page.locator("a[aria-label='Language'], a[aria-label='اللغة'], a:has-text('English'), a:has-text('العربية')").first();
    if (await switcher.isVisible()) {
      await switcher.click();
      await this.page.waitForLoadState("networkidle");
    }
  }
}
