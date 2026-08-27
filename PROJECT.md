# Project: Sushi Dark Kitchen Order Control System — UI/UX & Frontend Polish

## Architecture
- **Framework**: Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + shadcn/ui + next-intl (Bilingual AR/EN) + next-themes + Prisma 7 + Supabase PostgreSQL.
- **Client/Server Layout**:
  - `src/app/[locale]/(dashboard)/layout.tsx` embeds client `DashboardHeader` (`src/components/layout/dashboard-header.tsx`) with active route pills, sushi branding, persistent "+ New Order" CTA button, user profile/role badge, theme switcher, and mobile drawer.
  - `src/components/theme-provider.tsx` and `src/components/theme-switcher.tsx` manage light, dark, and specialized kitchen night-shift themes (`.kitchen`).
  - `src/lib/visualTokens.ts` is the single source of truth for the 4 sushi brands (Flower, Mastery, Niwa, Tobiko) and 5 platforms (Talabat, elmenus, InstaShop, HarryApp, Phone).
  - `src/components/ui/brand-badge.tsx` and `src/components/ui/platform-badge.tsx` provide unified color-coded visual signatures.
  - `src/components/orders/receipt-ticket-preview.tsx` and updated `order-form.tsx` implement POS thermal receipt preview with `tabular-nums`, touch-optimized payment selectors, and customer loyalty badges.
  - `src/components/orders/kitchen-kanban.tsx`, `use-prep-timer.ts`, and updated `orders-table.tsx` implement view switching, 5-column kitchen kanban, drag-and-drop / 1-click status advances, and pulsing prep timer alert badges (>15m in PREPARING).
- **Core Business Logic Integrity**:
  - All status transitions strictly follow `src/lib/orderStateMachine.ts`.
  - All database writes route through `src/services/orders.ts` and `src/lib/audit.ts`.
  - Translations maintained symmetrically in `src/messages/ar.json` and `src/messages/en.json`.
  - Single source of truth for `PROJECT_LOG.md` updates.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Modern Navigation Header | Refactor navbar with active pills, sushi dark kitchen branding, user profile with role badge, mobile drawer | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Persistent "+ New Order" CTA | Persistent high-visibility CTA button in navbar routing to `/orders/new` across all dashboard pages | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Theme System & Kitchen Mode | Next-themes provider, ThemeSwitcher UI, and `.kitchen` high-contrast obsidian/amber night-shift theme | M1 | ORIGINAL_REQUEST §R5 |
| 4 | Bilingual & Touch Ergonomics | 100% Arabic (RTL) & English (LTR) layout, >=44x44px touch targets (`size="touch"`), responsive design | M1 | ORIGINAL_REQUEST §R6 |
| 5 | Brand Visual Signatures | 4 Sushi brands (Flower Sakura Pink, Mastery Artisan Gold, Niwa Matcha Emerald, Tobiko Orange) with Kanji glyphs & badges | M2 | ORIGINAL_REQUEST §R2 |
| 6 | Platform Visual Signatures | 5 Delivery platforms (Talabat Orange, elmenus Crimson, InstaShop Teal, HarryApp Indigo, Phone Blue) with badges | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Interactive Receipt Ticket Preview | POS thermal receipt ticket preview with monospace alignment and `tabular-nums` formatting on `/orders/new` | M3 | ORIGINAL_REQUEST §R3 |
| 8 | Touch-Optimized Payment Selector | Prominent >=44x44px payment buttons (Cash, Visa, Online) with active visual feedback on `/orders/new` | M3 | ORIGINAL_REQUEST §R3 |
| 9 | Customer Loyalty Badges | Tiered badges (New Guest, Regular, Gold VIP, Platinum Legend) based on `totalOrders` on `/orders/new` | M3 | ORIGINAL_REQUEST §R3 |
| 10 | Orders View Switcher | Toggle between standard Data Table View and Kitchen Kanban Board on `/orders` preserving filter/search state | M4 | ORIGINAL_REQUEST §R4 |
| 11 | Live Kitchen Kanban Board | 5-column Kanban board (`NEW/CONFIRMED` -> `PREPARING` -> `READY` -> `OUT_FOR_DELIVERY` -> `DELIVERED`) with status triggers | M4 | ORIGINAL_REQUEST §R4 |
| 12 | Live Prep Timers & Alert Badges | Live elapsed prep timers with pulsing warning badges (`animate-pulse` / `animate-ping`) for orders >15m in PREPARING | M4 | ORIGINAL_REQUEST §R4 |
| 13 | E2E & Adversarial Verification | End-to-end requirement test suite (Tiers 1-4), adversarial test hardening (Tier 5), typecheck, lint, build verification | M5 | ORIGINAL_REQUEST §Quality Gates |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Navigation Header & Themes | F1, F2, F3, F4 (Header, Branding, Theme Switcher, Kitchen Mode, Button touch size, i18n) | none | COMPLETED |
| 2 | Brand & Platform Visual Signatures | F5, F6 (visualTokens.ts, BrandBadge, PlatformBadge, integration in tables/modals) | M1 | COMPLETED |
| 3 | Fast POS Order Creation Screen | F7, F8, F9 (Receipt Ticket Preview, tabular-nums, Payment Selector cards, Loyalty Badges) | M2 | COMPLETED |
| 4 | Live Orders Board & Kitchen Kanban | F10, F11, F12 (View Switcher, 5-col Kanban Board, Prep Timers, >15m pulsing alert badges) | M2 | COMPLETED |
| 5 | E2E Test Suite & Adversarial Hardening | F13 (Requirement-driven E2E tests, edge cases, typecheck, lint, production build validation) | M3, M4 | PLANNED |

## Interface Contracts
### Visual Tokens (`src/lib/visualTokens.ts`)
- `getBrandToken(brandName: string): BrandVisualToken`
  - Returns `{ name, labelAr, labelEn, kanji, hex, bgClass, textClass, borderClass, ringClass }`
- `getPlatformToken(platformName: string): PlatformVisualToken`
  - Returns `{ name, labelAr, labelEn, hex, bgClass, textClass, borderClass }`
- `getLoyaltyTier(totalOrders: number): LoyaltyTierInfo`
  - Returns `{ tier: 'new' | 'regular' | 'vip' | 'legend', labelAr, labelEn, colorClass, iconName }`

### Kitchen Prep Timer (`src/hooks/use-prep-timer.ts` or `src/lib/prepTimer.ts`)
- `calculatePrepTime(preparingAt: Date | string | null, createdAt: Date | string): { elapsedSeconds: number, formattedTime: string, isWarning: boolean, isCritical: boolean }`
- Alert threshold: `elapsedSeconds >= 900` (15 minutes) -> `isCritical = true` -> trigger pulsing animation & high-contrast red warning token.

### Order State Transitions & Kanban Handlers
- Transitions triggered from Kanban board strictly call `transitionOrderStatus(orderId, nextStatus, note)` via `/api/orders/[id]/status` which validates via `src/lib/orderStateMachine.ts`.
- When transitioning to `OUT_FOR_DELIVERY`, prompt/open `AssignDriverDialog` to ensure driver is assigned.

## Code Layout
- `src/components/layout/dashboard-header.tsx` — Navigation bar, active pills, "+ New Order" CTA, user profile, theme switcher.
- `src/components/theme-provider.tsx` — Next-themes provider wrapper.
- `src/components/theme-switcher.tsx` — Interactive theme switcher (Light / Dark / Kitchen Night-Shift).
- `src/lib/visualTokens.ts` — Brand, Platform, and Loyalty visual token definitions.
- `src/components/ui/brand-badge.tsx` — Visual badge for brands with Kanji glyphs.
- `src/components/ui/platform-badge.tsx` — Visual badge for delivery platforms.
- `src/components/orders/receipt-ticket-preview.tsx` — Thermal receipt ticket preview panel with `tabular-nums`.
- `src/components/orders/kitchen-kanban.tsx` — 5-column Live Kitchen Kanban Board.
- `src/components/orders/prep-timer-badge.tsx` — Live ticking prep timer with pulsing alert badge.
- `src/hooks/use-prep-timer.ts` — React hook for ticking elapsed prep timer.
- `src/app/[locale]/(dashboard)/orders/page.tsx` & `src/components/orders/orders-table.tsx` — Orders table with view switcher.
- `src/app/[locale]/(dashboard)/orders/new/page.tsx` & `src/components/orders/order-form.tsx` — Fast POS order creation form.
- `src/messages/ar.json` & `src/messages/en.json` — Symmetrical bilingual translations.
- `PROJECT_LOG.md` — Project changelog entries for each milestone.
