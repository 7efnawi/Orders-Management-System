# Software Requirements Specification (SRS)
## Order Control System (نظام إدارة الطلبات لمطعم سوشي)

### 1. Introduction

#### 1.1 Purpose
The purpose of this document is to define the functional and non-functional requirements for the **Order Control System**, a web-based order management system designed for a sushi dark kitchen operating multiple brands. This document serves as the primary reference for developers, stakeholders, and project managers.

#### 1.2 Scope
The system will replace the current manual Google Sheets workflow with a centralized web application. It will handle manual order entry by cashiers, order tracking, delivery management, daily expenses, and comprehensive reporting. The system manages operations for four brands (Flower Sushi, Mastery Sushi, Niwa Sushi, Tobiko Sushi) across various delivery platforms (Talabat, Menus, InstaShop, HarryApp, Phone).

#### 1.3 Definitions and Acronyms
- **Dark Kitchen**: A restaurant that operates exclusively for delivery (no dine-in).
- **Brand**: A virtual restaurant brand operating from the same physical kitchen.
- **Platform**: Delivery aggregators or direct ordering channels.
- **Role**: System permissions level (Owner, Manager, Cashier).
- **AOV**: Average Order Value.

#### 1.4 References
- `ENGINEERING_DIRECTIVES.md` (Engineering rules and constraints)
- `implementation_plan.md` (Approved implementation phases)

---

### 2. Overall Description

#### 2.1 Product Perspective
The system is a standalone web application replacing fragmented spreadsheets. It integrates order entry, delivery dispatch, and financial tracking into a single unified flow. It acts as the core operational software for the kitchen.

#### 2.2 Product Functions
- **Order Management**: Entry, status tracking, cancellation (with reasons), and discounts.
- **Menu Management**: Categories and products per brand.
- **Delivery Management**: Zones, fees, and driver assignment (own, app, or external).
- **Financial & Expense Tracking**: Expense logging and daily shift closing.
- **Reporting & Dashboards**: Analytics for sales, top items, and driver cash collection.
- **Auditing**: Comprehensive logs of all critical actions to prevent fraud.
- **Customer Database**: Customer history and order tracking.

#### 2.3 User Classes and Characteristics
- **Cashier**: Fast-paced data entry from printed receipts. Needs quick UX, clear status transitions, and easy driver assignment. Restricted permissions.
- **Manager**: Oversees daily operations, approves discounts, manages menu updates, and monitors daily reports.
- **Owner**: Full system access. Needs high-level financial reports, audit logs, and user management capabilities.

#### 2.4 Operating Environment
- Web-based system (accessible via modern browsers: Chrome, Safari, Edge).
- Deployed on Vercel (Frontend) and Supabase (PostgreSQL Database & Auth).
- Accessed via tablets and computers in the kitchen (Windows/macOS/Android/iOS).

#### 2.5 Design and Implementation Constraints
- Tech Stack: Next.js + PostgreSQL (Supabase) + Prisma.
- Authentication: Supabase Auth (Email + Password).
- Architecture: Strict Separation of Concerns (Business logic in `src/lib/` or `src/services/`).
- Fail-Safe Policy: **No Hard Deletes**. Cancelled orders must require a reason.

#### 2.6 Assumptions and Dependencies
- Orders are printed from platform tablets, and cashiers manually enter them into this system.
- Application commissions are calculated externally (P&L sheet) and are out of scope for this system.

---

### 3. Functional Requirements

#### FR-AUTH: Authentication & Authorization

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-AUTH-01 | System must authenticate users via Email + Password (Supabase Auth) | Must | Users can log in; failed attempts show error; unauthenticated users redirect to login |
| FR-AUTH-02 | System must enforce RBAC at **both** API and UI levels (Owner/Manager/Cashier) | Must | API rejects unauthorized calls; UI hides inaccessible features |
| FR-AUTH-03 | Session must persist across page refreshes | Must | User stays logged in until explicit logout or token expiry |
| FR-AUTH-04 | System must support secure logout | Must | Session destroyed; redirect to login |

#### FR-MENU: Menu Management

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-MENU-01 | Manager/Owner can create, edit, and deactivate **Categories** per Brand | Must | CRUD operations work; each Category belongs to one Brand |
| FR-MENU-02 | Manager/Owner can create, edit, and deactivate **Products** within Categories | Must | Product has: Name, Price, Description, Category, isActive |
| FR-MENU-03 | Products can be deactivated (hidden) but **never deleted** | Must | Deactivated products don't show in order form but remain in DB |
| FR-MENU-04 | Categories can be reordered (sortOrder) | Should | Drag-and-drop or manual sort order |
| FR-MENU-05 | Cashier **cannot** access menu management | Must | API rejects menu changes from Cashier role |
| FR-MENU-06 | When creating an order, only products from the **selected Brand** appear | Must | Brand selection filters the product list |

#### FR-ORD: Order Management ⭐ (Core Module)

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-ORD-01 | Cashier can create a new order by selecting: Platform, Brand, Customer, Products, Payment Method, Zone | Must | Order saves with status "New"; subtotal + delivery fee auto-calculated |
| FR-ORD-02 | Orders follow strict state transitions via State Machine | Must | State Machine in `src/lib/orderStateMachine.ts` validates; UI only shows valid next steps |
| FR-ORD-03 | **No Hard Delete** — Orders can only be Cancelled with mandatory reason | Must | No delete endpoint exists; Cancel requires `cancelReason` |
| FR-ORD-04 | Discounts require reason + Manager/Owner approval | Must | API rejects discount without `discountReason` + `discountApprovedBy` |
| FR-ORD-05 | Every status change records a **timestamp** automatically | Must | `createdAt`, `confirmedAt`, `preparingAt`, `readyAt`, `outForDeliveryAt`, `deliveredAt`, `cancelledAt` |
| FR-ORD-06 | Customer phone number auto-lookup: if customer exists, auto-fill name + address | Must | Typing phone triggers search; existing customer data populates form |
| FR-ORD-07 | New customers are automatically created in Customer DB when order is saved | Must | First-time phone number creates new Customer record |
| FR-ORD-08 | Order number is auto-generated (sequential per day or global) | Must | Unique, non-editable order number |
| FR-ORD-09 | Order can be edited **before** status reaches "Preparing" | Should | Editing after Preparing is blocked; edits logged in Audit |
| FR-ORD-10 | Order list shows Live Orders (non-terminal statuses) with real-time filter | Must | Default view shows open orders; filter by status/platform/brand/date |
| FR-ORD-11 | Order detail page shows full timeline (all timestamps + who did what) | Must | Visual timeline with timestamps and actor names |
| FR-ORD-12 | When driver type is "App" (التطبيق بيوصل بمناديبه), delivery fee = 0 automatically | Must | Selecting app driver sets fee to 0; no manual override needed |

#### FR-DEL: Delivery Management

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-DEL-01 | Cashier can assign a driver when order status is "Ready" | Must | Assignment changes status to "Out for Delivery" + records driverId + driverAssignedAt |
| FR-DEL-02 | System manages Delivery Zones with a single configurable fee per zone | Must | Fee auto-applies to order; Manager/Owner can edit zone fees at any time |
| FR-DEL-03 | Drivers are categorized: OWN (مندوب خاص) / APP (مندوب التطبيق) / EXTERNAL (Indrive) / PICKUP (العميل) | Must | Driver type determines delivery fee behavior |
| FR-DEL-04 | Driver cash collection is tracked per driver per day | Must | System knows how much cash each driver collected and must return |
| FR-DEL-05 | Manager/Owner can add/edit/deactivate Drivers and Zones | Must | CRUD operations; deactivated items hidden from selection |

#### FR-EXP: Expense Management

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-EXP-01 | System allows logging expenses with Type + Description + Quantity + Value + Date | Must | All fields required; date defaults to today |
| FR-EXP-02 | 20 predefined expense types seeded from current Excel | Must | Default types present on first use |
| FR-EXP-03 | Manager/Owner can add new expense types | Must | New types appear in dropdown immediately |
| FR-EXP-04 | Expense list filterable by type and date range | Should | Filter controls on expense list page |

#### FR-CLOSE: Daily Closing

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-CLOSE-01 | Cashier can open a shift (records openedAt) | Must | Only one shift open at a time per cashier |
| FR-CLOSE-02 | System auto-calculates closing summary | Must | Totals match raw order + expense data exactly |
| FR-CLOSE-03 | Closing summary includes: total orders (success/cancel), cash, visa, driver cash, delivery fees, expenses, net cash | Must | All 7+ metrics calculated correctly |
| FR-CLOSE-04 | Calculations happen in `src/lib/closing.ts` (Separation of Concerns) | Must | No business logic in page components |
| FR-CLOSE-05 | Closing history viewable by date | Should | Past closings accessible with all details |

#### FR-RPT: Reports & Dashboard

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-RPT-01 | Dashboard shows Live Orders + last 5 orders for **Cashier** | Must | Cashier sees only operational data |
| FR-RPT-02 | Dashboard shows today's summary (orders, sales, cash/visa) for **Manager/Owner** | Must | Summary cards with key metrics |
| FR-RPT-03 | Daily and Monthly reports with: orders, sales by platform+brand, delivery fees, expenses, net revenue, AOV | Must | All metrics accurate; filterable by date range |
| FR-RPT-04 | Driver Cash Collection report | Must | Per-driver breakdown of cash orders and amounts |
| FR-RPT-05 | Top Selling Products report | Must | Products ranked by quantity sold |
| FR-RPT-06 | Reports exportable to PDF and Excel | Should | Export buttons generate downloadable files |
| FR-RPT-07 | **Backend enforced**: API checks role before returning report data | Must | Cashier API calls to report endpoints return 403 |

#### FR-AUD: Audit Log

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-AUD-01 | Every Create/Update/Cancel on Order auto-logs to AuditLog | Must | Log entry has: userId, action, entityType, entityId, oldValue, newValue, timestamp |
| FR-AUD-02 | Audit Log is **immutable** — entries cannot be edited or deleted | Must | No UPDATE/DELETE endpoints for AuditLog table |
| FR-AUD-03 | Audit Log viewable by **Owner only** | Must | API returns 403 for non-Owner; UI hides link |
| FR-AUD-04 | Audit Log filterable by: user, action type, date range | Should | Filter controls on audit page |
| FR-AUD-05 | Audit logging triggered **automatically** via centralized function, not manually per page | Must | All DB writes route through `src/lib/audit.ts` |

#### FR-USR: User Management

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-USR-01 | Owner can create new users (name + email + password + role) | Must | New user can log in immediately |
| FR-USR-02 | Owner can edit user details and change roles | Must | Role change takes effect on next login/refresh |
| FR-USR-03 | Owner can deactivate users (not delete) | Must | Deactivated user cannot log in |
| FR-USR-04 | Only Owner can access User Management | Must | API + UI enforced |

#### FR-CUST: Customer Database

| ID | Description | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-CUST-01 | Customer identified by unique phone number | Must | Duplicate phones rejected |
| FR-CUST-02 | Auto-create customer on first order | Must | New phone → new Customer record with name + address from order |
| FR-CUST-03 | Auto-fill customer data when phone matches existing record | Must | Phone input triggers lookup; name + address populate |
| FR-CUST-04 | Customer profile page shows: basic info, total orders, last order date, order history | Must | All data visible on customer detail page |
| FR-CUST-05 | Customer profile shows **problem orders**: cancelled, quality issues, delivery problems | Must | Filterable list of problematic orders |
| FR-CUST-06 | Customer profile shows whether they are "first-time" or "returning" | Must | Badge or indicator on customer card |
| FR-CUST-07 | Customer list searchable by name or phone | Must | Search bar with instant results |
| FR-CUST-08 | Customer notes field (free text for special instructions or issues) | Should | Editable notes visible to all roles |


---

### 4. Data Requirements

- **User**: ID, Email, Name, Role
- **Brand**: ID, Name, IsActive
- **Product/Category**: Catalog data linked to Brands
- **Customer**: ID, Name, Phone (Unique), Address, Notes, Order History
- **DeliveryZone**: ID, Name, Fee
- **Order**: Status, PaymentMethod, Financials (Subtotal, Discount, DeliveryFee), Timestamps
- **AuditLog**: Automatically populated on DB writes.

_Note: All schema changes must be documented in `PROJECT_LOG.md` immediately upon creation._

---

### 5. External Interface Requirements

#### 5.1 User Interfaces
- **Languages**: Bilingual (Arabic & English) via `next-intl`.
- **Layout**: Full RTL/LTR support.
- **Responsiveness**: Must work on tablets (for kitchen use) and desktop monitors.

#### 5.2 Hardware Interfaces
- No direct hardware integration. The system will be used alongside existing tablet and receipt printer setups. Cashiers transcribe from printed receipts.

#### 5.3 Software Interfaces
- **Supabase Auth**: For user identity and session management.
- **PostgreSQL**: Primary data store.

---

### 6. Open Items
- Finalizing the exact Menu Structure (Categories/Products/Variants) pending receipt samples from the client.
- Verifying if any specific custom export formats are strictly required beyond standard Excel/PDF.
