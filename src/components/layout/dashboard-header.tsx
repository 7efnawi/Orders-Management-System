"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Role } from "@prisma/client";
import {
  LayoutGrid,
  UtensilsCrossed,
  Truck,
  Wallet,
  History,
  Plus,
  Flame,
  Menu,
  X,
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
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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

  // Handle escape key
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileMenuOpen]);

  const navItems = [
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
  ];

  const allowedNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const roleStyles: Record<Role, { badgeClass: string; dotClass: string }> = {
    OWNER: {
      badgeClass:
        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      dotClass: "bg-amber-500",
    },
    MANAGER: {
      badgeClass:
        "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      dotClass: "bg-indigo-500",
    },
    CASHIER: {
      badgeClass:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      dotClass: "bg-emerald-500",
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
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80 transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
          {/* Left / Brand + Nav Section */}
          <div className="flex min-w-0 items-center gap-4 lg:gap-6">
            {/* Mobile Menu Trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10 min-h-11 min-w-11 rounded-xl text-foreground"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={tNav("openNavigation")}
            >
              <Menu className="size-5" />
            </Button>

            {/* Brand Logo & Title */}
            <Link
              href="/orders"
              className="group flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1 transition-transform active:scale-[0.98]"
            >
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30 ring-1 ring-primary/20 group-hover:scale-105 transition-transform">
                <Flame className="size-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-sm sm:text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {tCommon("appName")}
                </span>
                <span className="truncate text-[10px] sm:text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                  {tNav("brandTag")}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Pills */}
            <nav
              className="hidden lg:flex items-center gap-1.5 ms-2"
              aria-label={tNav("dashboard")}
            >
              {allowedNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 min-h-11 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      item.isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        item.isActive ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action & User Controls */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Persistent "+ New Order" CTA Button */}
            <Link href="/orders/new">
              <Button
                size="touch"
                className={cn(
                  "font-semibold shadow-md transition-all duration-150 active:scale-[0.98]",
                  isNewOrderActive
                    ? "bg-primary/90 ring-2 ring-primary ring-offset-2 ring-offset-background text-primary-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25"
                )}
                aria-label={tNav("newOrderCTA")}
              >
                <Plus className="size-5 shrink-0" />
                <span className="hidden sm:inline">{tNav("newOrderCTA")}</span>
              </Button>
            </Link>

            {/* User Profile Pill (Desktop) */}
            <div className="hidden xl:flex items-center gap-2.5 ps-2 border-s border-border/80">
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground font-bold text-xs border border-border"
                title={user.name}
              >
                {initials}
              </div>
              <div className="flex flex-col min-w-0 max-w-[120px]">
                <span className="truncate text-xs font-semibold text-foreground">
                  {user.name}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 font-medium w-fit",
                    userRoleStyle.badgeClass
                  )}
                >
                  {tRoles(user.role)}
                </Badge>
              </div>
            </div>

            {/* Controls: Language, Theme, Logout */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <ThemeSwitcher />
              <div className="px-1">
                <LanguageSwitcher locale={locale} />
              </div>
              <div className="hidden sm:block">
                <LogoutButton />
              </div>
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
              {allowedNavItems.map((item) => {
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
