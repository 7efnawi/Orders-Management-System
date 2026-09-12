# Phase 11: Customer Database, CRM & Customer Profile Implementation Plan
# خطة تنفيذ المرحلة 11: قاعدة بيانات العملاء وسجل النشاط وبروفايل العميل

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Follow TDD: Red -> Green -> Commit for every single task.

**Goal:** بناء نظام متكامل لإدارة العملاء وسجل النشاط وبروفايل العميل (Customer Database & CRM) لمطبخ السوشي، يتيح للكاشير والمدير والمالك البحث اللحظي، استعراض وتعديل بيانات وملاحظات العملاء، فحص سجل الطلبات التاريخي، رصد وفلترة "الطلبات المشاكل" (الملغية أو التي بها شكاوى توصيل وجودة)، وتتبع شرائح الولاء والقيمة الإجمالية للعميل (LTV / AOV).

**Architecture:**
- **Domain & Services (`src/services/customers.ts` & `src/lib/customers.ts`):** دوال حسابية نقية لتحديد شرائح ولاء العميل (New vs Returning، وBronze/Silver/Gold/Platinum)، عزل الطلبات التي واجهت مشاكل، حساب إجمالي الإنفاق ومتوسط قيمة الطلب (AOV)، وعمليات قاعدة البيانات للترقيم والفلترة وتحديث الملاحظات مع تسجيل الأحداث في `AuditLog`.
- **API Layer (`src/app/api/customers/`):** مسارات REST محمية بـ `requireApiRole("OWNER", "MANAGER", "CASHIER")` للبحث المرقم وجلب البروفايل الشامل وتحديث الملاحظات.
- **UI Components (`src/components/customers/`):** لوحة تحكم CRM تنفيذية تضم 4 بطاقات مؤشرات (KPIs)، شريط بحث وفلترة ذكي، جدول عملاء متناظر وثابت الأبعاد (`table-fixed`)، وصفحة بروفايل تفصيلية لكل عميل تضم تنبيه الطلبات المشاكل، محرر الملاحظات السريع، وسجل الطلبات التاريخي.
- **Strict TDD & Quality Gates:** دورة Red -> Green -> Commit الصارمة، اختبارات الميزة F17.1-F17.6، اختبارات E2E، فحص الأنواع 0 أخطاء، وسكربت التحقق الآلي المخصص للمرحلة `scripts/verify-phase11.ts`.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind v4, shadcn/ui, Prisma 7, Supabase Postgres, next-intl (AR/EN RTL/LTR), Lucide Icons.

**Spec Reference:**
- `docs/SRS.md` (§FR-CUST: FR-CUST-01 through FR-CUST-08)
- `docs/USE_CASES.md` (UC-12: عرض داشبورد العميل)
- `docs/specs/2026-08-25-data-model-design.md` (Customer Entity)
- `AGENTS.md` & `ENGINEERING_DIRECTIVES.md` (No logic in UI, audit trail in transactions, typecheck must pass, update PROJECT_LOG.md in same commit).

---

## Global Constraints
- كل تعديل على بيانات العميل أو ملاحظاته يجب أن يُسجل في `AuditLog` داخل نفس المعاملة (Transaction).
- **ممنوع الحذف النهائي (No Hard Delete)** للعملاء نهائياً: سجلات العملاء تشغيلية دائمة ومرتبطة بسجلات الأوردرات القديمة.
- أرقام الهواتف فريدة ويتم عرضها دائماً داخل وسام معزول الاتجاه `dir="ltr"` لمنع أي تشوه بصري في اتجاه الـ RTL.
- اللغة العربية هي التجربة الافتراضية مع خط Cairo وتناظر كامل للمفاتيح في `src/messages/ar.json` و `en.json`.
- الحفاظ الصارم على قاعدة عدم تداخل شريط التنقل (Zero-Overlap Invariant) في كافة مقاسات الشاشات.
- اجتياز `npm run typecheck` و `npm run test:e2e` إجباري قبل أي commit.

---

## Proposed Changes & Task Decomposition

### Task 11.1: Customer Domain Logic & Service Layer (TDD)
**Files:**
- Modify: `src/services/customers.ts`
- Create: `src/lib/customers.ts`
- Test: `tests/e2e/tier1-feature-coverage.test.ts` (Feature 17)

**Interfaces:**
- `calculateCustomerStats(orders: Order[]): CustomerMetrics`
- `determineLoyaltyTier(totalOrders: number, totalSpent: number): LoyaltyTierInfo`
- `identifyProblemOrders(orders: Order[]): ProblemOrderSummary`
- `listCustomers(params: CustomerQueryParams): Promise<CustomerListResult>`
- `getCustomerProfile(id: string): Promise<CustomerProfileResult | null>`
- `updateCustomerNotes(id: string, notes: string, actorId: string): Promise<Customer>`

- [ ] **Step 1: Write failing tests for Feature 17 in `tests/e2e/tier1-feature-coverage.test.ts`**
  - `F17.1`: `determineLoyaltyTier` classifies first-time (`totalOrders <= 1`) vs returning (`totalOrders > 1`), and loyalty tiers: Bronze (1-4), Silver (5-14), Gold (15-29), Platinum (30+).
  - `F17.2`: `calculateCustomerStats` computes lifetime spent, average order value (AOV), last order date, and preferred brand.
  - `F17.3`: `identifyProblemOrders` flags cancelled orders and orders with delivery/quality issues.
  - `F17.4`: `formatCustomerPhone` normalizes Egyptian phone numbers and ensures direction-safe LTR output.
  - `F17.5`: Customer service exports zero delete functions (immutability of customer records).
- [ ] **Step 2: Run `npm run test:e2e` to verify Red phase.**
- [ ] **Step 3: Implement `src/lib/customers.ts`** with pure domain calculations (loyalty tier, problem order detection, customer metrics, phone formatting).
- [ ] **Step 4: Expand `src/services/customers.ts`** with `listCustomers`, `getCustomerProfile`, and `updateCustomerNotes` (with audit logging).
- [ ] **Step 5: Run `npm run test:e2e` and `npm run typecheck` (Green phase).**
- [ ] **Step 6: Update `PROJECT_LOG.md` and commit:**
  `feat(customers): implement customer domain calculations, CRM service layer, and F17 tests`

---

### Task 11.2: Customer API Endpoints & Role-Based Security
**Files:**
- Create: `src/app/api/customers/route.ts`
- Create: `src/app/api/customers/[id]/route.ts`
- Test: `tests/e2e/tier1-feature-coverage.test.ts` (F17.6)

**Interfaces:**
- `GET /api/customers`: query params (`page`, `limit`, `search`, `tier`, `hasProblems`), returns `{ customers, total, page, totalPages, stats }`.
- `GET /api/customers/[id]`: returns full customer profile with order history and problem orders.
- `PATCH /api/customers/[id]`: body `{ notes, address, name }`, updates record, logs audit entry, returns updated customer.

- [ ] **Step 1: Write failing test `F17.6` in `tests/e2e/tier1-feature-coverage.test.ts`**
  - Verify API query schema validation with Zod.
  - Verify that `DELETE /api/customers` returns 405 Method Not Allowed.
  - Verify role access rules (accessible by OWNER, MANAGER, CASHIER).
- [ ] **Step 2: Run `npm run test:e2e` to verify Red phase.**
- [ ] **Step 3: Implement `src/app/api/customers/route.ts`** with Zod schema validation, RBAC check, and pagination.
- [ ] **Step 4: Implement `src/app/api/customers/[id]/route.ts`** for GET profile and PATCH notes/address.
- [ ] **Step 5: Run `npm run test:e2e` and `npm run typecheck` (Green phase).**
- [ ] **Step 6: Update `PROJECT_LOG.md` and commit:**
  `feat(customers): implement customer CRM API routes with role validation and audit integration`

---

### Task 11.3: Bilingual Translations & Internationalization
**Files:**
- Modify: `src/messages/ar.json`
- Modify: `src/messages/en.json`
- Test: `tests/e2e/tier3-cross-feature.test.ts` (C7.19)

- [ ] **Step 1: Write failing test `C7.19` in `tests/e2e/tier3-cross-feature.test.ts`**
  - Verify symmetrical `customers` translation keys in `ar.json` and `en.json`.
- [ ] **Step 2: Run `npm run test:e2e` to verify Red phase.**
- [ ] **Step 3: Add `customers` namespace to `src/messages/ar.json` and `src/messages/en.json`**
  - Title, subtitle, KPIs (total customers, new this month, returning/VIP, average spend).
  - Tiers: Bronze, Silver, Gold, Platinum, New, Returning.
  - Profile fields: phone, address, notes, order history, problem orders, favorite brand, last order.
  - Action buttons: save notes, view profile, call, search placeholder.
- [ ] **Step 4: Run `npm run test:e2e` and `npm run typecheck` (Green phase).**
- [ ] **Step 5: Update `PROJECT_LOG.md` and commit:**
  `feat(customers): add bilingual translation dictionaries for customer CRM module`

---

### Task 11.4: Customer Directory & CRM Dashboard UI (`/customers`)
**Files:**
- Create: `src/components/customers/customers-client.tsx`
- Create: `src/components/customers/customer-filter-bar.tsx`
- Create: `src/components/customers/customer-table.tsx`
- Create: `src/components/customers/customer-kpi-cards.tsx`
- Create: `src/app/[locale]/(dashboard)/customers/page.tsx`
- Modify: `src/components/layout/dashboard-header.tsx`

- [ ] **Step 1: Write failing test `C7.20` in `tests/e2e/tier3-cross-feature.test.ts`**
  - Verify customer table layout uses `table-fixed` and direction-safe phone chips.
  - Verify `/customers` route is accessible to all operational roles and present in navbar.
- [ ] **Step 2: Run `npm run test:e2e` to verify Red phase.**
- [ ] **Step 3: Build `customer-kpi-cards.tsx`** with 4 executive KPI cards (Total Customers, New Customers, VIP/Loyal, Average Lifetime Spend).
- [ ] **Step 4: Build `customer-filter-bar.tsx`** with search input (name/phone), loyalty tier dropdown, and problem order filter toggle.
- [ ] **Step 5: Build `customer-table.tsx`** with fixed column widths, LTR phone chips, VIP badges, and quick actions.
- [ ] **Step 6: Build `customers-client.tsx` and server page `customers/page.tsx`**.
- [ ] **Step 7: Add `/customers` link to `dashboard-header.tsx`** preserving zero-overlap layout.
- [ ] **Step 8: Run `npm run test:e2e` and `npm run typecheck` (Green phase).**
- [ ] **Step 9: Update `PROJECT_LOG.md` and commit:**
  `feat(customers): implement customer directory dashboard, filters, table, and navigation`

---

### Task 11.5: Detailed Customer Profile & Problem Orders Inspector (`/customers/[id]`)
**Files:**
- Create: `src/components/customers/customer-profile-client.tsx`
- Create: `src/components/customers/customer-notes-editor.tsx`
- Create: `src/components/customers/customer-order-history-table.tsx`
- Create: `src/components/customers/customer-problem-orders-banner.tsx`
- Create: `src/app/[locale]/(dashboard)/customers/[id]/page.tsx`

- [ ] **Step 1: Write failing test `C7.21` in `tests/e2e/tier3-cross-feature.test.ts`**
  - Verify customer profile displays problem orders callout and order history.
- [ ] **Step 2: Run `npm run test:e2e` to verify Red phase.**
- [ ] **Step 3: Build `customer-problem-orders-banner.tsx`**: distinctive warning card highlighting any cancelled or delivery/quality issue orders.
- [ ] **Step 4: Build `customer-notes-editor.tsx`**: inline editable notes with optimistic updates and instant save.
- [ ] **Step 5: Build `customer-order-history-table.tsx`**: complete list of past orders with status badges, dates, amounts, and quick view details.
- [ ] **Step 6: Build `customer-profile-client.tsx` and server page `customers/[id]/page.tsx`**.
- [ ] **Step 7: Run `npm run test:e2e` and `npm run typecheck` (Green phase).**
- [ ] **Step 8: Update `PROJECT_LOG.md` and commit:**
  `feat(customers): implement comprehensive customer profile with problem orders inspector and notes editor`

---

### Task 11.6: Automated Phase 11 Verification Script & Full Quality Gate
**Files:**
- Create: `scripts/verify-phase11.ts`

- [ ] **Step 1: Implement `scripts/verify-phase11.ts`** covering:
  1. Auto-creation of customer on order creation (`FR-CUST-02`).
  2. Phone number auto-lookup & duplicate prevention (`FR-CUST-01`, `FR-CUST-03`).
  3. Loyalty tier & lifetime calculation correctness (`FR-CUST-06`).
  4. Problem order detection (`FR-CUST-05`).
  5. Customer profile retrieval and order history completeness (`FR-CUST-04`).
  6. Notes editing & audit log entry generation (`FR-CUST-08`).
  7. RBAC & immutability verification (no hard delete, 405 on DELETE).
- [ ] **Step 2: Run `npx tsx scripts/verify-phase11.ts`** and ensure 100% pass.
- [ ] **Step 3: Run full quality gates:**
  - `npm run typecheck` (0 errors)
  - `npm run test:e2e` (100% pass across all tiers)
  - `npm run build` (Turbopack production build)
- [ ] **Step 4: Update `PROJECT_LOG.md` with Phase 11 completion ADR.**
- [ ] **Step 5: Commit:**
  `feat(customers): add automated phase 11 verification script and complete phase 11`

---

## Verification Plan
### Automated Tests:
- `npm run test:e2e` -> All 220+ tests pass.
- `npx tsx scripts/verify-phase11.ts` -> 7/7 verification checks pass.
- `npm run typecheck` -> 0 TypeScript errors.
- `npm run build` -> Clean build of all routes.

### Manual Verification Checklist:
1. Open `/customers`: Verify KPI cards, search by phone, filter by loyalty tier.
2. Click any customer: Open `/customers/[id]`, inspect details, edit notes, and see problem order warnings.
3. Test RTL layout in Arabic and LTR layout in English.
4. Verify navbar layout on mobile, tablet, and desktop viewports.
