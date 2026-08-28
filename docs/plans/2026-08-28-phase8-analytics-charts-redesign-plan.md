# Professional Reports & Analytics Dashboard (Charts & UI/UX Redesign) + Navigation Bar Layout Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or inline execution with checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Reports & Analytics dashboard into a world-class, professional Data Analyst command center with interactive Recharts visualizations (Revenue Area Trends, Platform Market Share Donut, Brand Portfolio Comparison Bar, Top Menu Items Ranking), custom color tokens for KPIs, and fix navigation bar overlapping/collision across all viewport sizes.

**Architecture:** 
- Modular, componentized Analytics UI under `src/components/reports/` (`reports-client.tsx`, `charts/revenue-trend-chart.tsx`, `charts/platform-share-chart.tsx`, `charts/brand-performance-chart.tsx`, `charts/top-products-chart.tsx`, `reports-kpi-grid.tsx`).
- Responsive flexbox navigation in `src/components/layout/dashboard-header.tsx` with guaranteed right-side CTA shrink-protection and horizontal-safe nav links.
- Uses pure calculation engine (`src/lib/reports.ts`) + `recharts` for charts.

**Tech Stack:** Next.js 16 + React 19 + Tailwind v4 + Recharts ^3.10.1 + Lucide React + next-intl.

**Spec / Requirements:** 
- User Directive: Professional Data Analyst dashboard with rich charts, custom colored KPI cards, platform visual signatures, and clean navigation bar with no button collisions.
- Standards: `max-w-[1440px]`, `h-10` controls, Japanese dark kitchen theme tokens, 100% RTL & LTR bilingual support.

---

## Global Constraints

1. **Directives §2 & §3 (Pure Logic in `src/lib/`):** All chart calculations, aggregations, and ratios are handled cleanly without hardcoded business logic in page components.
2. **Recharts in React 19 / Next.js 16:** Recharts components MUST be loaded within client components (`"use client"`) and wrapped in `ResponsiveContainer` with responsive min-heights (260px - 340px) to prevent layout shifts.
3. **Navigation Protection:** The navigation container in `dashboard-header.tsx` must never overlap, wrap awkwardly, or obscure the persistent `+ New Order` CTA button regardless of window width (from mobile 360px up to 4K).
4. **Theme & Token Harmony:** Chart colors and KPI cards must use the visual token system (`visualTokens.ts`):
   - Platforms: Talabat (`#FF5A00`), elmenus (`#E31C24`), InstaShop (`#00A859`), HarryApp (`#BE123C`), Facebook (`#1877F2`), Phone (`#4F46E5`).
   - Brands: Flower (`#ec4899`), Mastery (`#f59e0b`), Niwa (`#10b981`), Tobiko (`#f97316`).
   - Financials: Emerald for Net Revenue / Profit, Rose for Expenses, Amber for Discounts, Sky for Delivery Fees.
5. **Quality Gates:** `npm run typecheck` and `npm run test:e2e` MUST pass with 0 errors before committing.

---

## File Structure & Responsibilities

| File | Responsibility |
|---|---|
| `src/components/layout/dashboard-header.tsx` | Fix navbar layout, responsive gap/padding, shrink protection for CTA and controls |
| `src/components/reports/charts/revenue-trend-chart.tsx` | Interactive Area/Bar chart for daily Net Revenue + Order Volume trend over time |
| `src/components/reports/charts/platform-share-chart.tsx` | Donut/Pie chart for Platform Market Share (Revenue & Orders) with platform brand colors |
| `src/components/reports/charts/brand-performance-chart.tsx` | Grouped Bar chart comparing sales across the 4 sushi brands |
| `src/components/reports/charts/top-products-chart.tsx` | Horizontal ranked bar chart for top 10 best-selling sushi rolls |
| `src/components/reports/reports-kpi-grid.tsx` | High-impact Data Analyst KPI cards (Net Revenue, Operating Profit Margin %, Total Expenses, Orders & AOV, Cash vs Electronic ratio) |
| `src/components/reports/reports-client.tsx` | Unified analytics dashboard layout orchestrating filters, KPIs, charts, and detailed data tables |
| `src/messages/ar.json` + `en.json` | Bilingual keys for chart tooltips, legends, time ranges, and analytical insights |

---

## Task Decomposition

### Task 1: Navigation Bar Layout Fix & Collision Elimination
**Files:**
- Modify: `src/components/layout/dashboard-header.tsx`

- [x] **Step 1:** Add `shrink-0` to brand logo and right-side actions container.
- [x] **Step 2:** Refactor the desktop nav list to use responsive sizing (`px-2 xl:px-3 text-xs xl:text-sm gap-1 xl:gap-1.5`) with `overflow-x-auto` support to guarantee zero wrapping or button overlap at 1024px–1366px screen widths.
- [x] **Step 3:** Optimize user profile and brand text responsiveness on mid-size desktop viewports.
- [x] **Step 4:** Run `npm run typecheck` and verify header layout.
- [x] **Step 5:** Commit: `fix(layout): responsive header navigation spacing and CTA overlap elimination`.

---

### Task 2: Data Analyst KPI Grid with Advanced Financial Metrics & Custom Badges
**Files:**
- Create: `src/components/reports/reports-kpi-grid.tsx`
- Modify: `src/messages/ar.json`, `src/messages/en.json`

- [x] **Step 1:** Implement `ReportsKpiGrid` with:
  - 1. **Net Revenue Card:** High-contrast emerald/primary gradient with gross sales, discounts, and delivery fee breakdown.
  - 2. **Operating Profit & Margin Card:** Dynamic margin calculation `((netProfit / netRevenue) * 100)` with profit health status badge.
  - 3. **Total Expenses Card:** Rose accent badge with ratio of expenses to revenue.
  - 4. **Order Volume & AOV Card:** Total orders, AOV, delivered vs cancelled rate indicator (% cancellation).
  - 5. **Cash vs Electronic Payment Ratio:** Dynamic visual gradient bar comparing Cash vs (Visa + Online) with instant percentage badges.
- [x] **Step 2:** Add all required translation strings in `ar.json` and `en.json`.
- [x] **Step 3:** Run `npm run typecheck`.
- [x] **Step 4:** Commit: `feat(reports): professional data analyst KPI metrics grid and financial health indicators`.

---

### Task 3: Interactive Recharts Visualizations Suite
**Files:**
- Create: `src/components/reports/charts/revenue-trend-chart.tsx`
- Create: `src/components/reports/charts/platform-share-chart.tsx`
- Create: `src/components/reports/charts/brand-performance-chart.tsx`
- Create: `src/components/reports/charts/top-products-chart.tsx`
- Modify: `src/messages/ar.json`, `src/messages/en.json`

- [x] **Step 1: Revenue Trend Chart (`revenue-trend-chart.tsx`):**
  - Area / Composed chart showing daily Net Revenue (gradient area) + Daily Orders (subtle bar or line).
  - Custom themed tooltip with Arabic/English currency formatting and date formatting.
- [x] **Step 2: Platform Market Share Chart (`platform-share-chart.tsx`):**
  - Donut chart with brand colors (`#FF5A00` Talabat, `#E31C24` elmenus, `#00A859` InstaShop, `#BE123C` HarryApp, `#1877F2` Facebook, `#4F46E5` Phone).
  - Center label with total volume/revenue + interactive legend with percentages.
- [x] **Step 3: Brand Portfolio Chart (`brand-performance-chart.tsx`):**
  - Visual comparison bar chart for Flower, Mastery, Niwa, Tobiko with their visual token colors.
- [x] **Step 4: Top Menu Items Ranking Chart (`top-products-chart.tsx`):**
  - Horizontal bar ranking of top selling sushi rolls with quantity and revenue tags.
- [x] **Step 5:** Run `npm run typecheck`.
- [x] **Step 6:** Commit: `feat(reports): interactive data visualizations suite using Recharts`.

---

### Task 4: Complete Dashboard Integration & Data Table Tabs Refinement
**Files:**
- Modify: `src/components/reports/reports-client.tsx`
- Modify: `PROJECT_LOG.md`

- [x] **Step 1:** Integrate the new KPI grid and 4 chart components into `reports-client.tsx` with responsive grid layouts:
  - Top row: Filters + Quick range buttons.
  - Second row: Analytical KPI cards + Payment Method meter.
  - Third row: Revenue Trend Chart (2/3 width) + Platform Market Share Donut (1/3 width).
  - Fourth row: Brand Portfolio Performance (1/2 width) + Top Selling Sushi Rolls (1/2 width).
  - Fifth row: Detailed Data Tables with tabbed view (Daily Breakdown, Matrix, Courier Cash Collections, Full Products Table).
- [x] **Step 2:** Run `npm run typecheck` and `npm run test:e2e` (186/186 tests).
- [x] **Step 3:** Run `npx tsx scripts/verify-phase8.ts` to verify end-to-end calculations.
- [x] **Step 4:** Document in `PROJECT_LOG.md` and commit: `feat(reports): complete professional data analyst analytics dashboard redesign`.

---

## Required Skills & Model

- **Model:** `inherit` (or `pro` for complex refactor and chart visualization coordination).
- **Skills Used:**
  1. `writing-plans` (to author and refine this multi-step implementation plan).
  2. `ui-ux-pro-max` / `frontend-design` (for aesthetic color profiles, chart palettes, typography, and responsive spacing).
  3. `executing-plans` (to execute tasks step-by-step with verification gates).
