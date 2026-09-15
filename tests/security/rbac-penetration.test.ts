import dotenv from "dotenv";
dotenv.config();

import assert from "node:assert";
import { NextRequest } from "next/server";
import { TestRunner } from "../helpers/test-runner";
import { __setMockSessionUser } from "../../src/lib/auth";

const runner = new TestRunner("API Security: RBAC Penetration Testing");

const ALL_ROLES = ["OWNER", "MANAGER", "CASHIER"] as const;
type AppRole = (typeof ALL_ROLES)[number];

interface RbacEndpointConfig {
  name: string;
  endpoint: string;
  importPath: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  allowedRoles: AppRole[];
  params?: Record<string, string>;
  sampleBody?: Record<string, unknown>;
  query?: Record<string, string>;
}

const RBAC_ENDPOINTS: RbacEndpointConfig[] = [
  // ─── Menu Categories ────────────────────────────────────────────────────────
  {
    name: "Menu Categories List (GET)",
    endpoint: "/api/menu/categories",
    importPath: "../../src/app/api/menu/categories/route",
    method: "GET",
    allowedRoles: ["OWNER", "MANAGER", "CASHIER"],
    query: { brandId: "00000000-0000-0000-0000-000000000000" },
  },
  {
    name: "Menu Category Creation (POST)",
    endpoint: "/api/menu/categories",
    importPath: "../../src/app/api/menu/categories/route",
    method: "POST",
    allowedRoles: ["OWNER", "MANAGER"],
    sampleBody: { brandId: "00000000-0000-0000-0000-000000000000", name: "Test Cat" },
  },

  // ─── Menu Products ──────────────────────────────────────────────────────────
  {
    name: "Menu Products Creation (POST)",
    endpoint: "/api/menu/products",
    importPath: "../../src/app/api/menu/products/route",
    method: "POST",
    allowedRoles: ["OWNER", "MANAGER"],
    sampleBody: {
      categoryId: "00000000-0000-0000-0000-000000000000",
      name: "Test Roll",
      price: 150,
      description: "Test description",
    },
  },

  // ─── Reports & Analytics ───────────────────────────────────────────────────
  {
    name: "Operational Reports (GET)",
    endpoint: "/api/reports",
    importPath: "../../src/app/api/reports/route",
    method: "GET",
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    name: "Peak Hours Analytics (GET)",
    endpoint: "/api/reports/peak-hours",
    importPath: "../../src/app/api/reports/peak-hours/route",
    method: "GET",
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    name: "Employee Performance Analytics (GET)",
    endpoint: "/api/reports/employees",
    importPath: "../../src/app/api/reports/employees/route",
    method: "GET",
    allowedRoles: ["OWNER", "MANAGER"],
  },

  // ─── Audit Log (Owner Only — FR-AUD-03) ────────────────────────────────────
  {
    name: "Audit Log Inspection (GET)",
    endpoint: "/api/audit",
    importPath: "../../src/app/api/audit/route",
    method: "GET",
    allowedRoles: ["OWNER"],
  },

  // ─── User Management (Owner & Manager — FR-USR-04) ─────────────────────────
  {
    name: "User Management Directory (GET)",
    endpoint: "/api/users",
    importPath: "../../src/app/api/users/route",
    method: "GET",
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    name: "User Creation (POST)",
    endpoint: "/api/users",
    importPath: "../../src/app/api/users/route",
    method: "POST",
    allowedRoles: ["OWNER", "MANAGER"],
    sampleBody: {
      name: "Penetration User",
      email: "pen-test@sushi.local",
      role: "CASHIER",
    },
  },

  // ─── Delivery & Fleet ──────────────────────────────────────────────────────
  {
    name: "Delivery Zone Creation (POST)",
    endpoint: "/api/delivery/zones",
    importPath: "../../src/app/api/delivery/zones/route",
    method: "POST",
    allowedRoles: ["OWNER", "MANAGER"],
    sampleBody: { name: "Penetration Zone", fee: 25 },
  },
  {
    name: "Delivery Driver Creation (POST)",
    endpoint: "/api/delivery/drivers",
    importPath: "../../src/app/api/delivery/drivers/route",
    method: "POST",
    allowedRoles: ["OWNER", "MANAGER"],
    sampleBody: { name: "Penetration Driver", type: "OWN" },
  },

  // ─── Expenses ──────────────────────────────────────────────────────────────
  {
    name: "Expense Type Creation (POST)",
    endpoint: "/api/expenses/types",
    importPath: "../../src/app/api/expenses/types/route",
    method: "POST",
    allowedRoles: ["OWNER", "MANAGER"],
    sampleBody: { name: "Penetration Expense Type" },
  },

  // ─── Discount Decision (Financial Invariant — FR-ORD-04) ───────────────────
  {
    name: "Order Discount Decision (POST)",
    endpoint: "/api/orders/00000000-0000-0000-0000-000000000000/discount/decide",
    importPath: "../../src/app/api/orders/[id]/discount/decide/route",
    method: "POST",
    allowedRoles: ["OWNER", "MANAGER"],
    params: { id: "00000000-0000-0000-0000-000000000000" },
    sampleBody: { decision: "APPROVED" },
  },

  // ─── Shift Operations ──────────────────────────────────────────────────────
  {
    name: "Shift Reopening (POST)",
    endpoint: "/api/shifts/00000000-0000-0000-0000-000000000000/reopen",
    importPath: "../../src/app/api/shifts/[id]/reopen/route",
    method: "POST",
    allowedRoles: ["OWNER", "MANAGER"],
    params: { id: "00000000-0000-0000-0000-000000000000" },
    sampleBody: { reason: "Security Audit" },
  },

  // ─── Customer CRM (All Authenticated POS Roles) ────────────────────────────
  {
    name: "Customer CRM Directory (GET)",
    endpoint: "/api/customers",
    importPath: "../../src/app/api/customers/route",
    method: "GET",
    allowedRoles: ["OWNER", "MANAGER", "CASHIER"],
  },

  // ─── Order Management (All Authenticated POS Roles) ────────────────────────
  {
    name: "Orders List (GET)",
    endpoint: "/api/orders",
    importPath: "../../src/app/api/orders/route",
    method: "GET",
    allowedRoles: ["OWNER", "MANAGER", "CASHIER"],
  },
];

async function runPenetrationSuite() {
  runner.setContext("RBAC Matrix", 1);

  for (const cfg of RBAC_ENDPOINTS) {
    const routeModule = await import(cfg.importPath);
    const handler = routeModule[cfg.method];
    assert.ok(handler, `Handler ${cfg.method} must exist in ${cfg.importPath}`);

    // Helper to build request
    const buildRequest = () => {
      const url = new URL(`http://localhost:3000${cfg.endpoint}`);
      if (cfg.query) {
        for (const [k, v] of Object.entries(cfg.query)) {
          url.searchParams.set(k, v);
        }
      }
      return new NextRequest(url.toString(), {
        method: cfg.method,
        headers: { "Content-Type": "application/json" },
        ...(cfg.sampleBody ? { body: JSON.stringify(cfg.sampleBody) } : {}),
      });
    };

    const callHandler = (req: NextRequest) => {
      if (cfg.params) {
        return handler(req, { params: Promise.resolve(cfg.params) });
      }
      return handler(req);
    };

    // 1. Unauthenticated Request -> must yield 401
    await runner.test(`SEC-RBAC-01: [UNAUTH → 401] ${cfg.name}`, async () => {
      __setMockSessionUser(null);
      try {
        const res = await callHandler(buildRequest());
        assert.strictEqual(
          res.status,
          401,
          `Unauthenticated request to ${cfg.endpoint} must return 401 Unauthorized, got ${res.status}`
        );
        const json = await res.json();
        assert.ok(
          json.code === "UNAUTHENTICATED" || json.message?.toLowerCase().includes("unauthor") || json.message?.toLowerCase().includes("sign in"),
          `Expected UNAUTHENTICATED error code/message, got ${JSON.stringify(json)}`
        );
      } finally {
        __setMockSessionUser(undefined);
      }
    });

    // 2. Unauthorized Roles -> must yield 403
    const blockedRoles = ALL_ROLES.filter((r) => !cfg.allowedRoles.includes(r));
    for (const role of blockedRoles) {
      await runner.test(`SEC-RBAC-02: [${role} → 403] ${cfg.name}`, async () => {
        __setMockSessionUser({
          id: `sec-mock-${role.toLowerCase()}`,
          email: `${role.toLowerCase()}@security-pen.local`,
          name: `Penetration ${role}`,
          role,
        });

        try {
          const res = await callHandler(buildRequest());
          assert.strictEqual(
            res.status,
            403,
            `Role ${role} accessing ${cfg.endpoint} must be blocked with 403 Forbidden, got ${res.status}`
          );
          const json = await res.json();
          assert.strictEqual(
            json.code,
            "FORBIDDEN",
            `Expected FORBIDDEN error code, got ${json.code}`
          );
        } finally {
          __setMockSessionUser(undefined);
        }
      });
    }

    // 3. Authorized Roles -> must NOT yield 401 or 403
    for (const role of cfg.allowedRoles) {
      await runner.test(`SEC-RBAC-03: [${role} → Authorized (not 401/403)] ${cfg.name}`, async () => {
        __setMockSessionUser({
          id: `sec-mock-${role.toLowerCase()}`,
          email: `${role.toLowerCase()}@security-pen.local`,
          name: `Penetration ${role}`,
          role,
        });

        try {
          const res = await callHandler(buildRequest());
          assert.ok(
            res.status !== 401 && res.status !== 403,
            `Role ${role} accessing ${cfg.endpoint} should be authorized, but got ${res.status}`
          );
        } finally {
          __setMockSessionUser(undefined);
        }
      });
    }
  }

  runner.printSummaryReport();
  const summary = runner.getSummary();
  if (summary.failed > 0) {
    process.exit(1);
  }
}

runPenetrationSuite().catch((err) => {
  console.error("Penetration test suite crashed:", err);
  process.exit(1);
});
