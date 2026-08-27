# Test Infrastructure & Specification Document
## Sushi Dark Kitchen Order Control System — E2E Test Architecture

---

## 1. Overview & Architecture

This document specifies the test infrastructure, test runner architecture, feature mapping matrix, and verification protocols for the **Sushi Dark Kitchen Order Control System** (Next.js 16, React 19, Tailwind v4, Prisma 7, next-intl).

The test suite is structured around a rigorous **4-Tier Requirement-Driven Testing Strategy** covering all 13 features across Requirements R1 through R6, augmented with adversarial and boundary verification.

```
                               ┌──────────────────────────────────────────────────────────┐
                               │                    TEST RUNNER (E2E)                     │
                               │                  tests/e2e/run-all.ts                    │
                               └────────────────────────────┬─────────────────────────────┘
                                                            │
                 ┌──────────────────────────┬───────────────┴──────────────┬──────────────────────────┐
                 ▼                          ▼                              ▼                          ▼
   ┌──────────────────────────┐┌──────────────────────────┐┌──────────────────────────┐┌──────────────────────────┐
   │          TIER 1          ││          TIER 2          ││          TIER 3          ││          TIER 4          │
   │     Feature Coverage     ││    Boundary & Corner     ││      Cross-Feature       ││   Real-World Scenarios   │
   │   (F1-F13 >=5 tests ea)  ││   (F1-F13 >=5 tests ea)  ││     Pairwise Matrix      ││   Dark Kitchen Flows     │
   └─────────────┬────────────┘└────────────┬─────────────┘└────────────┬─────────────┘└────────────┬─────────────┘
                 │                          │                           │                           │
                 └──────────────────────────┴───────────────┬───────────┴───────────────────────────┘
                                                            ▼
                               ┌──────────────────────────────────────────────────────────┐
                               │                ORACLES & HELPER HARNESS                  │
                               │  - visual-token-oracle.ts   - prep-timer-oracle.ts       │
                               │  - receipt-oracle.ts        - test-runner.ts             │
                               │  - mock-data.ts             - orderStateMachine.ts       │
                               └──────────────────────────────────────────────────────────┘
```

---

## 2. Directory Layout & Test Artifacts

All test files are strictly isolated in `tests/` and adhere to TypeScript standards and independent execution rules.

| Path | Purpose | Key Responsibilities |
|---|---|---|
| `tests/helpers/test-runner.ts` | Test Harness & Assertion Engine | Provides execution timing, error formatting, tier context tagging, and aggregated summaries. |
| `tests/helpers/visual-token-oracle.ts` | Visual Token & Theme Oracle | Authoritative specs for Brand tokens (Flower, Mastery, Niwa, Tobiko), Platform tokens (Talabat, elmenus, InstaShop, HarryApp, Phone), Loyalty tiers, and Touch Target (>=44x44px) validation. |
| `tests/helpers/prep-timer-oracle.ts` | Kitchen Prep Timer Oracle | Mathematical calculation of elapsed prep time, MM:SS / HH:MM:SS formatting, and critical warning alert thresholds (>=900s / 15m). |
| `tests/helpers/receipt-oracle.ts` | POS Receipt Ticket Oracle | Monospace thermal receipt generator, tabular-nums formatting, line item subtotals, discount deductions with zero floor, and net delivery fee rules. |
| `tests/fixtures/mock-data.ts` | Test Fixtures & Datasets | Realistic sushi brands, platforms, products, customer profiles, and sample orders across all statuses. |
| `tests/e2e/tier1-feature-coverage.test.ts` | Tier 1: Feature Coverage | >=5 tests per feature for all 13 features (65+ tests) verifying primary happy path contracts. |
| `tests/e2e/tier2-boundary-corner.test.ts` | Tier 2: Boundary & Corner Cases | >=5 tests per feature for all 13 features (65+ tests) verifying edge cases, zero-floors, clock skew, and adversarial inputs. |
| `tests/e2e/tier3-cross-feature.test.ts` | Tier 3: Cross-Feature Matrix | Pairwise integration tests (Themes × Brands × Platforms, Language × Receipt × Tabular-Nums, View Switcher × Filter Retention, Loyalty × Payment × Receipt). |
| `tests/e2e/tier4-real-world-scenarios.test.ts` | Tier 4: Real-World Scenarios | Full operational workflows: POS Cashier Rush, Kitchen Line Expeditor Prep Rush, Multi-Platform Courier Dispatch, Night Shift Closing. |
| `tests/e2e/run-all.ts` | Master E2E Runner | Orchestrates execution of all 4 tiers, aggregates runtime stats, and returns process exit code. |

---

## 3. How to Run the Test Suite

### Running the Full E2E Test Suite
```bash
npm run test:e2e
```
*Alternatively using `npx tsx`:*
```bash
npx tsx tests/e2e/run-all.ts
```

### Running Individual Tiers
```bash
# Tier 1: Feature Coverage (F1-F13)
npx tsx tests/e2e/tier1-feature-coverage.test.ts

# Tier 2: Boundary & Corner Cases (F1-F13)
npx tsx tests/e2e/tier2-boundary-corner.test.ts

# Tier 3: Cross-Feature Combinations (Pairwise Matrix)
npx tsx tests/e2e/tier3-cross-feature.test.ts

# Tier 4: Real-World Application Scenarios
npx tsx tests/e2e/tier4-real-world-scenarios.test.ts
```

### Running Typecheck & Lint Gates
```bash
npm run typecheck
npm run lint
```

---

## 4. Feature Coverage Matrix (F1 through F13)

| # | Feature | Requirement | Tier 1 Tests | Tier 2 Tests | Tier 3 Matrix | Tier 4 Scenario |
|---|---|---|---|---|---|---|
| **F1** | **Modern Navigation Header** | ORIGINAL_REQUEST §R1 | F1.1 - F1.5 (Active pills, Branding, Roles, Cashier restrictions, Drawer) | F1.1 - F1.5 (Deep sub-routes, Long names, Unknown roles, Drawer debounce, RTL layout) | C6 (Mobile Drawer × Touch Targets) | S4 (Night-Shift Navigation) |
| **F2** | **Persistent "+ New Order" CTA** | ORIGINAL_REQUEST §R1 | F2.1 - F2.5 (Route `/orders/new`, >=44px touch, All views, Enter key, High contrast) | F2.1 - F2.5 (Self-route, Rapid multi-click debounce, Space key, Focus rings, 200% Zoom) | C6 (Persistent CTA in Drawer) | S1 (Rapid Cashier Order Entry) |
| **F3** | **Theme System & Kitchen Mode** | ORIGINAL_REQUEST §R5 | F3.1 - F3.5 (Light/Dark/Kitchen, Obsidian/Amber, State persistence, CSS vars, Card borders) | F3.1 - F3.5 (Invalid fallback, Classlist safety, WCAG AAA 7:1 contrast, Transition suppression, Locale sync) | C1 (Theme × Brand × Platform Matrix) | S4 (Kitchen Night-Shift Closing) |
| **F4** | **Bilingual & Touch Ergonomics** | ORIGINAL_REQUEST §R6 | F4.1 - F4.5 (dir="rtl"/"ltr", >=44px touch buttons, AR/EN dictionary, EGP/ج.م currency, Responsive grid) | F4.1 - F4.5 (Mixed AR/EN text, LTR phone wrap `<bdi>`, Missing key fallback, Icon-only buttons, Punctuation) | C2 (Language × Receipt × Tabular-Nums) | S1, S4 (Arabic POS & Closing) |
| **F5** | **Brand Visual Signatures** | ORIGINAL_REQUEST §R2 | F5.1 - F5.5 (Flower 花, Mastery 匠, Niwa 庭, Tobiko 魚子, Unknown fallback) | F5.1 - F5.5 (Case insensitivity, Whitespace trimming, Null fallback, Partial matching, Distinct colors) | C1 (Theme × Brand Matrix) | S1, S2 (Multi-Brand Cashier & Kitchen) |
| **F6** | **Platform Visual Signatures** | ORIGINAL_REQUEST §R2 | F6.1 - F6.5 (Talabat Orange, elmenus Red, InstaShop Teal, HarryApp Indigo, Phone Blue) | F6.1 - F6.5 (Case insensitivity, Whitespace trimming, Null fallback, Phone aliases, Hex uniqueness) | C1 (Theme × Platform Matrix) | S3 (Multi-Platform Dispatcher) |
| **F7** | **Interactive Receipt Ticket Preview** | ORIGINAL_REQUEST §R3 | F7.1 - F7.5 (Thermal monospace, Tabular-nums, Line item totals, Zero-fee app fleet, Customer header) | F7.1 - F7.5 (0 items, 199.99 precision, 100% discount, Discount > subtotal zero-floor, 20+ items) | C2, C4 (Receipt × Loyalty × Payment) | S1 (Cashier POS Receipt Generation) |
| **F8** | **Touch-Optimized Payment Selector** | ORIGINAL_REQUEST §R3 | F8.1 - F8.5 (CASH/VISA/ONLINE, >=44px touch card, Ring/border styling, State update, Icons) | F8.1 - F8.5 (Rapid switching, Arrow key navigation, Uppercase normalization, Zero amount, Active scale) | C4 (Payment × Loyalty Integration) | S1 (Mixed Payment Method Orders) |
| **F9** | **Customer Loyalty Badges** | ORIGINAL_REQUEST §R3 | F9.1 - F9.5 (0 New, 1-4 Regular, 5-19 VIP, 20+ Legend, Null safe default) | F9.1 - F9.5 (Exact boundaries, Upper limits, Negative floor, Fractional rounding, NaN handling) | C4 (Loyalty Discount Application) | S1 (Returning Customer Discount) |
| **F10** | **Orders View Switcher** | ORIGINAL_REQUEST §R4 | F10.1 - F10.5 (Table/Kanban toggle, Filter retention, Touch standard, Localized labels, Empty states) | F10.1 - F10.5 (Empty search retention, 100+ orders, Rapid toggle debounce, URL sync `?view=kanban`, Tabs a11y) | C3 (View Switcher × Brand/Platform Filters) | S2, S3 (Switching Table to Kanban) |
| **F11** | **Live Kitchen Kanban Board** | ORIGINAL_REQUEST §R4 | F11.1 - F11.5 (5 Columns, Linear transitions, Column placement, Cancel reason, Invalid jump reject) | F11.1 - F11.5 (Exclude cancelled, Driver assignment guard, Empty column, 10+ items summary, Optimistic lock) | C5 (Kanban × Prep Timer Alerts) | S2 (Kitchen Expeditor Kanban Queue) |
| **F12** | **Live Prep Timers & Alert Badges** | ORIGINAL_REQUEST §R4 | F12.1 - F12.5 (Normal <10m, Warning 10-14m, Critical >=15m pulsing alert, HH:MM:SS format, Null fallback) | F12.1 - F12.5 (Future clock skew clamp, 899s vs 900s boundary, >24h format, Frozen delivered timer, String fallback) | C5 (Overdue Orders Pulsing Badge) | S2 (Monitoring Overdue Kitchen Orders) |
| **F13** | **E2E & Adversarial Verification** | ORIGINAL_REQUEST §Quality Gates | F13.1 - F13.5 (Full lifecycle, Terminal status lock, Big numbers, Timestamp mapping, Next statuses helper) | F13.1 - F13.5 (XSS escaping in notes, Unicode/emojis, MAX_SAFE_INTEGER, Backwards transitions, Input sanitizer) | C1-C6 (Holistic Verification) | S1-S4 (End-to-End Dark Kitchen Lifecycle) |

---

## 5. Verification Rules & Authoritative Oracles

1. **State Machine Transitions**: Strictly bounded by `ALLOWED_TRANSITIONS` in `src/lib/orderStateMachine.ts`. No jumps from `NEW` to `DELIVERED` or regressions from terminal states `DELIVERED` / `CANCELLED`.
2. **Financial Precision**: Subtotals, Discounts, Net Delivery Fees, and Grand Totals are rounded to 2 decimal places with strict non-negative zero flooring (`Math.max(0, ...)`).
3. **Delivery Fee Zeroing Rule**: When `driverType` is `APP` (Aggregator fleet) or `PICKUP`, delivery fee is zeroed for the restaurant.
4. **Kitchen SLA Warning Threshold**: When elapsed time in preparation reaches `900 seconds` (15 minutes), `isCritical = true` activates `animate-pulse` and high-contrast red warning styling.
5. **Touch Target Standard**: All interactive touch targets must satisfy minimum `44x44px` physical dimensions (`h-11 min-w-11` or `size-touch`).
6. **Bilingual Typography**: Monospace numbers use `tabular-nums` for stable column alignment, Arabic layout applies `dir="rtl"`, and phone numbers use `<bdi dir="ltr">`.
