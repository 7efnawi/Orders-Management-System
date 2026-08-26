# Phase 5 — Delivery Management (Drivers + Zones) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the delivery management subsystem allowing managers and owners to configure delivery zones with fees, manage delivery drivers and fleets (OWN, APP, EXTERNAL, PICKUP), and assign/reassign drivers to orders with atomic audit logging.

**Architecture:** Service layer in `src/services/delivery.ts`, guarded API endpoints in `src/app/api/delivery/`, interactive UI in `src/components/delivery/`, and integration into the order dispatch workflow (`OUT_FOR_DELIVERY`).

**Tech Stack:** Next.js 16 (App Router), Prisma 7, React 19, TypeScript, Zod, next-intl, Tailwind CSS v4, shadcn/ui.

**Spec:** `docs/specs/2026-08-25-data-model-design.md`, `docs/SRS.md` (§FR-DEL), `docs/USE_CASES.md` (UC-09, UC-11).

## Global Constraints

- `PROJECT_LOG.md` must be updated on commit with every change (ENGINEERING_DIRECTIVES.md §0).
- Zero business logic in UI components (ENGINEERING_DIRECTIVES.md §2).
- **No Hard Delete** for zones or drivers — `isActive = false` only (ENGINEERING_DIRECTIVES.md §4).
- Zone fee is a single decimal value per zone (stakeholder decision 2026-08-25).
- All mutations must record an `AuditLog` in the exact same database transaction.
- Only `OWNER` and `MANAGER` can create/update zones and drivers; `CASHIER` can assign drivers to orders.
- PowerShell file operations on `src/app/[locale]/` must use `-LiteralPath`.

---

## File Structure & Responsibilities

```
src/
├── services/
│   └── delivery.ts                # CRUD for Zones & Drivers + assignDriverToOrder + audit logging
├── app/
│   └── api/
│       ├── delivery/
│       │   ├── zones/
│       │   │   ├── route.ts        # GET (list), POST (create zone)
│       │   │   └── [id]/route.ts   # PATCH (update name/fee/isActive)
│       │   └── drivers/
│       │       ├── route.ts        # GET (list), POST (create driver)
│       │       └── [id]/route.ts   # PATCH (update name/type/isActive)
│       └── orders/
│           └── [id]/
│               └── driver/route.ts # PATCH (assign/reassign driver to order)
├── components/
│   └── delivery/
│       ├── delivery-client.tsx     # Main tabbed view (Zones & Drivers) with live search
│       ├── zone-dialog.tsx         # Add / Edit Zone modal
│       ├── driver-dialog.tsx       # Add / Edit Driver modal
│       └── assign-driver-dialog.tsx # Fast driver assignment modal for orders
└── app/[locale]/(dashboard)/
    └── delivery/
        └── page.tsx                # Delivery management page (/delivery)
```

---

### Task 1: Delivery Service Layer (`src/services/delivery.ts`)

**Files:**
- Create: `src/services/delivery.ts`
- Create: `scripts/test-delivery-service.ts`

**Interfaces:**
- Consumes: `prisma`, `audit`.
- Produces:
  - `listDeliveryZones(includeInactive?: boolean)`
  - `createDeliveryZone(userId: string, input: { name: string; fee: number })`
  - `updateDeliveryZone(userId: string, zoneId: string, data: { name?: string; fee?: number; isActive?: boolean })`
  - `listDeliveryDrivers(includeInactive?: boolean, type?: DriverType)`
  - `createDeliveryDriver(userId: string, input: { name: string; type: DriverType })`
  - `updateDeliveryDriver(userId: string, driverId: string, data: { name?: string; type?: DriverType; isActive?: boolean })`
  - `assignDriverToOrder(userId: string, orderId: string, driverId: string)`

- [x] **Step 1: Write failing test script in `scripts/test-delivery-service.ts`**
- [x] **Step 2: Implement `src/services/delivery.ts`**
- [x] **Step 3: Run test with `npx tsx scripts/test-delivery-service.ts` and verify it passes**
- [x] **Step 4: Run `npm run typecheck`**
- [x] **Step 5: Update `PROJECT_LOG.md` and commit**

---

### Task 2: Delivery API Endpoints (`/api/delivery/...`)

**Files:**
- Create: `src/app/api/delivery/zones/route.ts`
- Create: `src/app/api/delivery/zones/[id]/route.ts`
- Create: `src/app/api/delivery/drivers/route.ts`
- Create: `src/app/api/delivery/drivers/[id]/route.ts`
- Create: `src/app/api/orders/[id]/driver/route.ts`

**Interfaces:**
- Consumes: `requireApiRole`, `wrapApi`, `services/delivery.ts`.
- Produces: JSON HTTP Endpoints validating input via Zod.

- [x] **Step 1: Implement Zone endpoints (GET / POST / PATCH)**
- [x] **Step 2: Implement Driver endpoints (GET / POST / PATCH)**
- [x] **Step 3: Implement Order Driver Assignment endpoint (PATCH `/api/orders/[id]/driver`)**
- [x] **Step 4: Create and run test script `scripts/test-delivery-api.ts` / `scripts/test-delivery-api-schemas.ts`**
- [x] **Step 5: Run `npm run typecheck` & `npm run lint`**
- [x] **Step 6: Update `PROJECT_LOG.md` and commit**

---

### Task 3: Delivery Management UI (`src/components/delivery/...`)

**Files:**
- Create: `src/components/delivery/zone-dialog.tsx`
- Create: `src/components/delivery/driver-dialog.tsx`
- Create: `src/components/delivery/delivery-client.tsx`
- Create: `src/app/[locale]/(dashboard)/delivery/page.tsx`
- Modify: `src/messages/ar.json`, `src/messages/en.json` (namespace `delivery`)

**Interfaces:**
- Consumes: `/api/delivery/zones`, `/api/delivery/drivers`.
- Produces: Interactive management dashboard for Zones & Drivers.

- [x] **Step 1: Add translations to `src/messages/ar.json` & `en.json`**
- [x] **Step 2: Build `zone-dialog.tsx` and `driver-dialog.tsx`**
- [x] **Step 3: Build `delivery-client.tsx` with tabs, tables, status switches, and quick filters**
- [x] **Step 4: Build page wrapper `src/app/[locale]/(dashboard)/delivery/page.tsx`**
- [x] **Step 5: Run `npm run typecheck` & `npm run lint`**
- [x] **Step 6: Update `PROJECT_LOG.md` and commit**

---

### Task 4: Order Dispatch Driver Assignment Integration

**Files:**
- Create: `src/components/delivery/assign-driver-dialog.tsx`
- Modify: `src/components/orders/orders-table.tsx`

**Interfaces:**
- Consumes: `/api/orders/[id]/driver`, `/api/delivery/drivers`.
- Produces: Seamless modal workflow when advancing order to `OUT_FOR_DELIVERY` prompting to pick a driver if unassigned.

- [x] **Step 1: Build `assign-driver-dialog.tsx`**
- [x] **Step 2: Integrate driver assignment button & `OUT_FOR_DELIVERY` prompt in `orders-table.tsx`**
- [x] **Step 3: Run `npm run typecheck` & `npm run lint`**
- [x] **Step 4: Update `PROJECT_LOG.md` and commit**

---

### Task 5: Automated Verification Gate & PROJECT_LOG Update

**Files:**
- Create: `scripts/verify-phase5.ts`
- Modify: `PROJECT_LOG.md`

- [ ] **Step 1: Write and run verification script `scripts/verify-phase5.ts` simulating full zone, driver, and order dispatch lifecycle**
- [ ] **Step 2: Run `npm run typecheck`, `npm run lint`, and `npm run build`**
- [ ] **Step 3: Update `PROJECT_LOG.md` with Phase 5 Completion ADR entry**
- [ ] **Step 4: Update `docs/plans/2026-08-26-phase5-delivery-plan.md` marking all steps complete**
- [ ] **Step 5: Final Commit**
