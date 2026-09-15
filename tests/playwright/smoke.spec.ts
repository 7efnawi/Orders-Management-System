import { test, expect } from "@playwright/test";

test("smoke: dev server is reachable and redirects to localized route", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(ar|en|login)/);
});
