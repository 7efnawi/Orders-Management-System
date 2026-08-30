# Navigation Bar UI/UX Redesign & Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the Navigation Bar UI/UX: give the system an authentic sushi dark kitchen group brand name, remove the broken active frame around the logo/title on the home page, resolve the width bottleneck hiding the "المستخدمين" tab, and replace the clunky user profile chip with a sleek modern profile dropdown.

**Architecture:** Refactor `dashboard-header.tsx` with a high-density responsive layout, integrate Radix/shadcn `DropdownMenu` for the user profile, update `ar.json` and `en.json` branding, and verify responsive ergonomics across 1024px to 1920px.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React, next-intl, shadcn/ui.

## Global Constraints

1. **Zero Text Clipping:** All 7 tabs (`الأوردرات`, `المنيو`, `التوصيل`, `المصاريف`, `إغلاق اليوم`, `التقارير`, `المستخدمين`) must be 100% visible on 1024px+ viewports without overflowing into `|| 👥`.
2. **Clean Brand Interaction:** The logo/brand link must never distort, wrap in awkward borders, or glitch when active on `/`.
3. **Sleek Profile Menu:** Compact trigger with avatar + subtle status dot, opening a clean menu with user info and actions.
4. **Bilingual Symmetry:** AR and EN messages updated in sync.
5. **Quality Gates:** `npm run typecheck` (0 errors) and `npm run test:e2e` (100% pass).

---

## Tasks & Bite-Sized Steps

### Task 1: Brand Identity & Copy Polish (`ar.json` & `en.json`)

**Files:**
- Modify: `src/messages/ar.json`
- Modify: `src/messages/en.json`

- [x] **Step 1: Update brand name to "Sushi Flower" and tag to "إدارة الطلبات والتشغيل / Operations & Order Control"**
- [x] **Step 2: Add profile dropdown translation keys**
- [x] **Step 3: Verify with `npm run typecheck`**

---

### Task 2: Brand Logo & Home Link Clean Architecture

**Files:**
- Modify: `src/components/layout/dashboard-header.tsx`

- [x] **Step 1: Remove awkward active border/pill wrapping the entire brand container on home**
- [x] **Step 2: Style clean brand emblem with smooth hover micro-interactions**
- [x] **Step 3: Verify brand link renders crisply without distortion**

---

### Task 3: Navigation Tabs Layout & Width Rebalancing (Showing Users Tab)

**Files:**
- Modify: `src/components/layout/dashboard-header.tsx`

- [x] **Step 1: Optimize nav item padding (`px-2.5 xl:px-3 py-1.5`) and gap spacing**
- [x] **Step 2: Rebalance header flex container to eliminate overflow constraints**
- [x] **Step 3: Verify all 7 tabs including "المستخدمين" are fully visible on 1024px+ viewports**

---

### Task 4: Modern User Profile Dropdown & Controls Optimization

**Files:**
- Modify: `src/components/layout/dashboard-header.tsx`

- [x] **Step 1: Replace clunky profile box with sleek avatar + compact name + role dot**
- [x] **Step 2: Integrate dropdown menu showing user details and clean actions**
- [x] **Step 3: Run `npm run typecheck` and `npm run test:e2e` to verify 100% pass**
- [x] **Step 4: Update `PROJECT_LOG.md` with ADR**

---

## Execution Choice Handoff

Plan complete and saved to `docs/plans/2026-08-30-navbar-ui-ux-redesign-plan.md`.
Two execution options:
1. **Subagent-Driven (recommended)** - Dispatches fresh subagents per task with review checkpoints.
2. **Inline Execution** - Executes tasks sequentially in this session with immediate verification.
