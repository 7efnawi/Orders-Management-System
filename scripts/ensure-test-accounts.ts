import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import { prisma } from "../src/lib/prisma";
import { createAdminClient } from "../src/lib/supabase/admin";
import { Role } from "@prisma/client";

export const TEST_CREDENTIALS = {
  owner: {
    email: process.env.TEST_OWNER_EMAIL || "test-owner@sushi.local",
    password: process.env.TEST_OWNER_PASSWORD || "TestOwner123!",
    name: "Test Owner",
    role: "OWNER" as Role,
  },
  manager: {
    email: process.env.TEST_MANAGER_EMAIL || "test-manager@sushi.local",
    password: process.env.TEST_MANAGER_PASSWORD || "TestManager123!",
    name: "Test Manager",
    role: "MANAGER" as Role,
  },
  cashier: {
    email: process.env.TEST_CASHIER_EMAIL || "test-cashier@sushi.local",
    password: process.env.TEST_CASHIER_PASSWORD || "TestCashier123!",
    name: "Test Cashier",
    role: "CASHIER" as Role,
  },
};

export async function ensureTestAccounts() {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client could not be initialized. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const { data: userList, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) {
    throw new Error(`Failed to list Supabase users: ${listErr.message}`);
  }

  const accounts = [TEST_CREDENTIALS.owner, TEST_CREDENTIALS.manager, TEST_CREDENTIALS.cashier];

  for (const acc of accounts) {
    const existingAuth = userList.users.find(
      (u) => u.email?.toLowerCase() === acc.email.toLowerCase()
    );

    if (existingAuth) {
      const { error: updateErr } = await admin.auth.admin.updateUserById(
        existingAuth.id,
        {
          password: acc.password,
          email_confirm: true,
          user_metadata: { name: acc.name },
        }
      );
      if (updateErr) {
        console.warn(`[ensureTestAccounts] Warning updating password for ${acc.email}: ${updateErr.message}`);
      } else {
        console.log(`[ensureTestAccounts] Updated Supabase auth user: ${acc.email}`);
      }
    } else {
      const { error: createErr } = await admin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { name: acc.name },
      });
      if (createErr) {
        throw new Error(`Failed to create Supabase auth user ${acc.email}: ${createErr.message}`);
      }
      console.log(`[ensureTestAccounts] Created Supabase auth user: ${acc.email}`);
    }

    // Upsert into local Prisma User table
    await prisma.user.upsert({
      where: { email: acc.email.toLowerCase() },
      create: {
        email: acc.email.toLowerCase(),
        name: acc.name,
        role: acc.role,
        isActive: true,
      },
      update: {
        name: acc.name,
        role: acc.role,
        isActive: true,
      },
    });
    console.log(`[ensureTestAccounts] Upserted local Prisma user: ${acc.email} (${acc.role})`);
  }

  console.log("✅ All test accounts successfully provisioned and synchronized.");
}

if (process.argv[1]?.includes("ensure-test-accounts")) {
  ensureTestAccounts()
    .catch((err) => {
      console.error("❌ Failed to ensure test accounts:", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
