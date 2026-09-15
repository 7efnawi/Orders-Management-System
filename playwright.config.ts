import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  testDir: "./tests/playwright",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 60_000,
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "ar-EG",
    timezoneId: "Africa/Cairo",
  },
  projects: [
    {
      name: "chromium-ar",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-en",
      use: { ...devices["Desktop Chrome"], locale: "en-US" },
    },
    {
      name: "tablet",
      use: { ...devices["iPad Pro 11"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
