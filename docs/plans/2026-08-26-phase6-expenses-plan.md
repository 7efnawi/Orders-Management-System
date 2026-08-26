# Phase 6 — Expense Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the expense tracking subsystem allowing cashiers, managers, and owners to record operational and daily expenses (with 20 default preset categories + custom categories), filter and search expenses by date and type, and maintain atomic audit logging for all mutations.

**Architecture:** Service layer in `src/services/expenses.ts`, guarded API endpoints in `src/app/api/expenses/`, interactive management UI in `src/components/expenses/`, and integration into the daily closing workflow.

**Tech Stack:** Next.js 16 (App Router), Prisma 7, React 19, TypeScript, Zod, next-intl, Tailwind CSS v4, shadcn/ui.

**Spec:** `docs/specs/2026-08-25-data-model-design.md`, `docs/SRS.md` (§FR-EXP), `docs/USE_CASES.md` (UC-12).

## Global Constraints

- `PROJECT_LOG.md` must be updated on commit with every change (ENGINEERING_DIRECTIVES.md §0).
- Zero business logic in UI components (ENGINEERING_DIRECTIVES.md §2).
- Default 20 expense categories from Excel must be initialized if empty.
- Cashier can record expenses; Manager/Owner can manage expense types and edit records.
- All mutations must record an `AuditLog` in the exact same database transaction.
- PowerShell file operations on `src/app/[locale]/` must use `-LiteralPath`.

---

## File Structure & Responsibilities

```
src/
├── services/
│   └── expenses.ts                # CRUD for Expenses & ExpenseTypes + seedDefaultTypes + audit logging
├── app/
│   └── api/
│       └── expenses/
│           ├── types/
│           │   └── route.ts        # GET (list types), POST (create custom type)
│           ├── route.ts            # GET (list/filter expenses), POST (create expense)
│           └── [id]/
│               └── route.ts        # PATCH (edit expense), DELETE (delete expense)
├── components/
│   └── expenses/
│       ├── expense-dialog.tsx      # Add / Edit Expense modal
│       ├── expense-type-dialog.tsx # Add custom Expense Type modal
│       └── expenses-client.tsx     # Main view with summary cards, date range picker, filters, and table
└── app/[locale]/(dashboard)/
    └── expenses/
        └── page.tsx                # Expenses dashboard page (/expenses)
```

---

### Task 1: Expense Service Layer (`src/services/expenses.ts`)

**Files:**
- Create: `src/services/expenses.ts`
- Create: `scripts/test-expenses-service.ts`

**Interfaces:**
- Consumes: `prisma`, `audit`.
- Produces:
  - `seedDefaultExpenseTypes()`
  - `listExpenseTypes()`
  - `createExpenseType(userId: string, name: string)`
  - `createExpense(userId: string, input: CreateExpenseInput)`
  - `updateExpense(userId: string, expenseId: string, data: UpdateExpenseInput)`
  - `deleteExpense(userId: string, expenseId: string)`
  - `listExpenses(filters: ExpenseListFilters)`

- [x] **Step 1: Write test script in `scripts/test-expenses-service.ts`**
- [x] **Step 2: Implement `src/services/expenses.ts`**
- [x] **Step 3: Run test with `npx tsx scripts/test-expenses-service.ts` and verify it passes**
- [x] **Step 4: Run `npm run typecheck`**
- [x] **Step 5: Update `PROJECT_LOG.md` and commit**

---

### Task 2: Expenses API Endpoints (`/api/expenses/...`)

**Files:**
- Create: `src/app/api/expenses/types/route.ts`
- Create: `src/app/api/expenses/route.ts`
- Create: `src/app/api/expenses/[id]/route.ts`

**Interfaces:**
- Consumes: `requireApiRole`, `wrapApi`, `services/expenses.ts`.
- Produces: JSON HTTP Endpoints validating input via Zod.

- [x] **Step 1: Implement Expense Types endpoint (GET / POST)**
- [x] **Step 2: Implement Expenses endpoints (GET / POST / PATCH / DELETE)**
- [x] **Step 3: Create and run test script `scripts/test-expenses-api-schemas.ts`**
- [x] **Step 4: Run `npm run typecheck` & `npm run lint`**
- [x] **Step 5: Update `PROJECT_LOG.md` and commit**

---

### Task 3: Expense Management UI (`src/components/expenses/...`)

**Files:**
- Create: `src/components/expenses/expense-dialog.tsx`
- Create: `src/components/expenses/expense-type-dialog.tsx`
- Create: `src/components/expenses/expenses-client.tsx`
- Create: `src/app/[locale]/(dashboard)/expenses/page.tsx`
- Modify: `src/messages/ar.json`, `src/messages/en.json` (namespace `expenses`)

**Interfaces:**
- Consumes: `/api/expenses`, `/api/expenses/types`.
- Produces: Comprehensive expense recording and reporting dashboard.

- [x] **Step 1: Add translations to `src/messages/ar.json` & `en.json`**
- [x] **Step 2: Build `expense-dialog.tsx` and `expense-type-dialog.tsx`**
- [x] **Step 3: Build `expenses-client.tsx` with financial summary widgets, live filters, and edit actions**
- [x] **Step 4: Build page wrapper `src/app/[locale]/(dashboard)/expenses/page.tsx` and add nav link**
- [x] **Step 5: Run `npm run typecheck` & `npm run lint`**
- [x] **Step 6: Update `PROJECT_LOG.md` and commit**

---

### Task 4: Automated Verification Gate & PROJECT_LOG Update

**Files:**
- Create: `scripts/verify-phase6.ts`
- Modify: `PROJECT_LOG.md`

- [x] **Step 1: Write and run verification script `scripts/verify-phase6.ts` simulating default seeding, expense recording, filtering, and audit logging**
- [x] **Step 2: Run `npm run typecheck`, `npm run lint`, and `npm run build`**
- [x] **Step 3: Update `PROJECT_LOG.md` with Phase 6 Completion ADR entry**
- [x] **Step 4: Update `docs/plans/2026-08-26-phase6-expenses-plan.md` marking all steps complete**
- [x] **Step 5: Final Commit**
