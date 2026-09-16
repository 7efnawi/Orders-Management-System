# System Architecture & Engineering Blueprint
## Order Control System — Multi-Brand Dark Kitchen Operating Platform

> **Printable Edition:** [📥 Download Executive PDF (A4 Edition)](PDFs/ARCHITECTURE.pdf)  
> **Architecture Approval Date:** September 16, 2026 | **Status:** Production-Grade & Fully Implemented

---

## Table of Contents
1. [Core Architectural Invariants](#1-core-architectural-invariants)
2. [C4 Model — Level 1: System Context](#2-c4-model--level-1-system-context)
3. [C4 Model — Level 2: Containers & Components](#3-c4-model--level-2-containers--components)
4. [Order State Machine Architecture](#4-order-state-machine-architecture)
5. [Rush Hour Concurrency & PostgreSQL Advisory Locking](#5-rush-hour-concurrency--postgresql-advisory-locking)
6. [Zero-Drift Financial Accounting Flow](#6-zero-drift-financial-accounting-flow)
7. [Role-Based Access Control & Audit Invariants](#7-role-based-access-control--audit-invariants)

---

## 1. Core Architectural Invariants

The Order Control System is the centralized operational platform for a multi-brand sushi dark kitchen operating 4 virtual brands (Flower Sushi, Mastery Sushi, Niwa Sushi, Tobiko Sushi) across 6 aggregator channels. The system operates on a 100% delivery model with no dine-in or customer pickup counters. 

The architecture is governed by five mandatory engineering directives:

1. **Zero Business Logic in UI:** All financial calculations, state machine transitions, and validation rules reside exclusively in `src/lib/`. Database mutations are strictly isolated in `src/services/`. UI components are pure presentation layers that dispatch actions and render state.
2. **Single Source of Truth:** Direct Prisma client invocations from UI pages or API route handlers are prohibited. Every order mutation must pass through `src/services/orders.ts`, which atomically records an immutable `audit()` log entry within the same interactive database transaction.
3. **Strict Immutability & No Hard Deletes:** No business record (Order, Customer, AuditLog) can ever be deleted. Cancellation is the only terminal state for orders and strictly requires an explicit `CancelReason`. Catalog entities enforce soft-deletion via `isActive = false`.
4. **Zero-Drift Financial Identity:** The financial equation `totalCash + totalVisa + totalOnline === totalRevenue` is mathematically enforced and fuzz-tested across 10,000+ randomized orders.
5. **Concurrency-Safe Sequencing:** Order numbers (`ORD-YYYYMMDD-XXXX`) are serialized using PostgreSQL transaction-level advisory locks (`pg_advisory_xact_lock`), completely preventing race conditions and sequence collisions during rush hours.

---

## 2. C4 Model — Level 1: System Context

The System Context diagram illustrates the system boundaries, human actors, and external aggregator platforms:

```mermaid
graph TB
    subgraph Actors ["Human Actors"]
        Cashier["👨‍🍳 Cashier<br/>High-speed POS entry & customer phone lookup"]
        Chef["🔪 Kitchen Expeditor / Chef<br/>Kanban board tracking & prep timers"]
        Manager["👔 Shift Manager<br/>Discount approvals & expense logging"]
        Owner["👑 Business Owner<br/>Financial reports, audit diffs & user provisioning"]
        Driver["🛵 Delivery Drivers<br/>Restaurant fleet / external couriers / aggregator drivers"]
    end

    subgraph System ["Order Control System Boundary"]
        OCS["🍱 Order Control System<br/>Next.js 16 + React 19 + Prisma 7<br/>Centralized operations, kitchen workflow, CRM & accounting"]
    end

    subgraph Aggregators ["External Aggregator Channels"]
        Talabat["📱 Talabat"]
        Elmenus["🍽️ Elmenus"]
        Instashop["🛒 InstaShop"]
        Harry["📲 Harry App"]
        Direct["📞 Phone & Social Channels"]
    end

    subgraph CloudInfra ["Managed Cloud Infrastructure"]
        SupabaseAuth["🔐 Supabase Auth<br/>Secure email/password authentication & session tokens"]
        PostgresDB["🐘 Supabase PostgreSQL<br/>Relational database with RLS policies"]
        VercelServerless["☁️ Vercel Edge / Serverless<br/>Application hosting & API route execution"]
    end

    Talabat -->|Printed order ticket| Cashier
    Elmenus -->|Printed order ticket| Cashier
    Instashop -->|Printed order ticket| Cashier
    Harry -->|Printed order ticket| Cashier
    Direct -->|Direct phone call / WhatsApp| Cashier

    Cashier -->|POS manual entry <30s| OCS
    Chef -->|Kanban status advancement| OCS
    Manager -->|Approve discounts & close shift| OCS
    Owner -->|Executive analytics & audit inspection| OCS
    OCS -->|Courier dispatch & cash collection| Driver

    OCS -->|Verify session credentials| SupabaseAuth
    OCS -->|Atomic ACID transactions| PostgresDB
    VercelServerless -->|Execute runtime code| OCS
```

---

## 3. C4 Model — Level 2: Containers & Components

This diagram details the container architecture, communication protocols, and the internal separation of concerns:

```mermaid
graph TB
    subgraph ClientDevices ["Client Devices & Terminals"]
        POSTerminal["💻 Cashier POS Desktop<br/>Chrome / Edge (RTL Arabic / LTR English)"]
        KitchenTablet["📱 Kitchen Tablet Station<br/>iPad Pro 11 / Android (Touch >= 44px)"]
        ManagerMobile["📱 Management Terminal<br/>Responsive desktop/tablet/mobile"]
    end

    subgraph NextServer ["Next.js 16 Server Container (Vercel)"]
        ProxyMiddleware["🛡️ Proxy Middleware (src/proxy.ts)<br/>Locale routing (ar/en) & session gating, excludes /api"]
        
        subgraph PresentationLayer ["Presentation Layer"]
            ServerComponents["⚛️ Server Components (RSC)<br/>Data pre-fetching & layout scaffolding"]
            ClientComponents["🎨 Client Components (82 files)<br/>shadcn/ui + Tailwind v4 + React Hook Form"]
        end

        subgraph APILayer ["REST API Layer (40 Endpoints)"]
            RouteHandlers["🚦 Route Handlers (src/app/api/)<br/>requireRole() authorization on line 1"]
            ZodValidators["✅ Zod Schema Validation<br/>Strict input sanitization & type coercion"]
        end

        subgraph ServicesLayer ["Services Layer (src/services/)"]
            OrderSvc["📦 orders.ts<br/>Concurrency locks, sequence generation, state transitions"]
            ClosingSvc["💰 closing.ts<br/>Shift reconciliation, cash formulas, history queries"]
            CustomerSvc["👥 customers.ts<br/>RFM loyalty segmentation & profile analytics"]
            AuditSvc["👁️ audit.ts<br/>Atomic diff generation & immutable audit logger"]
        end

        subgraph DomainLib ["Pure Business Logic Layer (src/lib/)"]
            StateMachine["⚙️ orderStateMachine.ts<br/>Deterministic status transition rules"]
            ClosingLib["🧮 closing.ts<br/>Zero-drift netCash & fee formulas"]
            ExcelEngine["📊 reportsExcel.ts & customersExcel.ts<br/>Native .xlsx generation via exceljs"]
        end
    end

    subgraph DataLayer ["Data Storage & Persistence (Supabase)"]
        PrismaClient["🔌 Prisma 7 Client (@prisma/adapter-pg)"]
        TxPooler["🔄 Transaction Pooler (Port 6543)<br/>PgBouncer for high-concurrency runtime queries"]
        DirectConn["⚡ Direct Session (Port 5432)<br/>Dedicated for schema migrations & DDL"]
        PostgresTables["🗄️ 15 PostgreSQL Tables<br/>RLS deny-all + specialized B-Tree indexes"]
    end

    POSTerminal -->|HTTPS / WSS| ProxyMiddleware
    KitchenTablet -->|HTTPS / WSS| ProxyMiddleware
    ManagerMobile -->|HTTPS / WSS| ProxyMiddleware

    ProxyMiddleware --> ServerComponents
    ServerComponents --> ClientComponents
    ClientComponents --> RouteHandlers
    RouteHandlers --> ZodValidators
    ZodValidators --> ServicesLayer
    ServicesLayer --> DomainLib
    ServicesLayer --> PrismaClient

    PrismaClient -->|Runtime transactions| TxPooler
    TxPooler --> PostgresTables
    DirectConn -->|Prisma migrate deploy| PostgresTables
```

---

## 4. Order State Machine Architecture

The order lifecycle adheres to a deterministic, unidirectional state machine. Backward status transitions are mathematically disallowed:

```mermaid
stateDiagram-v2
    [*] --> NEW: 1. Order Creation (Cashier POS)<br/>Generates ORD-YYYYMMDD-XXXX atomically

    NEW --> CONFIRMED: 2. Phone Confirmation<br/>Records confirmedAt timestamp
    CONFIRMED --> PREPARING: 3. Kitchen Preparation Started<br/>Starts live preparation timer
    PREPARING --> READY: 4. Kitchen Preparation Completed<br/>Stops timer, ready for packaging
    READY --> OUT_FOR_DELIVERY: 5. Handed to Courier<br/>Mandatory condition: driverId must be assigned
    OUT_FOR_DELIVERY --> DELIVERED: 6. Customer Delivery Completed<br/>Terminal state (Locked permanently)

    NEW --> CANCELLED: Order Cancelled
    CONFIRMED --> CANCELLED: Order Cancelled
    PREPARING --> CANCELLED: Order Cancelled
    READY --> CANCELLED: Order Cancelled
    OUT_FOR_DELIVERY --> CANCELLED: Order Cancelled

    note right of CANCELLED
        Strict Invariants:
        1. Mandatory CancelReason enum
        2. No hard deletion allowed
        3. Immutable AuditLog entry recorded
    end note

    note left of OUT_FOR_DELIVERY
        Delivery Fee Rule:
        If driverType === 'APP' (e.g. Talabat Go):
        netDeliveryFee is set to 0 EGP
        (Fee handled directly by platform)
    end note

    DELIVERED --> [*]
    CANCELLED --> [*]
```

---

## 5. Rush Hour Concurrency & PostgreSQL Advisory Locking

To guarantee that multiple cashiers entering orders simultaneously during rush hours never collide or produce duplicate order numbers, the system utilizes PostgreSQL transaction-scoped advisory locks:

```mermaid
sequenceDiagram
    autonumber
    actor Cashier1 as Cashier 1 (Talabat Order)
    actor Cashier2 as Cashier 2 (Phone Order)
    participant API as Orders API Handler
    participant OrderService as Order Service
    participant PG as PostgreSQL Database
    participant Audit as Audit Service

    Note over Cashier1,Cashier2: Rush Hour Spike: Two orders submitted at the exact same millisecond

    Cashier1->>+API: POST /api/orders (Order A)
    Cashier2->>+API: POST /api/orders (Order B)

    API->>+OrderService: createOrder(actor, payloadA)
    API->>+OrderService: createOrder(actor, payloadB)

    Note over OrderService,PG: Begin interactive transaction: prisma.$transaction

    OrderService->>PG: BEGIN TRANSACTION A
    OrderService->>PG: BEGIN TRANSACTION B

    OrderService->>PG: SELECT pg_advisory_xact_lock(hashtext('order_seq_20260916')) [Tx A]
    Note over PG: Lock acquired for Transaction A ✅

    OrderService->>PG: SELECT pg_advisory_xact_lock(hashtext('order_seq_20260916')) [Tx B]
    Note over PG: Transaction B queues and waits for lock ⏳ (Collision prevented)

    OrderService->>PG: SELECT orderNumber FROM Order WHERE orderNumber LIKE 'ORD-20260916-%' ORDER BY orderNumber DESC LIMIT 1 [Tx A]
    PG-->>OrderService: Highest sequence: ORD-20260916-0045
    Note over OrderService: Generates next sequential number: ORD-20260916-0046

    OrderService->>PG: INSERT INTO "Order" (orderNumber: 'ORD-20260916-0046', ...)
    OrderService->>PG: INSERT INTO "OrderItem" (...)
    OrderService->>Audit: audit(tx, action: CREATE, entity: Order)
    Audit->>PG: INSERT INTO "AuditLog" (...)

    OrderService->>PG: COMMIT TRANSACTION A
    Note over PG: Transaction A committed, advisory lock automatically released 🔓

    Note over PG: Transaction B instantly acquires lock and executes ✅
    OrderService->>PG: SELECT orderNumber ... LIMIT 1 [Tx B]
    PG-->>OrderService: Highest sequence is now: ORD-20260916-0046
    Note over OrderService: Generates next sequential number: ORD-20260916-0047

    OrderService->>PG: INSERT INTO "Order" (orderNumber: 'ORD-20260916-0047', ...)
    OrderService->>PG: INSERT INTO "OrderItem" (...)
    OrderService->>Audit: audit(tx, action: CREATE, entity: Order)
    Audit->>PG: INSERT INTO "AuditLog" (...)

    OrderService->>PG: COMMIT TRANSACTION B
    Note over PG: Transaction B committed, advisory lock released 🔓

    OrderService-->>-API: Order A created successfully (ORD-20260916-0046)
    OrderService-->>-API: Order B created successfully (ORD-20260916-0047)

    API-->>-Cashier1: 201 Created (ORD-20260916-0046)
    API-->>-Cashier2: 201 Created (ORD-20260916-0047)
```

---

## 6. Zero-Drift Financial Accounting Flow

This flowchart illustrates the end-to-end financial calculation pipeline, from item pricing up to the cash drawer closing reconciliation:

```mermaid
flowchart TD
    subgraph ItemPricing ["1. Item Level Calculations"]
        Item1["Item 1: quantity × unitPrice"]
        Item2["Item 2: quantity × unitPrice"]
        Subtotal["Order Subtotal<br/>Sum of all order items"]
        Item1 --> Subtotal
        Item2 --> Subtotal
    end

    subgraph OrderPricing ["2. Order Level Modifiers"]
        Discount["Approved Discount Amount<br/>Requires Manager/Owner approval"]
        DriverFleet{"Driver Fleet Type?<br/>DriverType Enum"}
        
        AppFleet["Aggregator Courier (APP)<br/>Restaurant Delivery Fee = 0 EGP"]
        OwnFleet["Restaurant / External Fleet<br/>Standard Delivery Zone Fee"]
        
        DriverFleet -->|DriverType == APP| AppFleet
        DriverFleet -->|DriverType == OWN / EXT| OwnFleet
        
        NetFee["Net Delivery Fee (netDeliveryFee)"]
        AppFleet --> NetFee
        OwnFleet --> NetFee
        
        OrderTotal["Total Order Revenue<br/>Math.max(0, Subtotal - Discount) + netDeliveryFee"]
        Subtotal --> OrderTotal
        Discount --> OrderTotal
        NetFee --> OrderTotal
    end

    subgraph ShiftReconciliation ["3. Shift Aggregation (Daily Closing)"]
        FilterCancelled["Exclude Cancelled Orders<br/>status != 'CANCELLED'"]
        OrderTotal --> FilterCancelled
        
        CashTotal["Total Cash Orders (totalCash)"]
        VisaTotal["Total Visa Orders (totalVisa)"]
        OnlineTotal["Total Online Orders (totalOnline)"]
        
        FilterCancelled --> CashTotal
        FilterCancelled --> VisaTotal
        FilterCancelled --> OnlineTotal
        
        TotalRev["Total Revenue Identity:<br/>totalRevenue = totalCash + totalVisa + totalOnline"]
        CashTotal --> TotalRev
        VisaTotal --> TotalRev
        OnlineTotal --> TotalRev
    end

    subgraph CashDrawerAudit ["4. Cash Drawer Reconciliation"]
        ShiftExpenses["Recorded Operational Expenses<br/>Total Cash Expenses (totalExpenses)"]
        
        NetCashFormula["Deterministic Cash Drawer Balance:<br/>netCash = totalCash - totalExpenses"]
        
        CashTotal --> NetCashFormula
        ShiftExpenses --> NetCashFormula
        
        AuditMatch{"Compare Physical Drawer Cash<br/>with Calculated netCash"}
        NetCashFormula --> AuditMatch
        
        Balanced["Exact Balance (Zero Discrepancy) ✅"]
        Variance["Variance Documented in Closing Notes ⚠️"]
        
        AuditMatch -->|Matches| Balanced
        AuditMatch -->|Variance| Variance
    end
```

---

## 7. Role-Based Access Control & Audit Invariants

### Access Control Matrix

| Resource & Operation | Cashier (`CASHIER`) | Manager (`MANAGER`) | Owner (`OWNER`) | Security Enforcement Mechanism |
|---|:---:|:---:|:---:|---|
| **Create & Search Orders** | ✅ Allowed | ✅ Allowed | ✅ Allowed | Session authentication |
| **Advance Order Statuses** | ✅ Allowed | ✅ Allowed | ✅ Allowed | State Machine validation |
| **Request Order Discount** | ✅ Allowed (with reason) | ✅ Allowed | ✅ Allowed | `DISCOUNT_REQUEST` event |
| **Approve / Reject Discounts** | ❌ Forbidden | ✅ Allowed | ✅ Allowed | `403 Forbidden` |
| **Open Operational Shift** | ✅ Allowed | ✅ Allowed | ✅ Allowed | Session authentication |
| **Record Daily Expense** | ✅ Allowed | ✅ Allowed | ✅ Allowed | Session authentication |
| **Close Shift & Reconcile Cash** | ❌ Forbidden | ✅ Allowed | ✅ Allowed | `403 Forbidden` |
| **Manage Menu Catalog & Prices** | ❌ Forbidden | ✅ Allowed | ✅ Allowed | `403 Forbidden` |
| **Analytics Dashboards & Reports** | ❌ Forbidden | ❌ Forbidden | ✅ Allowed | `403 Forbidden` |
| **Audit Trail Inspector & Diff Modal** | ❌ Forbidden | ❌ Forbidden | ✅ Allowed | `403 Forbidden` |
| **Staff User Provisioning & Roles** | ❌ Forbidden | ❌ Forbidden | ✅ Allowed | `403 Forbidden` |
| **Hard Delete Any Business Record** | 🚫 Prohibited | 🚫 Prohibited | 🚫 Prohibited | `405 Method Not Allowed` |

---
*Official Architecture Specification for Order Control System. Maintained by Core Engineering.*
