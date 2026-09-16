<div align="center">

# 🍣 Order Control System

**A production-grade, real-time order management system built for multi-brand dark kitchen operations.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-373%2B_Passed-brightgreen)](#-testing--quality-gates)
[![License](https://img.shields.io/badge/License-Private-red)]()

<br/>

**4 Virtual Brands** · **6 Ordering Platforms** · **3 User Roles** · **100% Delivery** · **Bilingual AR/EN RTL**

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Workflows & Diagrams](#-core-workflows--operational-diagrams)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Testing & Quality Gates](#-testing--quality-gates)
- [Internationalization](#-internationalization)
- [Scripts Reference](#-scripts-reference)
- [Design Principles](#-design-principles)

---

## 🎯 Overview

Order Control System is a comprehensive web application designed to replace fragmented Google Sheets workflows with a centralized, real-time operational platform for a sushi dark kitchen. The system manages the entire order lifecycle — from POS entry to kitchen preparation, delivery dispatch, and financial reconciliation — across **4 virtual restaurant brands** and **6 ordering platforms**.

### The Dark Kitchen Model

> A **dark kitchen** (cloud kitchen / ghost kitchen) operates exclusively for delivery — no dine-in, no takeaway, no pickup counters. Every operation is 100% delivery-focused, which shapes every design decision in this system.

| Brands | Platforms |
|:---:|:---:|
| 🌸 Flower Sushi | 📱 Talabat |
| 🎭 Mastery Sushi | 🛒 InstaShop |
| 🌿 Niwa Sushi | 📲 Harry App |
| 🐡 Tobiko Sushi | 🍽️ Elmenus |
| | 📘 Facebook |
| | 📞 Phone |

---

## ✨ Key Features

### 🏪 POS & Order Management
- **High-speed order entry** optimized for cashiers during rush hours (< 30 seconds per order)
- **Deterministic state machine** with strict unidirectional flow: `NEW → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED`
- **Auto-generated sequential order numbers** (`ORD-YYYYMMDD-XXXX`) with PostgreSQL advisory locks for concurrency safety
- **Smart customer lookup** by phone — auto-fills existing records or creates new customers on the fly
- **Kitchen Kanban board** with live preparation timers and overdue alerts

### 💰 Financial Engine
- **Zero-drift financial calculations** — the `totalCash + totalVisa + totalOnline === totalRevenue` identity is fuzz-tested with 10,000+ random orders
- **Shift opening/closing** with real-time cash drawer reconciliation
- **Discount workflow** with mandatory reason, manager/owner approval, and full audit trail
- **Delivery fee automation** — if driver is `APP` fleet, delivery fee is deterministically zeroed

### 📊 Analytics & Reporting
- **Interactive dashboards** with role-filtered KPIs (Cashier, Manager, Owner views)
- **Sales breakdown** by platform, brand, payment method, and time period
- **Top products leaderboard** with quantity-ranked horizontal bar charts
- **Peak hours heatmap** (7 days × 24 hours) for operational planning
- **Employee performance reports** with per-cashier order and revenue metrics
- **Native Excel `.xlsx` export** via `exceljs` — real spreadsheets with RTL, KPI cards, formulas, and pastel styling
- **Executive PDF reports** with A4 layout, signatures, and print-optimized rendering

### 👥 Customer CRM
- **RFM behavioral segmentation** — VIP, Regular, New, At Risk, Inactive (no gamified points)
- **Customer profiles** with order history, favorite products, preferred platform, delivery zone, and problem order tracking
- **One-click favorites** embedded in the POS form for returning customers

### 🔐 Security & Audit
- **Three-tier RBAC** (Owner, Manager, Cashier) enforced on every API route via `requireRole()`
- **Immutable audit trail** — every order mutation, discount, and status change is recorded with before/after JSON diffs
- **No hard deletes** — cancellation with mandatory reason only; lookups deactivated via `isActive = false`
- **Natural language Arabic diff viewer** for the owner to inspect exactly what changed

### 🌍 Internationalization
- **Native bilingual** Arabic (RTL, default) and English (LTR)
- **15 translation namespaces** with strict symmetry enforcement — zero `MISSING_MESSAGE` errors
- **Seamless language switching** that preserves current route and state

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router, Turbopack) | 16.3 |
| **UI Library** | React | 19 |
| **Language** | TypeScript (strict mode) | 5 |
| **Styling** | Tailwind CSS + shadcn/ui + Radix UI | v4 |
| **Database** | PostgreSQL (Supabase) | — |
| **ORM** | Prisma (Pg Adapter) | 7 |
| **Auth** | Supabase Auth (Email/Password) | — |
| **i18n** | next-intl | 4 |
| **Forms** | React Hook Form + Zod | 7 / 4 |
| **Charts** | Recharts | 3 |
| **Excel Export** | exceljs | 4 |
| **Browser Testing** | Playwright | 1.63 |
| **Theming** | next-themes (Light/Dark/System) | — |
| **Notifications** | Sonner (Toast) | — |

---

## 🏗 Architecture

### System Architecture Diagrams

#### C4 Level 1: System Context
![C4 Level 1 System Context](docs/Charts/C4%20Level%201%20System%20Context.png)

#### C4 Level 2: Containers & Layered Architecture
![C4 Level 2 Containers](docs/Charts/C4%20Level%202%20Containers.png)

### Strict Separation of Concerns

```
┌──────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│           React Components (82 files)                        │
│         Display only — zero business logic                   │
├──────────────────────────────────────────────────────────────┤
│                     API Routes Layer                         │
│        40 route handlers under src/app/api/                  │
│   First line: requireRole() — RBAC gate on every route       │
├──────────────────────────────────────────────────────────────┤
│                    Services Layer                            │
│           src/services/ — Database access                    │
│     Prisma transactions, atomic audit logging                │
├──────────────────────────────────────────────────────────────┤
│                  Business Logic Layer                        │
│             src/lib/ — Pure functions                        │
│    State machine, calculations, RFM engine                   │
├──────────────────────────────────────────────────────────────┤
│                     Data Layer                               │
│         PostgreSQL (Supabase) + Prisma ORM                   │
│        15 models, 7 enums, RLS enabled                       │
└──────────────────────────────────────────────────────────────┘
```

### Single Source of Truth

| Concern | Location | Description |
|---|---|---|
| Order State Transitions | `src/lib/orderStateMachine.ts` | Unidirectional status flow with `assertTransition()` |
| Audit Logging | `src/lib/audit.ts` | Invoked within the same Prisma transaction |
| Authorization | `src/lib/auth.ts` | `requireRole()` on the first line of every API route |
| Financial Calculations | `src/lib/closing.ts` | Shift summaries, cash reconciliation |
| Customer Segmentation | `src/lib/customers.ts` | RFM engine with 5 behavioral tiers |

---

## 🔄 Core Workflows & Operational Diagrams

### 1. Order State Machine Flow
Strict unidirectional progression from order creation to final delivery, with mandatory cancellation reasons and app fleet delivery fee zeroing:

![Order State Machine](docs/Charts/Order%20State%20Machine.png)

### 2. Rush Hour Concurrency & Advisory Locking Sequence
How PostgreSQL advisory transaction locks (`pg_advisory_xact_lock`) eliminate race conditions and collisions during simultaneous order creations:

![Advisory Lock Sequence](docs/Charts/Advisory%20Lock%20Sequence.png)

### 3. Zero-Drift Financial Accounting Flow
End-to-end financial calculation pipeline from item pricing up to the cash drawer closing reconciliation (`netCash = totalCash - totalExpenses`):

![Zero-Drift Financial Flow](docs/Charts/Zero-Drift%20Financial%20Flow.png)

### 4. Kitchen Kanban Line Flow
Real-time preparation stages tracked on the kitchen expeditor tablet with overdue timer pulses:

![Kitchen Kanban Flow](docs/Charts/Kitchen%20Kanban%20Flow.png)

---

## 🗄 Database Schema

**15 Models** with **7 Enums** managed by Prisma 7:

![Entity-Relationship Diagram](docs/Charts/Entity-Relationship%20%E2%80%94%20ERD.png)

### Enums

| Enum | Values |
|---|---|
| `Role` | `OWNER` · `MANAGER` · `CASHIER` |
| `OrderStatus` | `NEW` → `CONFIRMED` → `PREPARING` → `READY` → `OUT_FOR_DELIVERY` → `DELIVERED` · `CANCELLED` |
| `PaymentMethod` | `CASH` · `VISA` · `ONLINE` |
| `DriverType` | `OWN` · `APP` · `EXTERNAL` · `PICKUP` |
| `DiscountStatus` | `NONE` · `PENDING` · `APPROVED` · `REJECTED` |
| `CancelReason` | `CUSTOMER_CHANGED_MIND` · `DELIVERY_ISSUE` · `QUALITY_ISSUE` · `NO_ANSWER` · `ITEM_UNAVAILABLE` · `OTHER` |
| `AuditAction` | `CREATE` · `UPDATE` · `CANCEL` · `STATUS_CHANGE` · `DISCOUNT_REQUEST` · `DISCOUNT_APPROVE` · `DISCOUNT_REJECT` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- A **Supabase** project (free tier works)

### 1. Clone & Install

```bash
git clone <repo-url>
cd "Orders Management System"
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in your Supabase credentials:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

# Owner Bootstrap (optional — first login auto-registers as Owner)
OWNER_EMAIL=""
```

### 3. Initialize Database

```bash
npx prisma migrate dev --name init
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the system defaults to Arabic RTL.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── [locale]/(dashboard)/     # Authenticated app shell (ar/en)
│   │   ├── audit/                # Audit log inspector & diff viewer
│   │   ├── closing/              # Shift management & daily reconciliation
│   │   ├── customers/            # Customer CRM & RFM segmentation
│   │   ├── delivery/             # Driver & zone management
│   │   ├── expenses/             # Expense entry & category types
│   │   ├── menu/                 # Brand-filtered product catalog
│   │   ├── orders/               # POS entry, list view & kitchen Kanban
│   │   ├── reports/              # Analytics, charts, exports
│   │   └── users/                # RBAC user management (Owner only)
│   ├── api/                      # 40 REST API routes (outside i18n)
│   └── [locale]/login/           # Authentication page
├── components/                   # 82 React UI components
│   ├── audit/                    # Audit table, diff dialog, filters
│   ├── closing/                  # Shift cards, closing modals
│   ├── customers/                # Directory, profile, KPI cards
│   ├── dashboard/                # Role-specific dashboard views
│   ├── orders/                   # POS form, Kanban board, tickets
│   ├── reports/                  # Analytics client, charts, tabs
│   └── ui/                       # 16 shadcn/ui design primitives
├── lib/                          # Pure business logic (16 modules)
│   ├── orderStateMachine.ts      # Status transition engine
│   ├── closing.ts                # Financial calculation formulas
│   ├── customers.ts              # RFM segmentation engine
│   ├── audit.ts                  # Centralized audit dispatcher
│   ├── auth.ts                   # RBAC server helper
│   └── reportsExcel.ts           # Native .xlsx workbook generator
├── services/                     # Database access layer (10 modules)
│   ├── orders.ts                 # Order CRUD with advisory locks
│   ├── closing.ts                # Shift & daily closing operations
│   ├── customers.ts              # Customer aggregations & RFM
│   └── reports.ts                # High-performance analytics queries
├── messages/                     # Translations (ar.json & en.json)
├── i18n/                         # Internationalization config
└── proxy.ts                      # Next.js 16 middleware (i18n + auth)
```

---

## 📡 API Reference

**40 API routes** organized across 12 resource domains:

| Domain | Routes | Key Operations |
|---|:---:|---|
| **Auth** | 2 | Login, Sign out |
| **Orders** | 6 | CRUD, status transitions, discount workflow, driver assignment |
| **Menu** | 6 | Brands, categories (with reorder), products |
| **Customers** | 4 | Directory, profile, search, `.xlsx` export |
| **Shifts** | 5 | Open, close, preview, reopen, current status |
| **Closing** | 2 | Daily closing records |
| **Reports** | 3 | Sales analytics, employees, peak hours |
| **Expenses** | 4 | Expense entries, expense types |
| **Delivery** | 4 | Drivers, zones |
| **Users** | 2 | User management (Owner only) |
| **Audit** | 1 | Immutable audit log (Owner only) |
| **Lookups** | 1 | Cached reference data |

> Every API route enforces `requireRole()` as its first line. Unauthorized access returns `401` (unauthenticated) or `403` (insufficient role). Mutation endpoints on audit logs and customer records return `405 Method Not Allowed`.

---

## 🧪 Testing & Quality Gates

A comprehensive **5-pillar testing suite** with **373+ automated tests** — all passing at 100%.

### Test Pillars

| Pillar | Scope | Tests | Command |
|---|---|:---:|---|
| **1. Business Logic** | State machine, calculations, 17 features, boundary cases, cross-feature matrix, real-world scenarios | 245 | `npm run test:e2e` |
| **2. Browser E2E** | Playwright with real Chromium — auth, POS, Kanban, closing, audit, CRM, reports, i18n | 47 | `npm run test:pw` |
| **3. API Security** | RBAC penetration across 16 endpoints (401/403 enforcement) + no-hard-delete immutability | 70 | `npm run test:security` |
| **4. Financial Fuzzing** | 10,000 random orders, 100,000 float rounding tests, 500 shift cross-validations | 3 suites | `npm run test:stress` |
| **5. Concurrency & NFR** | Rush hour advisory locks, tablet viewport, NFR performance benchmarks | 11 | `npm run test:stress` |

### Performance Benchmarks (NFR Compliance)

| Metric | Measured | Threshold | Status |
|---|:---:|:---:|:---:|
| Dashboard Overview | ~411ms | < 2,000ms | ✅ |
| 30-day Reports Aggregation | ~438ms | < 3,000ms | ✅ |
| Daily Closings Query | ~219ms | < 3,000ms | ✅ |
| Customer CRM + RFM | ~162ms | < 1,500ms | ✅ |
| 10,000 Financial Calculations | 10.3ms | < 200ms | ✅ |

### Run All Tests

```bash
# Run the complete 5-pillar quality gate
npm run test:all

# Or run individual pillars:
npm run test:e2e          # Business logic (245 tests)
npm run test:security     # RBAC + immutability (70 tests)
npm run test:stress       # Financial fuzzing + concurrency + NFR (10 tests)
npm run test:pw           # Browser E2E — Arabic RTL
npm run test:pw:en        # Browser E2E — English LTR
npm run test:pw:tablet    # Tablet responsive (iPad Pro 11)
```

---

## 🌍 Internationalization

Fully bilingual with **15 translation namespaces** and strict symmetry enforcement:

| Namespace | Coverage |
|---|---|
| `common` | Global buttons, loading states, form labels |
| `auth` | Login/logout, error codes, greeting strings |
| `orders` | Full POS form, statuses, payment methods, Kanban, receipt preview |
| `customers` | CRM directory, RFM badges, profile sections, favorites |
| `reports` | Analytics, KPI grid, chart labels, print/export modals |
| `closing` | Shift management, cash reconciliation, closing history |
| `audit` | Audit trail table, filter bar, Arabic diff viewer |
| `dashboard` | Role-specific dashboards (Cashier, Manager, Owner) |
| `menu` · `delivery` · `expenses` · `users` · `nav` · `roles` · `theme` | Domain-specific strings |

> **Invariant:** Every `t("key")` call must have a matching entry in both `ar.json` and `en.json`. This is verified by automated tests.

---

## 📜 Scripts Reference

| Script | Description |
|---|---|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Production build (Turbopack) — fails if typecheck fails |
| `npm run typecheck` | `tsc --noEmit` — mandatory gate before every commit |
| `npm run lint` | ESLint (flat config) |
| `npm run test:e2e` | Business logic tests (245 tests across 4 tiers) |
| `npm run test:security` | RBAC penetration + immutability (70 tests) |
| `npm run test:stress` | Financial fuzzing + concurrency + NFR benchmarks |
| `npm run test:pw` | Playwright browser tests (Arabic RTL) |
| `npm run test:pw:tablet` | Tablet responsive tests (iPad Pro 11) |
| `npm run test:all` | **Complete 5-pillar quality gate** (373+ tests) |

---

## 🧱 Design Principles

### Architectural Invariants

1. **Zero Business Logic in UI** — calculations in `src/lib/`, database access in `src/services/`, components only render and dispatch.

2. **No Hard Deletes** — orders are cancelled with mandatory reason; lookup tables use `isActive = false`. The `DELETE` HTTP method returns `405` on protected resources.

3. **Native Excel Only** — all Excel exports produce real `.xlsx` files via `exceljs` with RTL direction, executive KPI cards, pastel styling, and phone numbers formatted as text to preserve leading zeros. No `.csv` when Excel is requested.

4. **100% Delivery, Zero Points** — the dark kitchen model has no pickup, takeaway, or dine-in. Customer loyalty is measured by actual behavioral segmentation (RFM), not gamified points.

5. **Atomic Audit Trail** — every write operation on orders goes through `src/services/orders.ts`, which invokes `audit()` within the same Prisma `$transaction`. Direct Prisma calls from pages or routes are forbidden.

6. **Concurrency-Safe Sequencing** — order number generation uses PostgreSQL advisory locks (`pg_advisory_xact_lock`) to prevent collisions during rush hours with 10+ simultaneous order creations.

### UI Standards

- **Container:** `max-w-[1536px]` with `p-4 sm:p-6 lg:p-8`
- **Input Heights:** Unified `h-10` with `≥ 44px` touch targets
- **Tables:** `table-fixed w-full` with percentage columns summing to 100%
- **Numbers:** `font-mono tabular-nums` for financial alignment
- **Responsive:** Tablet-first (iPad Pro 11) with flexbox containment (`min-w-0`)

---

## 📚 Documentation & Engineering Blueprints

All architectural, operational, and API specifications are available in dual format: interactive Markdown (`.md`) and executive styled PDF (`.pdf`) for printing:

| Document | Format | Description |
|---|:---:|---|
| **System Architecture** | [`Markdown`](docs/ARCHITECTURE.md) · [`PDF`](docs/PDFs/ARCHITECTURE.pdf) | C4 Context/Container diagrams, state machine, concurrency locking & financial flows |
| **Operations Field Manual** | [`Markdown`](docs/OPERATIONS_MANUAL.md) · [`PDF`](docs/PDFs/OPERATIONS_MANUAL.pdf) | Step-by-step runbooks for Cashier POS, Kitchen Expeditor/Kanban, Shift Manager & Owner |
| **REST API Specification** | [`Markdown`](docs/API_REFERENCE.md) · [`PDF`](docs/PDFs/API_REFERENCE.pdf) | 40 REST endpoints, Zod input/output schemas, error codes & security invariants |
| **Database Schema & Dictionary** | [`Markdown`](docs/DATA_DICTIONARY.md) · [`PDF`](docs/PDFs/DATA_DICTIONARY.pdf) | Complete catalog of 15 Prisma models, 7 enums, constraints, relations & B-Tree indexes |
| **Cloud Deployment & DevOps** | [`Markdown`](docs/DEPLOYMENT_GUIDE.md) · [`PDF`](docs/PDFs/DEPLOYMENT_GUIDE.pdf) | Vercel Edge hosting, Supabase pooling (:6543 vs :5432), PITR backups & disaster recovery |
| **5-Pillar Testing Report** | [`Markdown`](docs/TESTING_REPORT.md) · [`PDF`](docs/PDFs/TESTING_REPORT.pdf) | Comprehensive report on 373+ passing tests: logic, security, fuzzing & performance |
| **Software Requirements (SRS)** | [`Markdown`](docs/SRS.md) · [`PDF`](docs/PDFs/SRS.pdf) | Baseline functional requirements and dark kitchen operational scope |
| **Use Cases Specification** | [`Markdown`](docs/USE_CASES.md) · [`PDF`](docs/PDFs/USE_CASES.pdf) | Detailed use case narratives and interaction scenarios |
| **Non-Functional Requirements** | [`Markdown`](docs/NON_FUNCTIONAL_REQUIREMENTS.md) · [`PDF`](docs/PDFs/NON_FUNCTIONAL_REQUIREMENTS.pdf) | Latency, throughput, security, accessibility & uptime requirements |
| **Architecture Decision Record** | [`PROJECT_LOG.md`](PROJECT_LOG.md) | Continuous ADR tracking every architectural decision across development |

---

<div align="center">

**Built with ❤️ for dark kitchen operations**

*133 commits · 176 source files · 82 components · 40 API routes · 373+ tests*

</div>
