# Navigation Bar Refinement & Brand-Home Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the Brand Logo & Home navigation link into a unified interactive brand component, fix responsive desktop layout spacing to eliminate text clipping on all tabs (including "التقارير"), and optimize touch/desktop ergonomics.

**Architecture:** Refactor `src/components/layout/dashboard-header.tsx` to separate desktop nav tabs (excluding redundant Home tab) from mobile drawer nav items (retaining Home tab), improve responsive container layout with adaptive padding and breakpoints, and ensure strict type-safety and visual token alignment.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React, next-intl.

**Spec:** `docs/SRS.md` (FR-NAV & Visual Guidelines) • `docs/plans/2026-08-28-navbar-refinement-plan.md`

## Global Constraints

1. **No UI Regression:** All 6 current navigation tabs (Orders, Menu, Delivery, Expenses, Closing, Reports) and upcoming tabs (Users, Audit) must render properly according to user roles.
2. **Brand-Home Dual Purpose:** The Brand Logo & App Title (`Link href="/"`) acts as the single primary entry point for the Dashboard Home route.
3. **No Text Truncation:** Navigation labels must remain fully legible on screen widths from `1024px` upwards without overflowing or clipping.
4. **Bilingual RTL & LTR Support:** Arabic (RTL default) and English (LTR) layouts must maintain exact symmetry and margin/padding consistency.
5. **Quality Gate:** Zero errors on `npm run typecheck` and 100% pass rate on `npm run test:e2e`.

---

## Tasks & Bite-Sized Steps

### Task 1: Navigation Bar & Brand-Home Consolidation (`src/components/layout/dashboard-header.tsx`)

**Files:**
- Modify: `src/components/layout/dashboard-header.tsx`

**Interfaces:**
- Consumes: `useTranslations("nav")`, `useTranslations("common")`, `useTranslations("roles")`, `usePathname()`, `Role` from `@prisma/client`.
- Produces: Polished `DashboardHeader` with consolidated brand home link, responsive nav list, and zero-overflow layout.

- [x] **Step 1: Refactor navigation items list into desktop and mobile lists**

```tsx
// Inside DashboardHeader component:
const isHomeActive = pathname === "/" || pathname === "";

// Desktop items (omits redundant Home because Brand Logo links to "/")
const desktopNavItems = [
  {
    href: "/orders",
    label: tNav("orders"),
    icon: LayoutGrid,
    roles: ["OWNER", "MANAGER", "CASHIER"] as Role[],
    isActive:
      pathname === "/orders" ||
      (pathname.startsWith("/orders") && pathname !== "/orders/new"),
  },
  {
    href: "/menu",
    label: tNav("menu"),
    icon: UtensilsCrossed,
    roles: ["OWNER", "MANAGER"] as Role[],
    isActive: pathname === "/menu" || pathname.startsWith("/menu"),
  },
  {
    href: "/delivery",
    label: tNav("delivery"),
    icon: Truck,
    roles: ["OWNER", "MANAGER"] as Role[],
    isActive: pathname === "/delivery" || pathname.startsWith("/delivery"),
  },
  {
    href: "/expenses",
    label: tNav("expenses"),
    icon: Wallet,
    roles: ["OWNER", "MANAGER", "CASHIER"] as Role[],
    isActive: pathname === "/expenses" || pathname.startsWith("/expenses"),
  },
  {
    href: "/closing",
    label: tNav("closing"),
    icon: History,
    roles: ["OWNER", "MANAGER", "CASHIER"] as Role[],
    isActive: pathname === "/closing" || pathname.startsWith("/closing"),
  },
  {
    href: "/reports",
    label: tNav("reports"),
    icon: BarChart3,
    roles: ["OWNER", "MANAGER"] as Role[],
    isActive: pathname === "/reports" || pathname.startsWith("/reports"),
  },
];

// Mobile drawer includes Home explicitly at the top
const mobileNavItems = [
  {
    href: "/",
    label: tNav("dashboard"),
    icon: Home,
    roles: ["OWNER", "MANAGER", "CASHIER"] as Role[],
    isActive: isHomeActive,
  },
  ...desktopNavItems,
];
```

- [x] **Step 2: Update Brand Logo component styling to reflect Home active status**

```tsx
{/* Brand Logo & Title (Acts as Home Link) */}
<Link
  href="/"
  className={cn(
    "group flex shrink-0 items-center gap-2 sm:gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1 transition-all duration-150 active:scale-[0.98]",
    isHomeActive && "ring-1 ring-primary/40 bg-primary/5 dark:bg-primary/10"
  )}
  aria-label={tNav("dashboard")}
>
  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shadow-primary/30 ring-1 ring-primary/20 group-hover:scale-105 transition-transform">
    <Flame className="size-5 text-primary-foreground" />
  </div>
  <div className="flex flex-col min-w-0">
    <span className="truncate text-sm sm:text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
      {tCommon("appName")}
    </span>
    <span className="hidden xl:inline truncate text-[10px] xl:text-[11px] font-semibold text-muted-foreground tracking-wider uppercase leading-tight">
      {tNav("brandTag")}
    </span>
  </div>
</Link>
```

- [x] **Step 3: Update desktop `<nav>` container and link styling**

```tsx
{/* Desktop Navigation Pills */}
<nav
  className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 ps-2 xl:ps-3 border-s border-border/60 overflow-x-auto no-scrollbar py-0.5"
  aria-label={tNav("dashboard")}
>
  {allowedDesktopNavItems.map((item) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all duration-150 h-9 xl:h-10 whitespace-nowrap shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary",
          item.isActive
            ? "bg-primary text-primary-foreground font-semibold shadow-xs shadow-primary/25"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
        )}
      >
        <Icon
          className={cn(
            "size-3.5 xl:size-4 shrink-0",
            item.isActive ? "text-primary-foreground" : "text-muted-foreground"
          )}
        />
        <span>{item.label}</span>
      </Link>
    );
  })}
</nav>
```

- [x] **Step 4: Update Mobile Menu Drawer nav rendering with `allowedMobileNavItems`**

- [x] **Step 5: Run quality gate tests**

Run: `npm run typecheck`
Expected: 0 errors

Run: `npm run test:e2e`
Expected: 186/186 passed

- [x] **Step 6: Update PROJECT_LOG.md and Commit**

```bash
git add src/components/layout/dashboard-header.tsx PROJECT_LOG.md docs/plans/2026-08-28-navbar-refinement-plan.md
git commit -m "refactor(nav): consolidate brand and home link, fix responsive spacing and overflow"
```

---

## Execution Choice Handoff

Plan complete and saved to `docs/plans/2026-08-28-navbar-refinement-plan.md`.
Two execution options:
1. **Subagent-Driven (recommended)** - Dispatches subagents per task with review checkpoints.
2. **Inline Execution** - Executes tasks sequentially in this session with immediate verification.
