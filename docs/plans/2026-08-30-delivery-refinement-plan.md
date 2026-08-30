# Delivery Fleet Refinement & Pickup Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove "Customer Pickup" (`PICKUP`) completely from the system, streamline driver assignment so App Fleet (`APP`) and External Courier (`EXTERNAL`) do not require individual personal names, and preserve named driver tracking for the internal restaurant fleet (`OWN`).

**Architecture:** Update domain logic in `orderStateMachine.ts` and `services/delivery.ts`, refactor `assign-driver-dialog.tsx` and POS `order-form.tsx` to offer 1-click App / External selection alongside internal driver search, update translations, and ensure 100% test coverage.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Prisma 7, Lucide React, next-intl.

**Spec:** `docs/SRS.md` (FR-DEL-01..04) • `docs/plans/2026-08-30-delivery-refinement-plan.md`

## Global Constraints

1. **No Pickup Everywhere:** `PICKUP` is completely removed from all UI controls, filters, POS checkout, and dispatch dialogs.
2. **App vs Own vs External Distinction:**
   - `OWN`: Must have individual named drivers (e.g. "كابتن أحمد") for cash reconciliation.
   - `APP`: Generic platform fleet ("طيار التطبيق") with 0 restaurant-collected delivery fee.
   - `EXTERNAL`: Generic external shipping company ("شركة شحن خارجية") with zone delivery fee.
3. **Bilingual RTL & LTR Symmetry:** Arabic and English translation keys updated in sync.
4. **Quality Gates:** `npm run typecheck` passes with 0 errors and `npm run test:e2e` passes 100%.

---

## Tasks & Bite-Sized Steps

### Task 1: Domain & Service Layer Refactoring

**Files:**
- Modify: `src/lib/orderStateMachine.ts`
- Modify: `src/services/delivery.ts`

**Interfaces:**
- `calculateOrderTotals`: App fleet delivery fee = 0, otherwise zone fee.
- `getOrCreateSystemDriver(type: "APP" | "EXTERNAL")`: Ensures standard system driver records.

- [x] **Step 1: Update `calculateOrderTotals` in `src/lib/orderStateMachine.ts` to remove `PICKUP`**
- [x] **Step 2: Update `src/services/delivery.ts` to add `getOrCreateSystemDriver` and remove `PICKUP` branches**
- [x] **Step 3: Verify TypeScript compilation with `npm run typecheck`**

---

### Task 2: Delivery Management UI & Dialogs Refactoring

**Files:**
- Modify: `src/components/delivery/driver-dialog.tsx`
- Modify: `src/components/delivery/delivery-client.tsx`

- [x] **Step 1: Update `driver-dialog.tsx` to remove `PICKUP` and auto-fill names for `APP` and `EXTERNAL`**
- [x] **Step 2: Update `delivery-client.tsx` to remove `PICKUP` badge and tab filter**
- [x] **Step 3: Verify with `npm run typecheck`**

---

### Task 3: Driver Selection UI in POS & Dispatch Dialog

**Files:**
- Modify: `src/components/delivery/assign-driver-dialog.tsx`
- Modify: `src/components/orders/order-form.tsx`
- Modify: `src/components/orders/order-details-modal.tsx`

- [x] **Step 1: Overhaul `assign-driver-dialog.tsx` with 1-click APP / EXTERNAL cards + OWN drivers list**
- [x] **Step 2: Update POS checkout `order-form.tsx` driver selector**
- [x] **Step 3: Update `order-details-modal.tsx` to remove `PICKUP` badge**
- [x] **Step 4: Verify with `npm run typecheck`**

---

### Task 4: Translations, E2E Tests & Quality Gates

**Files:**
- Modify: `src/messages/ar.json`
- Modify: `src/messages/en.json`
- Modify: `tests/fixtures/mock-data.ts`
- Modify: `tests/e2e/tier1-feature-coverage.test.ts`
- Modify: `PROJECT_LOG.md`

- [x] **Step 1: Remove `PICKUP` keys from `ar.json` and `en.json`**
- [x] **Step 2: Update test fixtures in `mock-data.ts` and `tier1-feature-coverage.test.ts`**
- [x] **Step 3: Run `npm run typecheck` and `npm run test:e2e` to verify 100% pass**
- [x] **Step 4: Update `PROJECT_LOG.md` with ADR**

---

## Execution Choice Handoff

Plan complete and saved to `docs/plans/2026-08-30-delivery-refinement-plan.md`.
Two execution options:
1. **Subagent-Driven (recommended)** - Dispatches fresh subagents per task with review checkpoints.
2. **Inline Execution** - Executes tasks sequentially in this session with immediate verification.
