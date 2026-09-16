# Database Schema & Data Dictionary
## Order Control System — Multi-Brand Dark Kitchen Operating Platform

> **Printable Edition:** [📥 Download Executive PDF (A4 Edition)](PDFs/DATA_DICTIONARY.pdf)  
> **Database Engine:** PostgreSQL 15+ (Supabase) | **ORM:** Prisma 7 (`@prisma/adapter-pg`)  
> **Schema Version:** 2026.09 Production

---

## Table of Contents
1. [Overview & Data Architecture](#1-overview--data-architecture)
2. [Enumeration Types (Enums)](#2-enumeration-types-enums)
3. [Identity & Authentication Models (`User`)](#3-identity--authentication-models-user)
4. [Master Data & Catalog Models (`Brand`, `Platform`, `Category`, `Product`)](#4-master-data--catalog-models-brand-platform-category-product)
5. [Fleet & Logistics Models (`DeliveryZone`, `DeliveryDriver`)](#5-fleet--logistics-models-deliveryzone-deliverydriver)
6. [Customer Relationship Management (`Customer`)](#6-customer-relationship-management-customer)
7. [Core Transactional Models (`Order`, `OrderItem`)](#7-core-transactional-models-order-orderitem)
8. [Financial & Operational Models (`ExpenseType`, `Expense`, `Shift`, `DailyClosing`)](#8-financial--operational-models-expensetype-expense-shift-dailyclosing)
9. [Security & Compliance Models (`AuditLog`)](#9-security--compliance-models-auditlog)
10. [Database Indexes & Performance Optimizations](#10-database-indexes--performance-optimizations)

---

## 1. Overview & Data Architecture

The Order Control System persistence layer is modeled in PostgreSQL and managed via Prisma 7. The architecture enforces ACID transactional integrity, soft deletion (`isActive = false` or `status = 'CANCELLED'`), and immutable historical records.

### Key Architectural Invariants
- **No Direct Column for Total Revenue on Order:** The `Order` model explicitly avoids storing a mutable `total` column. Instead, `subtotal`, `discount`, and `deliveryFee` are stored as atomic primitives, and totals are computed dynamically via `calculateOrderTotals()` to guarantee mathematical consistency.
- **Snapshot Pricing on OrderItem:** `OrderItem.unitPrice` captures the frozen unit price at the time of order creation. Future price edits on `Product` do not mutate historical order records.
- **Advisory Locks for Sequencing:** Order sequence numbers (`ORD-YYYYMMDD-XXXX`) utilize PostgreSQL advisory locks (`pg_advisory_xact_lock`) to serialize concurrent creations.

---

## 2. Enumeration Types (Enums)

### `Role`
Defines role-based permissions across API endpoints and UI views.
- `OWNER`: Full system access, audit inspector, financial reports, user management.
- `MANAGER`: Shift management, menu edits, expense tracking, discount approvals, daily closing.
- `CASHIER`: Fast order entry, order status advancement, discount requests, shift open.

### `OrderStatus`
Governs the deterministic, unidirectional state machine.
- `NEW`: Order ingested into the system.
- `CONFIRMED`: Customer verified by phone; ticket dispatched to kitchen.
- `PREPARING`: Line chef actively preparing items; live timer ticking.
- `READY`: Items cooked, packaged, boxed, and awaiting courier pickup.
- `OUT_FOR_DELIVERY`: Dispatched with driver (driver assignment mandatory).
- `DELIVERED`: Successfully handed over to customer (terminal state).
- `CANCELLED`: Voided order with mandatory cancellation reason (terminal state).

### `PaymentMethod`
- `CASH`: Cash collected upon delivery.
- `VISA`: Credit/debit card collected at doorstep via portable POS terminal.
- `ONLINE`: Pre-paid order via aggregator platform or payment gateway.

### `DriverType`
- `OWN`: In-house delivery courier employed by the restaurant.
- `APP`: Courier provided by third-party delivery platform (e.g. Talabat Go). *Invariant: Automatically zeros restaurant delivery fee.*
- `EXTERNAL`: Independent third-party courier (e.g. InDrive, freelance).
- `PICKUP`: Direct pickup (deprecated / internal testing).

### `DiscountStatus`
- `NONE`: No discount applied.
- `PENDING`: Requested by cashier with mandatory reason; awaiting manager approval.
- `APPROVED`: Confirmed by manager; deducted from order total.
- `REJECTED`: Declined by manager; order reverts to full subtotal.

### `CancelReason`
Mandatory categorization required when cancelling any order:
- `CUSTOMER_CHANGED_MIND`: Customer called back to cancel.
- `DELIVERY_ISSUE`: Address unreachable, severe weather, courier unavailable.
- `QUALITY_ISSUE`: Customer returned food or disputed preparation.
- `NO_ANSWER`: Customer phone unanswered or switched off upon arrival.
- `ITEM_UNAVAILABLE`: Raw ingredients or packaging out of stock.
- `OTHER`: Unlisted reason (requires explicit descriptive notes).

### `AuditAction`
Categorizes audit log entries:
- `CREATE`: Creation of order, expense, customer, or user.
- `UPDATE`: Entity attribute modifications.
- `CANCEL`: Cancellation of order.
- `STATUS_CHANGE`: Progression through state machine.
- `DISCOUNT_REQUEST`: Cashier requested a discount.
- `DISCOUNT_APPROVE`: Manager approved discount.
- `DISCOUNT_REJECT`: Manager rejected discount.

---

## 3. Identity & Authentication Models (`User`)

### Model: `User`
Represents staff members and administrative accounts.

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key (matches Supabase Auth user ID) |
| `email` | `String` | No | — | Unique login email address |
| `name` | `String` | No | — | Full employee name |
| `role` | `Role` | No | `CASHIER` | RBAC authorization role |
| `isActive` | `Boolean` | No | `true` | Soft deletion status (false prevents login) |
| `createdAt` | `DateTime` | No | `now()` | Account creation timestamp |
| `updatedAt` | `DateTime` | No | Auto | Last profile update timestamp |

---

## 4. Master Data & Catalog Models

### Model: `Brand`
Represents one of the 4 virtual sushi brands.

| Column | Type | Nullable | Description |
|---|---|:---:|---|
| `id` | `UUID` | No | Primary Key |
| `name` | `String` | No | Brand name in English (e.g. "Flower Sushi") |
| `nameAr` | `String` | No | Brand name in Arabic (e.g. "سوشي فلاور") |
| `code` | `String` | No | Unique identifier code (e.g. "FLOWER") |
| `isActive` | `Boolean` | No | Soft-activation status |

### Model: `Platform`
Represents an aggregator channel or direct ordering medium.

| Column | Type | Nullable | Description |
|---|---|:---:|---|
| `id` | `UUID` | No | Primary Key |
| `name` | `String` | No | Platform name in English (e.g. "Talabat") |
| `nameAr` | `String` | No | Platform name in Arabic (e.g. "طلبات") |
| `code` | `String` | No | Unique identifier code (e.g. "TALABAT") |
| `isActive` | `Boolean` | No | Soft-activation status |

### Model: `Category`
Menu categories mapped to specific brands.

| Column | Type | Nullable | Description |
|---|---|:---:|---|
| `id` | `UUID` | No | Primary Key |
| `brandId` | `UUID` | No | Foreign Key ➔ `Brand.id` |
| `name` | `String` | No | Category name (e.g. "Fried Maki") |
| `nameAr` | `String` | No | Category Arabic name (e.g. "فرايد ماكي") |
| `sortOrder` | `Int` | No | Display sorting position |
| `isActive` | `Boolean` | No | Soft-activation status |

### Model: `Product`
Individual sushi rolls, combos, beverages, and sides.

| Column | Type | Nullable | Description |
|---|---|:---:|---|
| `id` | `UUID` | No | Primary Key |
| `categoryId` | `UUID` | No | Foreign Key ➔ `Category.id` |
| `name` | `String` | No | Product name (e.g. "Philadelphia Roll 8 Pcs") |
| `nameAr` | `String` | No | Arabic name (e.g. "فيلادلفيا رول 8 قطع") |
| `price` | `Decimal(10,2)` | No | Standard selling price in EGP |
| `isActive` | `Boolean` | No | Soft-activation status |

---

## 5. Fleet & Logistics Models

### Model: `DeliveryZone`
Geographic delivery zones with flat delivery fees.

| Column | Type | Nullable | Description |
|---|---|:---:|---|
| `id` | `UUID` | No | Primary Key |
| `name` | `String` | No | Zone name (e.g. "Heliopolis") |
| `nameAr` | `String` | No | Arabic zone name (e.g. "مصر الجديدة") |
| `fee` | `Decimal(10,2)` | No | Delivery fee charged to customer (EGP) |
| `isActive` | `Boolean` | No | Soft-activation status |

### Model: `DeliveryDriver`
Delivery couriers and fleet personnel.

| Column | Type | Nullable | Description |
|---|---|:---:|---|
| `id` | `UUID` | No | Primary Key |
| `name` | `String` | No | Courier full name |
| `phone` | `String` | No | Courier contact phone number |
| `type` | `DriverType` | No | Fleet classification (`OWN`, `APP`, `EXTERNAL`) |
| `isActive` | `Boolean` | No | Active working status |

---

## 6. Customer Relationship Management (`Customer`)

### Model: `Customer`
Centralized customer directory keyed by normalized phone number.

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `phone` | `String` | No | — | Normalized Egyptian phone number (Unique) |
| `name` | `String` | No | — | Customer full name |
| `address` | `String` | Yes | — | Primary delivery address |
| `notes` | `String` | Yes | — | Customer notes & allergy advisories |
| `totalOrders` | `Int` | No | `0` | Aggregated completed orders count |
| `lifetimeSpent`| `Decimal(10,2)` | No | `0` | Aggregated total spend across all brands |
| `lastOrderDate`| `DateTime` | Yes | — | Timestamp of most recent order |

---

## 7. Core Transactional Models (`Order`, `OrderItem`)

### Model: `Order`
The primary operational entity governing food preparation and accounting.

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `orderNumber` | `String` | No | — | Unique sequential number (`ORD-YYYYMMDD-XXXX`) |
| `platformId` | `UUID` | No | — | Foreign Key ➔ `Platform.id` |
| `brandId` | `UUID` | No | — | Foreign Key ➔ `Brand.id` |
| `externalId` | `String` | Yes | — | External aggregator ticket ID (e.g. `TAL-88491`) |
| `customerId` | `UUID` | No | — | Foreign Key ➔ `Customer.id` |
| `zoneId` | `UUID` | Yes | — | Foreign Key ➔ `DeliveryZone.id` |
| `driverId` | `UUID` | Yes | — | Foreign Key ➔ `DeliveryDriver.id` |
| `cashierId` | `UUID` | No | — | Foreign Key ➔ `User.id` (Order creator) |
| `shiftId` | `UUID` | Yes | — | Foreign Key ➔ `Shift.id` |
| `status` | `OrderStatus` | No | `NEW` | State machine progression status |
| `paymentMethod`| `PaymentMethod`| No | `CASH` | Payment method classification |
| `subtotal` | `Decimal(10,2)` | No | `0` | Sum of all order item subtotals (EGP) |
| `discount` | `Decimal(10,2)` | No | `0` | Deducted discount amount (EGP) |
| `discountReason`| `String` | Yes | — | Mandatory reason for discount request |
| `discountStatus`| `DiscountStatus`| No | `NONE` | Approval lifecycle status |
| `discountApprovedById` | `UUID` | Yes | — | Foreign Key ➔ `User.id` (Approving manager) |
| `deliveryFee` | `Decimal(10,2)` | No | `0` | Applied delivery fee (0 if `DriverType === APP`) |
| `notes` | `String` | Yes | — | Freeform kitchen preparation notes |
| `cancelReason` | `CancelReason` | Yes | — | Mandatory reason if order cancelled |
| `cancelNotes` | `String` | Yes | — | Supplemental notes for cancellation |
| `createdAt` | `DateTime` | No | `now()` | Ingestion timestamp |
| `confirmedAt` | `DateTime` | Yes | — | Phone confirmation timestamp |
| `preparingAt` | `DateTime` | Yes | — | Kitchen prep start timestamp |
| `readyAt` | `DateTime` | Yes | — | Food boxed/packaged timestamp |
| `dispatchedAt` | `DateTime` | Yes | — | Handover to courier timestamp |
| `deliveredAt` | `DateTime` | Yes | — | Final delivery completion timestamp |
| `cancelledAt` | `DateTime` | Yes | — | Order voided timestamp |

### Model: `OrderItem`
Normalized line items linked to an Order.

| Column | Type | Nullable | Description |
|---|---|:---:|---|
| `id` | `UUID` | No | Primary Key |
| `orderId` | `UUID` | No | Foreign Key ➔ `Order.id` (CASCADE on delete) |
| `productId` | `UUID` | No | Foreign Key ➔ `Product.id` |
| `quantity` | `Int` | No | Quantity ordered (≥ 1) |
| `unitPrice` | `Decimal(10,2)` | No | Frozen item price snapshot at creation time |
| `notes` | `String` | Yes | Custom item notes (e.g. "No spicy mayo") |

---

## 8. Financial & Operational Models

### Model: `ExpenseType`
Classifications for operational daily expenditures.

| Column | Type | Nullable | Description |
|---|---|:---:|---|
| `id` | `UUID` | No | Primary Key |
| `name` | `String` | No | Category name (e.g. "Fresh Ingredients") |
| `nameAr` | `String` | No | Arabic name (e.g. "خامات وخضار طازج") |
| `isActive` | `Boolean` | No | Soft-activation status |

### Model: `Expense`
Individual operational petty cash disbursements.

| Column | Type | Nullable | Description |
|---|---|:---:|---|
| `id` | `UUID` | No | Primary Key |
| `expenseTypeId` | `UUID` | No | Foreign Key ➔ `ExpenseType.id` |
| `userId` | `UUID` | No | Foreign Key ➔ `User.id` (Spender / recorder) |
| `shiftId` | `UUID` | Yes | Foreign Key ➔ `Shift.id` |
| `amount` | `Decimal(10,2)` | No | Disbursed amount in EGP |
| `description` | `String` | No | Invoice or disbursement description |
| `date` | `DateTime` | No | Incurred date |

### Model: `Shift`
Operational work shifts.

| Column | Type | Nullable | Description |
|---|---|:---:|---|
| `id` | `UUID` | No | Primary Key |
| `cashierId` | `UUID` | No | Foreign Key ➔ `User.id` (Shift operator) |
| `openedAt` | `DateTime` | No | Shift start timestamp |
| `closedAt` | `DateTime` | Yes | Shift conclusion timestamp (null if active) |
| `notes` | `String` | Yes | Shift notes |

### Model: `DailyClosing`
Permanent shift reconciliation record.

| Column | Type | Nullable | Description |
|---|---|:---:|---|
| `id` | `UUID` | No | Primary Key |
| `shiftId` | `UUID` | No | Foreign Key ➔ `Shift.id` (Unique) |
| `closedById` | `UUID` | No | Foreign Key ➔ `User.id` (Closing manager) |
| `totalOrders` | `Int` | No | Total non-cancelled orders count |
| `cancelledOrders` | `Int` | No | Total cancelled orders count |
| `totalRevenue` | `Decimal(10,2)` | No | Total gross revenue (Cash + Visa + Online) |
| `totalCash` | `Decimal(10,2)` | No | Total cash collected from orders |
| `totalVisa` | `Decimal(10,2)` | No | Total Visa collected at doorstep |
| `totalOnline` | `Decimal(10,2)` | No | Total pre-paid aggregator orders |
| `totalDeliveryFees`| `Decimal(10,2)` | No | Total net delivery fees collected |
| `totalExpenses` | `Decimal(10,2)` | No | Total cash operational expenses |
| `netCash` | `Decimal(10,2)` | No | Mandatory balance: `totalCash - totalExpenses` |
| `actualCash` | `Decimal(10,2)` | Yes | Physically counted cash in drawer |
| `difference` | `Decimal(10,2)` | Yes | Cash variance (`actualCash - netCash`) |
| `notes` | `String` | Yes | Closing discrepancy explanation |
| `closedAt` | `DateTime` | No | Closing timestamp |

---

## 9. Security & Compliance Models (`AuditLog`)

### Model: `AuditLog`
Immutable compliance log tracking every business mutation.

| Column | Type | Nullable | Description |
|---|---|:---:|---|
| `id` | `UUID` | No | Primary Key |
| `userId` | `UUID` | No | Foreign Key ➔ `User.id` (Actor) |
| `action` | `AuditAction` | No | Action type classification |
| `entityType` | `String` | No | Target entity (e.g. `Order`, `User`, `Expense`) |
| `entityId` | `String` | No | Primary key or order number of target entity |
| `oldValue` | `Json` | Yes | Snapshot of entity state prior to mutation |
| `newValue` | `Json` | Yes | Snapshot of entity state following mutation |
| `timestamp` | `DateTime` | No | Immutable timestamp (`now()`) |

---

## 10. Database Indexes & Performance Optimizations

To maintain sub-500ms analytical queries and instantaneous POS lookups under heavy concurrent traffic, the database schema implements the following B-Tree indexes:

```sql
-- Fast Customer Lookup by Phone
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- Fast Order Number Lookups & Sequence Resolution
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "Order_brandId_platformId_idx" ON "Order"("brandId", "platformId");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_shiftId_idx" ON "Order"("shiftId");

-- Audit Log Filtering Performance
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp" DESC);
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- Catalog & Menu Sort Order Performance
CREATE INDEX "Category_brandId_sortOrder_idx" ON "Category"("brandId", "sortOrder");
CREATE INDEX "Product_categoryId_isActive_idx" ON "Product"("categoryId", "isActive");
```

---
*Official Database Schema & Data Dictionary for Order Control System. Maintained by Database Engineering.*
