# Original User Request

## Initial Request — 2026-08-26T18:29:26Z

Comprehensive UI/UX & Frontend Visual Polish for the Sushi Dark Kitchen Order Control System (Next.js 16 + React 19 + Tailwind v4).

Working directory: d:\programming\Projects\Orders Management System
Integrity mode: development

## Requirements

### R1. Modern Navigation Header & Quick Actions
Refactor the top navigation bar with clear active-route pills, Japanese sushi dark kitchen branding, distinct user profile area with role badge, and a high-visibility, persistent "+ New Order" CTA button accessible across all dashboard pages.

### R2. Brand & Platform Visual Signatures
Implement instant color-coded visual signatures for the 4 sushi brands (Flower, Mastery, Niwa, Tobiko) and the 5 delivery platforms (Talabat, elmenus, InstaShop, HarryApp, Phone) so cashiers and kitchen staff can instantly distinguish orders at a glance.

### R3. Fast POS Order Creation Screen Enhancements
Elevate /orders/new with an interactive receipt ticket preview panel, prominent touch-optimized payment selector buttons (Cash, Visa, Online), returning customer loyalty badges, and tabular numbers for stable price alignment under rush hour data entry.

### R4. Live Orders Board with Kitchen Kanban & Prep Timers
Enhance /orders with a view switcher allowing toggle between standard Data Table View and a Live Kitchen Kanban Board (NEW -> PREPARING -> READY -> OUT_FOR_DELIVERY -> DELIVERED), with visual pulsing warning badges for orders exceeding 15 minutes in preparation.

### R5. Dark Mode & Kitchen Night-Shift Theme Support
Incorporate theme switching with a sleek dark mode theme tailored for high-contrast visibility in kitchen and night-shift environments.

### R6. Bilingual & Responsive Polish
Ensure 100% Arabic (RTL default) and English (LTR) alignment, touch-target ergonomics (minimum 44x44px), and seamless mobile/tablet adaptability across all components.

## Acceptance Criteria

### Visual & Navigation
- [ ] Active route is visually highlighted with an active pill / background token in the navbar.
- [ ] Persistent "+ New Order" button in header routes directly to /orders/new.
- [ ] 4 Brands and 5 Platforms display recognizable brand colors across order badges, tables, and cards.

### POS & Kitchen Usability
- [ ] Order summary on /orders/new displays formatted receipt ticket styling with tabular-nums.
- [ ] Table and Kanban board toggle on /orders switches views instantly without losing filter states.
- [ ] Orders in PREPARING status for > 15 minutes display elapsed time warning badges.

### Quality & Standards
- [ ] npm run typecheck passes with 0 errors.
- [ ] npm run lint passes with 0 errors / 0 warnings.
- [ ] npm run build compiles all routes successfully.
