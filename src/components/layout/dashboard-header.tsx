"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Role } from "@prisma/client";
import {
  LayoutGrid,
  UtensilsCrossed,
  Truck,
  Wallet,
  History,
  Plus,
  Menu,
  X,
  Home,
  Flame,
  BarChart3,
  Users,
  ChevronDown,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Contact,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  locale: string;
}

export function DashboardHeader({ user, locale }: DashboardHeaderProps) {
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const tRoles = useTranslations("roles");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const adminMenuRef = React.useRef<HTMLDivElement>(null);

  // Close user menu and admin menu on outside click or Escape
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        adminMenuRef.current &&
        !adminMenuRef.current.contains(event.target as Node)
      ) {
        setAdminMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
        setAdminMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }
    if (userMenuOpen || adminMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen, adminMenuOpen]);

  // Close open dropdowns on route change
  React.useEffect(() => {
    setUserMenuOpen(false);
    setAdminMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const isHomeActive = pathname === "/" || pathname === "";

  // Core operational desktop navigation items
  const coreDesktopNavItems = [
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
      href: "/customers",
      label: tNav("customers"),
      icon: Contact,
      roles: ["OWNER", "MANAGER", "CASHIER"] as Role[],
      isActive: pathname === "/customers" || pathname.startsWith("/customers"),
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

  // Administrative / Governance desktop navigation items
  const adminDesktopNavItems = [
    {
      href: "/audit",
      label: tNav("audit"),
      icon: ShieldCheck,
      roles: ["OWNER"] as Role[],
      isActive: pathname === "/audit" || pathname.startsWith("/audit"),
    },
    {
      href: "/users",
      label: tNav("users"),
      icon: Users,
      roles: ["OWNER", "MANAGER"] as Role[],
      isActive: pathname === "/users" || pathname.startsWith("/users"),
    },
  ];

  const allowedCoreNavItems = coreDesktopNavItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const allowedAdminNavItems = adminDesktopNavItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const allowedDesktopNavItems = [
    ...allowedCoreNavItems,
    ...allowedAdminNavItems,
  ];

  // Navigation items for mobile slide-over drawer (includes explicit Home link at top)
  const mobileNavItems = [
    {
      href: "/",
      label: tNav("dashboard"),
      icon: Home,
      roles: ["OWNER", "MANAGER", "CASHIER"] as Role[],
      isActive: isHomeActive,
    },
    ...allowedDesktopNavItems,
  ];

  const allowedMobileNavItems = mobileNavItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const isAdminActive = allowedAdminNavItems.some((item) => item.isActive);

  const roleStyles: Record<
    Role,
    { badgeClass: string; dotClass: string; avatarClass: string }
  > = {
    OWNER: {
      badgeClass:
        "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
      dotClass: "bg-amber-500",
      avatarClass:
        "bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-amber-700 dark:text-amber-300 border-amber-500/40",
    },
    MANAGER: {
      badgeClass:
        "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
      dotClass: "bg-indigo-500",
      avatarClass:
        "bg-gradient-to-br from-indigo-500/20 to-indigo-600/30 text-indigo-700 dark:text-indigo-300 border-indigo-500/40",
    },
    CASHIER: {
      badgeClass:
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      dotClass: "bg-emerald-500",
      avatarClass:
        "bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
    },
  };

  const userRoleStyle = roleStyles[user.role] || roleStyles.CASHIER;

  const initials = React.useMemo(() => {
    if (!user.name) return "U";
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  }, [user.name]);

  const isNewOrderActive = pathname === "/orders/new";

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/85 transition-colors">
        <div className="mx-auto flex h-15 xl:h-16 max-w-[1536px] items-center justify-between gap-1.5 sm:gap-3 lg:gap-3.5 px-2.5 sm:px-4 lg:px-6">
          {/* Left / Brand + Nav Section */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:gap-3.5">
            {/* Mobile Menu Trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden size-9 rounded-lg text-foreground hover:bg-muted/80 shrink-0"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={tNav("openNavigation")}
            >
              <Menu className="size-5" />
            </Button>

            {/* Brand Logo & Title (Clean, Sharp Restaurant Identity) */}
            <Link
              href="/"
              className="group flex shrink-0 items-center gap-2 sm:gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl py-1 px-1 transition-opacity hover:opacity-90 active:scale-[0.98]"
              aria-label={tCommon("appName")}
              title={tCommon("appName")}
            >
              <div className="flex size-8 sm:size-8.5 xl:size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 via-pink-600 to-amber-500 text-white shadow-xs shadow-pink-500/20 transition-transform group-hover:scale-105">
                <Flame className="size-4 sm:size-4.5 xl:size-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs sm:text-sm xl:text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary leading-tight">
                  {tCommon("appName")}
                </span>
                <span className="hidden 2xl:inline truncate text-[10px] xl:text-[11px] font-semibold text-muted-foreground tracking-wider uppercase leading-tight">
                  {tNav("brandTag")}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Tabs (Responsive & zero overlap) */}
            <nav
              className="hidden lg:flex items-center min-w-0 overflow-x-auto no-scrollbar scroll-smooth gap-0.5 xl:gap-1 ps-2 xl:ps-3 border-s border-border/60 py-0.5"
              aria-label={tNav("dashboard")}
            >
              {/* Operational items */}
              {allowedCoreNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1 rounded-lg text-xs xl:text-[13px] font-medium transition-all duration-150 h-8 xl:h-8.5 whitespace-nowrap shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      item.isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-3.5 xl:size-4 shrink-0",
                        item.isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Administrative items: on lg:max-xl collapsed into «الإدارة ▾» dropdown; on xl:flex shown as individual tabs */}
              {allowedAdminNavItems.length > 0 && (
                <>
                  {/* Dropdown for compact desktop viewports (lg:max-xl) */}
                  <div
                    className="relative inline-block text-start xl:hidden shrink-0"
                    ref={adminMenuRef}
                  >
                    <button
                      type="button"
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-150 h-8 whitespace-nowrap shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer",
                        isAdminActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs shadow-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                      onClick={() => setAdminMenuOpen((prev) => !prev)}
                      aria-expanded={adminMenuOpen}
                      aria-haspopup="true"
                      aria-label={tNav("management")}
                    >
                      <ShieldCheck
                        className={cn(
                          "size-3.5 shrink-0",
                          isAdminActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground"
                        )}
                      />
                      <span>{tNav("management")}</span>
                      <ChevronDown
                        className={cn(
                          "size-3 transition-transform duration-150 shrink-0",
                          adminMenuOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {adminMenuOpen && (
                      <div
                        role="menu"
                        aria-orientation="vertical"
                        className="absolute start-0 mt-1.5 w-44 z-50 rounded-xl border border-border bg-popover/95 backdrop-blur-md p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-150 text-popover-foreground"
                      >
                        {allowedAdminNavItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              role="menuitem"
                              className={cn(
                                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                                item.isActive
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-foreground hover:bg-muted"
                              )}
                              onClick={() => setAdminMenuOpen(false)}
                            >
                              <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Individual tabs for wide desktop viewports (xl:flex) */}
                  {allowedAdminNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "hidden xl:flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1 rounded-lg text-xs xl:text-[13px] font-medium transition-all duration-150 h-8 xl:h-8.5 whitespace-nowrap shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          item.isActive
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs shadow-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-3.5 xl:size-4 shrink-0",
                            item.isActive
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>
          </div>

          {/* Right Action & User Controls */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 ms-2 z-10">
            {/* Persistent "+ New Order" CTA Button */}
            <Link href="/orders/new" className="shrink-0">
              <Button
                className={cn(
                  "h-8.5 xl:h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-all duration-150 active:scale-[0.98] gap-1.5 shrink-0 cursor-pointer",
                  isNewOrderActive
                    ? "bg-primary/90 ring-2 ring-primary ring-offset-2 ring-offset-background text-primary-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25"
                )}
                aria-label={tNav("newOrderCTA")}
              >
                <Plus className="size-3.5 sm:size-4 shrink-0" />
                <span className="hidden sm:inline">{tNav("newOrderCTA")}</span>
              </Button>
            </Link>

            {/* Modern User Profile Dropdown (Sleek Avatar + Quick Menu) */}
            <div className="relative inline-block text-start shrink-0" ref={userMenuRef}>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1.5 xl:gap-2 h-8.5 xl:h-9 px-1.5 xl:px-2 rounded-lg border border-border/70 bg-card/60 shadow-2xs backdrop-blur-xs transition-all cursor-pointer hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary outline-none",
                  userMenuOpen && "bg-muted border-border ring-1 ring-primary/30"
                )}
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label={tNav("userProfile")}
                title={user.name}
              >
                <div
                  className={cn(
                    "relative flex size-6.5 xl:size-7 shrink-0 items-center justify-center rounded-full font-bold text-xs border shadow-2xs",
                    userRoleStyle.avatarClass
                  )}
                >
                  {initials}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -end-0.5 size-2 xl:size-2.5 rounded-full ring-2 ring-background",
                      userRoleStyle.dotClass
                    )}
                  />
                </div>
                <div className="hidden 2xl:flex flex-col min-w-0 max-w-[130px] text-start">
                  <span className="truncate text-xs font-semibold text-foreground leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium leading-none mt-0.5">
                    {tRoles(user.role)}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "size-3 xl:size-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
                    userMenuOpen && "rotate-180 text-foreground"
                  )}
                />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute end-0 mt-1.5 w-64 z-50 rounded-xl border border-border bg-popover/95 backdrop-blur-md p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-150 text-popover-foreground"
                >
                  {/* User Profile Header Card */}
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/60 border border-border/60 mb-2">
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full font-bold text-sm border shadow-xs",
                        userRoleStyle.avatarClass
                      )}
                    >
                      {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-sm font-bold text-foreground">
                        {user.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                      <div className="mt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 font-medium border-0 w-fit",
                            userRoleStyle.badgeClass
                          )}
                        >
                          <ShieldCheck className="size-3 me-1 inline-block" />
                          {tRoles(user.role)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Shortcuts in Dropdown */}
                  <div className="space-y-0.5 border-b border-border/60 pb-1.5 mb-1.5">
                    {user.role === "OWNER" && (
                      <Link
                        href="/audit"
                        role="menuitem"
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <ShieldCheck className="size-3.5 text-muted-foreground" />
                        <span>{tNav("audit")}</span>
                      </Link>
                    )}
                    {(user.role === "OWNER" || user.role === "MANAGER") && (
                      <Link
                        href="/users"
                        role="menuitem"
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Users className="size-3.5 text-muted-foreground" />
                        <span>{tNav("users")}</span>
                      </Link>
                    )}
                    <Link
                      href="/closing"
                      role="menuitem"
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <History className="size-3.5 text-muted-foreground" />
                      <span>{tNav("closing")}</span>
                    </Link>
                  </div>

                  {/* Logout Action */}
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    <LogOut className="size-3.5" />
                    <span>{loggingOut ? tAuth("signingOut") : tAuth("logout")}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Controls: Language & Theme */}
            <div className="flex items-center gap-1 border-s border-border/70 ps-1.5 shrink-0">
              <ThemeSwitcher />
              <LanguageSwitcher locale={locale} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Responsive Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over Drawer */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={tNav("mobileMenu")}
            className={cn(
              "fixed inset-y-0 start-0 z-50 flex w-full max-w-xs flex-col bg-background p-5 shadow-2xl border-e border-border animate-in slide-in-from-start duration-200"
            )}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Flame className="size-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-sm font-bold text-foreground">
                    {tCommon("appName")}
                  </span>
                  <span className="truncate text-[10px] font-semibold text-muted-foreground uppercase">
                    {tNav("brandTag")}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 min-h-11 min-w-11 rounded-xl text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
                aria-label={tNav("closeNavigation")}
              >
                <X className="size-5" />
              </Button>
            </div>

            {/* Prominent Mobile "+ New Order" CTA */}
            <div className="py-4">
              <Link
                href="/orders/new"
                onClick={() => setMobileMenuOpen(false)}
                className="block"
              >
                <Button
                  size="touch"
                  className="w-full justify-center gap-2 bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/25"
                >
                  <Plus className="size-5" />
                  <span>{tNav("newOrderCTA")}</span>
                </Button>
              </Link>
            </div>

            {/* Mobile Nav Links */}
            <nav
              className="flex-1 overflow-y-auto space-y-1.5 py-2"
              aria-label={tNav("mobileMenu")}
            >
              {allowedMobileNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors min-h-11",
                      item.isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-5 shrink-0",
                        item.isActive ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Drawer User & Footer Controls */}
            <div className="pt-4 border-t border-border space-y-4">
              {/* User Profile Card */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/60 border border-border">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-foreground font-bold text-xs border border-border">
                    {initials}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {user.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-2 py-0.5 font-medium shrink-0",
                    userRoleStyle.badgeClass
                  )}
                >
                  {tRoles(user.role)}
                </Badge>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ThemeSwitcher />
                  <LanguageSwitcher locale={locale} />
                </div>
                <LogoutButton />
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
