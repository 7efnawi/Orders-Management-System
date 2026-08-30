# Phase 9 — User Management & Roles UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full User Management & Role-Based Access Control (`FR-USR-01` … `FR-USR-04`) allowing the `OWNER` to list, create, edit, activate/deactivate users, and manage roles (`OWNER`, `MANAGER`, `CASHIER`) with atomic audit logging and self-demotion/deactivation protection.

**Architecture:** Pure service layer in `src/services/users.ts` with atomic `AuditLog` inside `prisma.$transaction`, role-protected Next.js App Router API routes (`/api/users` & `/api/users/[id]`), role-guarded server page (`/users/page.tsx`), and a high-contrast, responsive client UI with KPI metrics and dialogs.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Prisma 7, Lucide React, Zod, next-intl.

**Spec:** `docs/SRS.md` (`FR-USR-01` … `FR-USR-04`) • `docs/specs/2026-08-25-data-model-design.md`

---

## Subagent Team & Model Configuration

| Subagent Task | Role Title | Model | Key Skills Used |
|---|---|---|---|
| **Task 9.1: Service & Logic** | `Backend & Security Engineer` | `inherit` (Gemini 3.7 Flash) | `tdd`, `domain-modeling` |
| **Task 9.2: API Routes** | `API & Auth Engineer` | `inherit` (Gemini 3.7 Flash) | `tdd`, `codebase-design` |
| **Task 9.3: UI & i18n** | `Frontend & UX Specialist` | `inherit` (Gemini 3.7 Flash) | `ui-ux-pro-max`, `frontend-design` |
| **Task 9.4: Gate & Verification** | `QA & Adversarial Verification Engineer` | `inherit` (Gemini 3.7 Flash) | `tdd`, `diagnosing-bugs` |

---

## Global Constraints

1. **FR-USR-04 (Owner Only Access):** All `/api/users/*` routes and the `/users` page are strictly restricted to `OWNER` (Managers and Cashiers receive `403 Forbidden` / redirect to `/`).
2. **Directives §2 & §3 (Single Source of Truth):** All user mutations pass through `src/services/users.ts` with atomic `AuditLog` entries inside `prisma.$transaction`.
3. **No Hard Delete (Directives §4):** Users cannot be deleted from the database. Deactivation occurs solely via `isActive = false`.
4. **Self-Deactivation & Demotion Guard:** The currently logged-in Owner cannot deactivate their own account or remove their `OWNER` role.
5. **Session Invalidation:** Deactivated accounts (`isActive = false`) cannot log in and have existing requests immediately rejected by `getSessionUser()`.
6. **Bilingual Symmetry:** Complete translations required in `src/messages/ar.json` and `src/messages/en.json` under `users`.

---

## Tasks & Bite-Sized Steps

### Task 9.1: Users Service Layer (`src/services/users.ts`) & F15 E2E Tests

**Files:**
- Modify: `src/services/users.ts`
- Modify: `tests/e2e/tier1-feature-coverage.test.ts`

**Interfaces:**
- Consumes: `prisma`, `audit`, `Role` from `@prisma/client`.
- Produces:
  ```ts
  export interface UserFilter {
    role?: Role;
    isActive?: boolean;
    search?: string;
  }

  export async function listUsers(filters?: UserFilter): Promise<SessionUser[]>;
  export async function createUser(actorUserId: string, input: { name: string; email: string; role: Role }): Promise<SessionUser>;
  export async function updateUser(actorUserId: string, targetUserId: string, data: { name?: string; role?: Role; isActive?: boolean }): Promise<SessionUser>;
  ```

- [x] **Step 1: Write F15 E2E test cases in `tests/e2e/tier1-feature-coverage.test.ts`**
  - F15.1: List users filtering by role and active status.
  - F15.2: Create user with role assignment and duplicate email prevention.
  - F15.3: Prevent self-deactivation of current owner.
  - F15.4: Prevent self-demotion of current owner.
  - F15.5: Inactive user login rejection.
- [x] **Step 2: Implement `listUsers`, `createUser`, and `updateUser` with self-protection logic in `src/services/users.ts`**
- [x] **Step 3: Run `npm run test:e2e` and `npm run typecheck` to verify passing**

---

### Task 9.2: Protected API Routes (`/api/users` & `/api/users/[id]`)

**Files:**
- Create: `src/app/api/users/route.ts`
- Create: `src/app/api/users/[id]/route.ts`

**Interfaces:**
- Consumes: `requireRole("OWNER")`, `listUsers`, `createUser`, `updateUser` from `@/services/users`.
- Produces:
  - `GET /api/users`: Returns `{ users: SessionUser[] }`
  - `POST /api/users`: Body `{ name, email, role }` -> Returns 201 `{ user: SessionUser }`
  - `PATCH /api/users/[id]`: Body `{ name?, role?, isActive? }` -> Returns 200 `{ user: SessionUser }`

- [x] **Step 1: Implement `GET` & `POST` in `src/app/api/users/route.ts` with Zod validation**
- [x] **Step 2: Implement `PATCH` in `src/app/api/users/[id]/route.ts` with error handling**
- [x] **Step 3: Verify TypeScript compilation with `npm run typecheck`**

---

### Task 9.3: User Management UI & Bilingual i18n

**Files:**
- Create: `src/components/users/user-dialog.tsx`
- Create: `src/components/users/users-client.tsx`
- Create: `src/app/[locale]/(dashboard)/users/page.tsx`
- Modify: `src/components/layout/dashboard-header.tsx`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/en.json`

- [x] **Step 1: Add Arabic and English `users` translation keys in `ar.json` and `en.json`**
- [x] **Step 2: Add `/users` navigation item in `src/components/layout/dashboard-header.tsx` (restricted to `OWNER` only)**
- [x] **Step 3: Build `UserDialog` (`src/components/users/user-dialog.tsx`) with form validation and role descriptions**
- [x] **Step 4: Build `UsersClient` (`src/components/users/users-client.tsx`) with KPI cards (Total, Active, Owners, Managers, Cashiers), search/filter controls, status toggles, and edit actions**
- [x] **Step 5: Create protected server page `src/app/[locale]/(dashboard)/users/page.tsx`**
- [x] **Step 6: Verify TypeScript compilation with `npm run typecheck`**

---

### Task 9.4: Automated Verification Script & Quality Gate

**Files:**
- Create: `scripts/verify-phase9.ts`
- Modify: `PROJECT_LOG.md`

- [x] **Step 1: Build `scripts/verify-phase9.ts` simulating full lifecycle:**
  - Create manager and cashier accounts.
  - Test role filtering and search queries.
  - Update user name and change role.
  - Test self-deactivation block on current owner.
  - Test deactivation and verify inactive user authentication failure.
  - Reactivate user and clean up test data.
- [x] **Step 2: Execute `npx tsx scripts/verify-phase9.ts` (100% pass required)**
- [x] **Step 3: Run comprehensive test suite `npm run test:e2e` (all 190+ tests pass)**
- [x] **Step 4: Run typecheck `npm run typecheck` (0 errors)**
- [x] **Step 5: Document Architecture Decision Record (ADR) in `PROJECT_LOG.md`**

---

## Verification Plan

### Automated Tests
```bash
npm run typecheck
npm run test:e2e
npx tsx scripts/verify-phase9.ts
```

### Manual Verification
- Log in as Owner: Verify `/users` appears in the navbar and navigates to the User Management dashboard.
- Create a Manager and Cashier user.
- Toggle active/inactive status and test editing.
- Log in as Manager or Cashier: Verify `/users` is hidden from the navbar and navigating to `/users` redirects to `/`.
