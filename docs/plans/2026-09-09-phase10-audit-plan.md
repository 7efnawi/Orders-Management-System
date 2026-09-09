# Phase 10 — Audit Log UI & Activity Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete Audit Log UI & Activity Monitoring system (`FR-AUD-01` … `FR-AUD-05`, `UC-13`) strictly restricted to the `OWNER`, enabling immutable inspection of all critical system events (order status transitions, cancellations, discount approvals/rejections, expenses, shift closings, menu mutations, and user role updates) with an interactive Visual Diff Inspector, responsive multi-criteria filters, executive KPI cards, and automated phase gate verification.

**Architecture:**
1. **Service Layer (`src/services/audit.ts`):** High-performance read-only query engine with pagination, multi-field filtering (`action`, `entityType`, `userId`, `dateRange`, `search`), aggregated KPI summary metrics, and a semantic Field Diff Engine (`computeAuditDiff`) translating raw JSON `oldValue` vs `newValue` into human-readable Arabic & English diff items.
2. **Strict RBAC API (`src/app/api/audit/route.ts`):** Route guarded by `requireRole("OWNER")` returning 403 Forbidden for Managers and Cashiers. Rejection of all mutation methods (`POST`, `PUT`, `PATCH`, `DELETE`) enforcing absolute immutability (`FR-AUD-02`).
3. **Owner-Only Dashboard UI (`src/app/[locale]/(dashboard)/audit/page.tsx` & `src/components/audit/`):** Server-guarded route redirecting non-Owners to `/`. Interactive client UI with 4 KPI summary cards, quick date range bar, role & action badges, search bar, paginated data table, and an executive Visual Diff Dialog (`AuditDiffDialog`).
4. **Navbar & Navigation (`src/components/layout/dashboard-header.tsx`):** Audit link conditionally displayed exclusively for `user.role === "OWNER"` in both desktop navbar and mobile slide-over drawer.
5. **Quality Gates & Automated Verification:** E2E suite `F16.1 - F16.6` in `tests/e2e/tier1-feature-coverage.test.ts` and automated phase gate verification script `scripts/verify-phase10.ts`.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Prisma 7, Lucide React, Zod, next-intl.

**Spec References:** `docs/SRS.md` (§FR-AUD-01 … §FR-AUD-05) • `docs/specs/2026-08-25-data-model-design.md` • `docs/USE_CASES.md` (UC-13)

---

## Subagent Team & Model Configuration

| Subagent Task | Role Title | Model | Key Skills Used |
|---|---|---|---|
| **Task 10.1: Service Layer & Diff Engine** | `Backend & Security Engineer` | `inherit` | `tdd`, `domain-modeling` |
| **Task 10.2: Guarded API Route** | `API & Auth Engineer` | `inherit` | `tdd`, `codebase-design` |
| **Task 10.3: UI, Diff Modal & i18n** | `Frontend & UX Specialist` | `inherit` | `ui-ux-pro-max`, `frontend-design` |
| **Task 10.4: Gate Verification & Build** | `QA & Verification Engineer` | `inherit` | `tdd`, `diagnosing-bugs` |

---

## Global Constraints & Security Invariants

1. **FR-AUD-03 (Owner Only Access):** Both the API endpoint `/api/audit` and the page route `/audit` are strictly reserved for `OWNER`. Non-owners attempting API access receive `403 Forbidden` (`AuthError("FORBIDDEN")`). Non-owners attempting page access are redirected to `/`.
2. **FR-AUD-02 (Absolute Immutability):** The Audit Log is strictly append-only. There are NO services or endpoints that update or delete any `AuditLog` row. Any `POST`, `PUT`, `PATCH`, or `DELETE` request to `/api/audit` returns `405 Method Not Allowed`.
3. **FR-AUD-05 (Single Source of Truth):** Writing to `AuditLog` remains exclusively through `src/lib/audit.ts` inside atomic `prisma.$transaction` across existing domain services (`orders`, `expenses`, `closing`, `users`, `menu`, `delivery`).
4. **Bilingual Completeness:** Full symmetrical translations in `src/messages/ar.json` and `src/messages/en.json` under `audit.*`.
5. **Quality Gates:** `npm run typecheck` (0 errors) and `npm run test:e2e` (100% pass) must pass before committing any task. `PROJECT_LOG.md` updated in the same commit.

---

## File Structure Plan

```
src/
├── services/
│   └── audit.ts                                [NEW] Service layer for querying, stats & diff computation
├── app/
│   └── api/
│       └── audit/
│           └── route.ts                        [NEW] Owner-only GET API with query validation
├── components/
│   ├── audit/
│   │   ├── audit-diff-dialog.tsx               [NEW] High-contrast visual diff viewer modal
│   │   ├── audit-filter-bar.tsx                [NEW] Filter controls (Date, Action, Entity, User, Search)
│   │   ├── audit-table.tsx                     [NEW] Responsive data table with badges & pagination
│   │   └── audit-client.tsx                    [NEW] Client orchestrator with 4 KPI summary cards
│   └── layout/
│       └── dashboard-header.tsx                [MODIFY] Add Audit tab conditionally for OWNER only
├── app/[locale]/(dashboard)/
│   └── audit/
│       └── page.tsx                            [NEW] Server-guarded page (Owner only, redirect otherwise)
├── messages/
│   ├── ar.json                                 [MODIFY] Add audit translation keys
│   └── en.json                                 [MODIFY] Add audit translation keys
tests/e2e/
└── tier1-feature-coverage.test.ts              [MODIFY] Add Feature F16 (Audit Log & Activity Monitoring)
scripts/
└── verify-phase10.ts                           [NEW] Automated phase gate verification script
```

---

## Tasks & Bite-Sized Steps

### Task 10.1: Audit Service Layer, Semantic Diff Engine & F16 E2E Tests
**Files:**
- Create: `src/services/audit.ts`
- Modify: `tests/e2e/tier1-feature-coverage.test.ts`

**Interfaces:**
```typescript
export interface AuditLogFilter {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogWithUser {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface FieldDiff {
  field: string;
  labelAr: string;
  labelEn: string;
  oldValue: any;
  newValue: any;
  type: "text" | "currency" | "status" | "boolean" | "role" | "json";
}

export interface AuditSummaryStats {
  totalLogs: number;
  todayCount: number;
  statusChangeCount: number;
  criticalCount: number; // Cancellations, discount approves/rejects, role changes
}
```

- [ ] **Step 1: Write failing F16 tests in `tests/e2e/tier1-feature-coverage.test.ts`**
  - `F16.1`: `computeAuditDiff` parses and formats status changes, discount approvals, and role updates cleanly.
  - `F16.2`: `listAuditLogs` filter criteria (action, entityType, user, and date range).
  - `F16.3`: `getAuditStats` aggregates metrics accurately.
  - `F16.4`: Non-owner access rejection verification.
  - `F16.5`: Audit log immutability verification (ensuring table is strictly append-only).
- [ ] **Step 2: Run `npm run test:e2e` to verify Red phase**
- [ ] **Step 3: Implement `src/services/audit.ts`**
  - Implement `computeAuditDiff(oldValue, newValue)` with comprehensive domain field dictionary (mapping `status`, `role`, `discountAmount`, `cancelReason`, `notes`, `subtotal`, `total`, `isActive`).
  - Implement `listAuditLogs(filters)` with pagination (`skip`/`take`), sorting by `timestamp: desc`, user relation include, and multi-field where clause.
  - Implement `getAuditStats(filter)` using `prisma.auditLog.count` with date ranges and critical action groupings.
  - Implement `getAuditLogById(id)`.
- [ ] **Step 4: Run `npm run test:e2e` and `npm run typecheck` to verify Green phase**
- [ ] **Step 5: Update `PROJECT_LOG.md` with Task 10.1 ADR entry and commit**

---

### Task 10.2: Protected API Route (`/api/audit`)
**Files:**
- Create: `src/app/api/audit/route.ts`

**Interfaces:**
- Method: `GET /api/audit`
- Query Parameters: `page` (default 1), `limit` (default 25), `userId`, `action`, `entityType`, `startDate`, `endDate`, `search`.
- Response:
  ```json
  {
    "success": true,
    "data": {
      "logs": [...],
      "total": 120,
      "page": 1,
      "limit": 25,
      "totalPages": 5,
      "stats": {
        "totalLogs": 120,
        "todayCount": 18,
        "statusChangeCount": 42,
        "criticalCount": 8
      }
    }
  }
  ```

- [ ] **Step 1: Implement `GET` handler in `src/app/api/audit/route.ts`**
  - Start with `const user = await requireRole("OWNER");` (guaranteeing `403 Forbidden` for non-owners).
  - Parse query parameters with Zod schema (`page`, `limit`, `action`, `entityType`, `userId`, `startDate`, `endDate`, `search`).
  - Query data via `listAuditLogs` and `getAuditStats`.
  - Handle errors returning standardized `{ code, message }` JSON.
- [ ] **Step 2: Enforce immutability (`FR-AUD-02`) by blocking non-GET methods**
  - Export handlers for `POST`, `PUT`, `PATCH`, `DELETE` returning `405 Method Not Allowed`.
- [ ] **Step 3: Verify with `npm run typecheck` and test GET API**
- [ ] **Step 4: Update `PROJECT_LOG.md` with Task 10.2 ADR entry and commit**

---

### Task 10.3: UI Components, Diff Dialog, Navigation & Bilingual Translations
**Files:**
- Create: `src/components/audit/audit-diff-dialog.tsx`
- Create: `src/components/audit/audit-filter-bar.tsx`
- Create: `src/components/audit/audit-table.tsx`
- Create: `src/components/audit/audit-client.tsx`
- Create: `src/app/[locale]/(dashboard)/audit/page.tsx`
- Modify: `src/components/layout/dashboard-header.tsx`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/en.json`

- [ ] **Step 1: Add complete `audit` namespace to `src/messages/ar.json` and `src/messages/en.json`**
  - Keys for page header, KPI cards, filter presets, action types, entity types, table headers, diff dialog labels, and export actions.
- [ ] **Step 2: Build `src/components/audit/audit-diff-dialog.tsx`**
  - High-contrast visual diff inspector modal (`ui-ux-pro-max` guidelines).
  - Displays previous values (red-tinted badge/card) vs new values (emerald-tinted badge/card) with arrow transition indicator.
  - Raw JSON inspector toggle for advanced debugging.
- [ ] **Step 3: Build `src/components/audit/audit-filter-bar.tsx`**
  - Quick date presets: Today, Yesterday, Last 7 Days, This Month, All Time.
  - Action selector dropdown, Entity type selector dropdown, and User selector dropdown.
  - Search input for entity ID (order #, expense #) or keyword.
- [ ] **Step 4: Build `src/components/audit/audit-table.tsx`**
  - Responsive table showing exact timestamp + relative time, User name and role badge, Action badge (color-coded), Entity type and ID, summary snippet, and "عرض التفاصيل" (View Diff) button.
  - Pagination controls with page jump and page size selection (15, 25, 50).
- [ ] **Step 5: Build `src/components/audit/audit-client.tsx`**
  - 4 Executive KPI cards at top (Total Logs, Today's Events, Status Changes, Critical Operations).
  - CSV / Excel export button generating clean tabular export of audit history.
  - Live filter and pagination state management.
- [ ] **Step 6: Build Server Page `src/app/[locale]/(dashboard)/audit/page.tsx`**
  - Guard with `requirePageUser()`. Redirect to `/` if `user.role !== "OWNER"`.
  - Fetch initial logs, stats, and users list server-side.
- [ ] **Step 7: Update `src/components/layout/dashboard-header.tsx`**
  - Add `/audit` link with `roles: ["OWNER"]` and `ShieldCheck` icon to desktop navbar and mobile drawer.
- [ ] **Step 8: Run `npm run typecheck` and `npm run test:e2e`**
- [ ] **Step 9: Update `PROJECT_LOG.md` with Task 10.3 ADR entry and commit**

---

### Task 10.4: Automated Phase Gate Verification (`verify-phase10.ts`) & Full Build
**Files:**
- Create: `scripts/verify-phase10.ts`
- Modify: `PROJECT_LOG.md`

- [ ] **Step 1: Implement `scripts/verify-phase10.ts` with 6 automated gate checks:**
  1. *Check 1: Clean environment and authenticate Owner.*
  2. *Check 2: Trigger sample business operations across models (Order creation, status change, discount request & approval, expense entry, user update) and verify atomic AuditLog persistence.*
  3. *Check 3: Verify multi-criteria service queries (by action, entity, user, date).*
  4. *Check 4: Verify RBAC security: non-Owner simulation receives 403 Forbidden.*
  5. *Check 5: Verify Immutability: confirm no update/delete endpoints exist.*
  6. *Check 6: Verify Semantic Diff Engine outputs valid old/new comparisons.*
- [ ] **Step 2: Run `npx tsx scripts/verify-phase10.ts` and verify 100% pass**
- [ ] **Step 3: Run full verification gates:**
  - `npm run typecheck` (0 errors)
  - `npm run test:e2e` (all 204+ tests pass)
  - `npm run build` (Turbopack production compilation passes for all routes)
- [ ] **Step 4: Update `PROJECT_LOG.md` with Phase 10 completion ADR entry and final commit**

---

## Verification Plan

### Automated Tests
- `npm run typecheck` — Static TypeScript checking across entire repo.
- `npm run test:e2e` — Full E2E suite covering Features F1 through F16 (210+ tests).
- `npx tsx scripts/verify-phase10.ts` — Comprehensive Phase 10 automated verification script.
- `npm run build` — Turbopack production build verifying all dynamic and static routes compile.

### Manual Verification
1. Login as Owner -> verify "سجل المراقبة" (Audit Log) appears in the navbar.
2. Navigate to `/ar/audit` -> verify 4 KPI cards, filter bar, and recent activity logs.
3. Click "عرض التفاصيل" on an order status transition -> verify the Visual Diff Modal opens showing previous and new states clearly.
4. Filter by "عمليات الإلغاء" or "الخصومات" -> verify table updates instantly.
5. Login as Cashier or Manager -> verify "سجل المراقبة" is hidden from navbar.
6. Attempt direct navigation to `/ar/audit` as Cashier/Manager -> verify immediate redirect to `/`.
7. Attempt direct API request `curl /api/audit` without Owner session -> verify `403 Forbidden`.
