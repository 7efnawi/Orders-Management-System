import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.test" });

export const TEST_ACCOUNTS = {
  owner: {
    email: process.env.TEST_OWNER_EMAIL || "test-owner@sushi.local",
    password: process.env.TEST_OWNER_PASSWORD || "TestOwner123!",
    role: "OWNER" as const,
  },
  manager: {
    email: process.env.TEST_MANAGER_EMAIL || "test-manager@sushi.local",
    password: process.env.TEST_MANAGER_PASSWORD || "TestManager123!",
    role: "MANAGER" as const,
  },
  cashier: {
    email: process.env.TEST_CASHIER_EMAIL || "test-cashier@sushi.local",
    password: process.env.TEST_CASHIER_PASSWORD || "TestCashier123!",
    role: "CASHIER" as const,
  },
} as const;
