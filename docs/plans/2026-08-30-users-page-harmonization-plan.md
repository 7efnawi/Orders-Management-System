# Users Page UI/UX & Layout Harmonization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harmonize the layout, responsive dimensions, KPI cards, filters, and tables on the Users Management page (`/users`) so it aligns with the rest of the application.

**Architecture:** Refactor `users-client.tsx` and `user-dialog.tsx` to match the exact spacing, container constraints (`max-w-[1440px] px-4 sm:px-6 lg:px-8`), KPI card proportions, and responsive filter grid used in `/delivery` and `/expenses`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Lucide React, next-intl, shadcn/ui.

---

## Tasks & Bite-Sized Steps

### Task 1: Outer Container & Header Standardization

**Files:**
- Modify: `src/components/users/users-client.tsx`

- [x] **Step 1: Replace unconstrained container with `mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8`**
- [x] **Step 2: Add header action cluster (Refresh button + Add User CTA) with standard `h-10` button dimensions**
- [x] **Step 3: Verify with `npm run typecheck`**

---

### Task 2: KPI Stats Cards & Search/Filter Bar Alignment

**Files:**
- Modify: `src/components/users/users-client.tsx`

- [x] **Step 1: Standardize 5 KPI stat cards with balanced `p-4`, `size-11` icon badges, and `text-2xl` bold numbers**
- [x] **Step 2: Polish Search and Filter segment controls (Role & Status) with responsive flex-wrap layout**
- [x] **Step 3: Verify with `npm run typecheck`**

---

### Task 3: Users Table & Row Proportions Polish

**Files:**
- Modify: `src/components/users/users-client.tsx`

- [x] **Step 1: Refine table container (`rounded-xl border border-border/80 bg-card overflow-hidden`)**
- [x] **Step 2: Style User Avatar circles with role-themed gradients and clean typography hierarchy**
- [x] **Step 3: Refine Role badges, active switch, and edit action button**
- [x] **Step 4: Verify with `npm run typecheck`**

---

### Task 4: User Creation & Edit Modal Polish

**Files:**
- Modify: `src/components/users/user-dialog.tsx`

- [x] **Step 1: Polish dialog card container, role selector cards, and inputs**
- [x] **Step 2: Verify with `npm run typecheck` and `npm run test:e2e`**
- [x] **Step 3: Update `PROJECT_LOG.md` with ADR**

---

## Execution Choice Handoff

Plan saved to `docs/plans/2026-08-30-users-page-harmonization-plan.md`.
Choose between:
1. **Subagent-Driven (recommended)** - Dispatches fresh subagents per task with review checkpoints.
2. **Inline Execution** - Executes tasks sequentially in this session with immediate verification.
