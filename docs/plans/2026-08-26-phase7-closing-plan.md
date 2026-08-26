# Phase 7 — Daily Closing & Shift Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shift and daily closing subsystem allowing cashiers to open and close shifts, compute live and final cash reconciliations (`netCash = totalCash - totalExpenses`), record `DailyClosing` records with notes, and enable managers/owners to audit historical closing reports.

**Architecture:** Pure calculation logic in `src/lib/closing.ts`, transaction & persistence orchestration in `src/services/closing.ts` (writing `DailyClosing` and `AuditLog` in the same transaction), guarded API routes in `src/app/api/shifts/` and `src/app/api/closing/`, and interactive UI in `src/components/closing/`.

**Tech Stack:** Next.js 16 (App Router), Prisma 7, React 19, TypeScript, Zod, next-intl, Tailwind CSS v4, shadcn/ui.

**Spec:** `docs/specs/2026-08-25-data-model-design.md`, `docs/SRS.md` (§FR-CLOSE), `docs/USE_CASES.md` (UC-10).

## Global Constraints

- `PROJECT_LOG.md` must be updated on commit with every change (ENGINEERING_DIRECTIVES.md §0).
- Zero business logic in UI components — `netCash` calculations live strictly in `src/lib/closing.ts` (ENGINEERING_DIRECTIVES.md §2).
- One `DailyClosing` record per `Shift` (`shiftId` is `@unique`).
- All closing mutations must record an `AuditLog` in the exact same database transaction.
- Cashier can open their own shift, view live preview, and close their shift; Manager/Owner can view all shifts and historical closings.
- PowerShell file operations on `src/app/[locale]/` must use `-LiteralPath`.

---

## File Structure & Responsibilities

```
src/
├── lib/
│   └── closing.ts                 # Pure calculation function for shift totals and net cash
├── services/
│   └── closing.ts                 # openShift, getOpenShift, getShiftPreview, closeShift, listClosings, getClosingById
├── app/
│   └── api/
│       ├── shifts/
│       │   ├── current/route.ts    # GET current cashier open shift
│       │   ├── open/route.ts       # POST open new shift
│       │   └── [id]/
│       │       ├── preview/route.ts # GET live shift financial summary preview
│       │       └── close/route.ts  # POST close shift & create DailyClosing
│       └── closing/
│           ├── route.ts            # GET list historical closings
│           └── [id]/route.ts       # GET full closing details
├── components/
│   └── closing/
│       ├── open-shift-card.tsx     # Screen/card to open a new shift
│       ├── active-shift-summary.tsx # Live drawer reconciliation & close shift confirmation
│       ├── closing-history-table.tsx # Past closings table with filters
│       ├── closing-details-modal.tsx # View full shift snapshot details
│       └── closing-client.tsx      # Main view combining active shift & history tabs
└── app/[locale]/(dashboard)/
    └── closing/
        └── page.tsx                # Daily closing dashboard page (/closing)
```

---

### Task 1: Pure Calculation Logic (`src/lib/closing.ts`)

**Files:**
- Create: `src/lib/closing.ts`
- Create: `scripts/test-closing-logic.ts`

**Interfaces:**
- Consumes: Order and Expense structures.
- Produces: `calculateShiftSummary(orders, expenses)` returning `{ totalOrders, cancelledOrders, totalCash, totalVisa, totalOnline, totalDeliveryFees, totalExpenses, netCash }`.

- [x] **Step 1: Write unit test script in `scripts/test-closing-logic.ts`**
- [x] **Step 2: Implement `src/lib/closing.ts`**
- [x] **Step 3: Run test with `npx tsx scripts/test-closing-logic.ts` and verify it passes**
- [x] **Step 4: Run `npm run typecheck`**
- [x] **Step 5: Update `PROJECT_LOG.md` and commit**

---

### Task 2: Shift & Closing Service Layer (`src/services/closing.ts`)

**Files:**
- Create: `src/services/closing.ts`
- Create: `scripts/test-closing-service.ts`

**Interfaces:**
- Consumes: `prisma`, `audit`, `closing.ts`.
- Produces:
  - `getCurrentOpenShift(cashierId: string)`
  - `openShift(cashierId: string)`
  - `getShiftPreview(shiftId: string)`
  - `closeShift(userId: string, shiftId: string, notes?: string | null)`
  - `listDailyClosings(filters: ClosingListFilters)`
  - `getDailyClosingById(closingId: string)`

- [x] **Step 1: Write integration test script in `scripts/test-closing-service.ts`**
- [x] **Step 2: Implement `src/services/closing.ts`**
- [x] **Step 3: Run test with `npx tsx scripts/test-closing-service.ts` and verify it passes**
- [x] **Step 4: Run `npm run typecheck`**
- [x] **Step 5: Update `PROJECT_LOG.md` and commit**

---

### Task 3: Shift & Closing API Routes (`/api/shifts/...` & `/api/closing/...`)

**Files:**
- Create: `src/app/api/shifts/current/route.ts`
- Create: `src/app/api/shifts/open/route.ts`
- Create: `src/app/api/shifts/[id]/preview/route.ts`
- Create: `src/app/api/shifts/[id]/close/route.ts`
- Create: `src/app/api/closing/route.ts`
- Create: `src/app/api/closing/[id]/route.ts`

**Interfaces:**
- Consumes: `requireApiRole`, `wrapApi`, `services/closing.ts`.
- Produces: Guarded JSON HTTP Endpoints validating input via Zod.

- [x] **Step 1: Implement shift routes (current, open, preview, close)**
- [x] **Step 2: Implement closing history routes (list, details)**
- [x] **Step 3: Create and run test script `scripts/test-closing-api-schemas.ts`**
- [x] **Step 4: Run `npm run typecheck` & `npm run lint`**
- [x] **Step 5: Update `PROJECT_LOG.md` and commit**

---

### Task 4: Daily Closing UI (`src/components/closing/...` & `/closing` page)

**Files:**
- Create: `src/components/closing/open-shift-card.tsx`
- Create: `src/components/closing/active-shift-summary.tsx`
- Create: `src/components/closing/closing-history-table.tsx`
- Create: `src/components/closing/closing-details-modal.tsx`
- Create: `src/components/closing/closing-client.tsx`
- Create: `src/app/[locale]/(dashboard)/closing/page.tsx`
- Modify: `src/messages/ar.json`, `src/messages/en.json` (namespace `closing`)
- Modify: `src/app/[locale]/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes: `/api/shifts/...`, `/api/closing/...`.
- Produces: Real-time cashier shift management & daily closing dashboard.

- [x] **Step 1: Add translations to `src/messages/ar.json` & `en.json`**
- [x] **Step 2: Build `open-shift-card.tsx` and `active-shift-summary.tsx`**
- [x] **Step 3: Build `closing-history-table.tsx` and `closing-details-modal.tsx`**
- [x] **Step 4: Build `closing-client.tsx` integrating active shift & history tabs**
- [x] **Step 5: Build page wrapper `src/app/[locale]/(dashboard)/closing/page.tsx` and add navigation link**
- [x] **Step 6: Run `npm run typecheck` & `npm run lint`**
- [x] **Step 7: Update `PROJECT_LOG.md` and commit**

---

### Task 5: Automated Verification Gate & PROJECT_LOG Update

**Files:**
- Create: `scripts/verify-phase7.ts`
- Modify: `PROJECT_LOG.md`

- [x] **Step 1: Write and run verification script `scripts/verify-phase7.ts` simulating opening shift, placing orders, recording expenses, live preview, closing shift, and audit logs**
- [x] **Step 2: Run `npm run typecheck`, `npm run lint`, and `npm run build`**
- [x] **Step 3: Update `PROJECT_LOG.md` with Phase 7 Completion ADR entry**
- [x] **Step 4: Update `docs/plans/2026-08-26-phase7-closing-plan.md` marking all steps complete**
- [x] **Step 5: Final Commit**
