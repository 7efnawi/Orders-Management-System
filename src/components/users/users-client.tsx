"use client";

import * as React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Role } from "@prisma/client";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  ShieldCheck,
  Calculator,
  Search,
  Plus,
  Edit2,
  Calendar,
  Filter,
  RefreshCw,
  Trash2,
  RotateCcw,
  KeyRound,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserDialog, type ManagedUserRow } from "@/components/users/user-dialog";
import { cn } from "@/lib/utils";

interface UsersClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  initialUsers: ManagedUserRow[];
}

export function UsersClient({ currentUser, initialUsers }: UsersClientProps) {
  const t = useTranslations("users");
  const tRoles = useTranslations("roles");
  const tAuth = useTranslations("auth");
  const format = useFormatter();

  const [usersList, setUsersList] = React.useState<ManagedUserRow[]>(initialUsers);
  const [search, setSearch] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<Role | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [dialogState, setDialogState] = React.useState<
    { mode: "create" } | { mode: "edit"; user: ManagedUserRow } | null
  >(null);
  const [deleteTargetUser, setDeleteTargetUser] = React.useState<ManagedUserRow | null>(null);
  const [reactivatedCredentials, setReactivatedCredentials] = React.useState<{
    name: string;
    email: string;
    tempPassword: string;
  } | null>(null);
  const [reactivateCopied, setReactivateCopied] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  async function refreshUsers() {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleCopyReactivatedPassword() {
    if (!reactivatedCredentials) return;
    try {
      await navigator.clipboard.writeText(reactivatedCredentials.tempPassword);
      setReactivateCopied(true);
      toast.success(t("dialog.copied"));
      setTimeout(() => setReactivateCopied(false), 3000);
    } catch {
      // ignore
    }
  }

  async function handleToggleStatus(user: ManagedUserRow) {
    if (user.id === currentUser.id) {
      toast.error(t("toast.cannotDeactivateSelf"));
      return;
    }

    const nextStatus = !user.isActive;
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || t("toast.error"));
      }

      const data = await res.json();
      setUsersList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u))
      );

      if (nextStatus && data.tempPassword) {
        toast.success(t("toast.reactivated"));
        setReactivatedCredentials({
          name: user.name,
          email: user.email,
          tempPassword: data.tempPassword,
        });
      } else {
        toast.success(t("toast.statusChanged"));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("toast.error");
      toast.error(msg);
    }
  }

  async function handleDeleteUser() {
    if (!deleteTargetUser) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteTargetUser.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || t("toast.error"));
      }

      toast.success(t("toast.deleted"));
      setUsersList((prev) =>
        prev.map((u) => (u.id === deleteTargetUser.id ? { ...u, isActive: false } : u))
      );
      setDeleteTargetUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("toast.error");
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  }

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = usersList.length;
    const active = usersList.filter((u) => u.isActive).length;
    const owners = usersList.filter((u) => u.role === Role.OWNER).length;
    const managers = usersList.filter((u) => u.role === Role.MANAGER).length;
    const cashiers = usersList.filter((u) => u.role === Role.CASHIER).length;
    return { total, active, owners, managers, cashiers };
  }, [usersList]);

  // Filtered users
  const filteredUsers = React.useMemo(() => {
    return usersList.filter((u) => {
      // Role filter
      if (selectedRole !== "ALL" && u.role !== selectedRole) {
        return false;
      }
      // Status filter
      if (selectedStatus === "ACTIVE" && !u.isActive) return false;
      if (selectedStatus === "INACTIVE" && u.isActive) return false;

      // Search term
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const matchesName = u.name.toLowerCase().includes(term);
        const matchesEmail = u.email.toLowerCase().includes(term);
        return matchesName || matchesEmail;
      }

      return true;
    });
  }, [usersList, selectedRole, selectedStatus, search]);

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

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Header & Action Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refreshUsers}
            disabled={isRefreshing}
            className="h-10 text-xs sm:text-sm font-medium"
          >
            <RefreshCw
              className={cn("me-1.5 size-4", isRefreshing && "animate-spin")}
            />
            {t("refresh")}
          </Button>

          <Button
            size="sm"
            onClick={() => setDialogState({ mode: "create" })}
            className="h-10 font-semibold shadow-xs text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0"
          >
            <Plus className="size-4" />
            <span>{t("addUser")}</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Total Users */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl border border-border/70 bg-card/70 shadow-2xs backdrop-blur-xs hover:border-border transition-colors">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Users className="size-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-muted-foreground truncate">
              {t("stats.total")}
            </span>
            <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
              {stats.total}
            </span>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl border border-border/70 bg-card/70 shadow-2xs backdrop-blur-xs hover:border-border transition-colors">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <UserCheck className="size-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-muted-foreground truncate">
              {t("stats.active")}
            </span>
            <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
              {stats.active}
            </span>
          </div>
        </div>

        {/* Owners */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl border border-border/70 bg-card/70 shadow-2xs backdrop-blur-xs hover:border-border transition-colors">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-muted-foreground truncate">
              {t("stats.owners")}
            </span>
            <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
              {stats.owners}
            </span>
          </div>
        </div>

        {/* Managers */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl border border-border/70 bg-card/70 shadow-2xs backdrop-blur-xs hover:border-border transition-colors">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <UserCheck className="size-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-muted-foreground truncate">
              {t("stats.managers")}
            </span>
            <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
              {stats.managers}
            </span>
          </div>
        </div>

        {/* Cashiers */}
        <div className="col-span-2 sm:col-span-1 flex items-center gap-3.5 p-4 rounded-xl border border-border/70 bg-card/70 shadow-2xs backdrop-blur-xs hover:border-border transition-colors">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Calculator className="size-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-muted-foreground truncate">
              {t("stats.cashiers")}
            </span>
            <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
              {stats.cashiers}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-3.5 rounded-xl border border-border/70 bg-card/50 shadow-2xs">
        {/* Search Box */}
        <div className="relative flex-1 min-w-0 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-9 h-10 rounded-lg bg-background/80 text-xs sm:text-sm"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filters */}
          <div className="flex items-center rounded-lg bg-muted/60 p-1 border border-border/60">
            <button
              onClick={() => setSelectedRole("ALL")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                selectedRole === "ALL"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("filters.allRoles")}
            </button>
            <button
              onClick={() => setSelectedRole(Role.OWNER)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                selectedRole === Role.OWNER
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tRoles(Role.OWNER)}
            </button>
            <button
              onClick={() => setSelectedRole(Role.MANAGER)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                selectedRole === Role.MANAGER
                  ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tRoles(Role.MANAGER)}
            </button>
            <button
              onClick={() => setSelectedRole(Role.CASHIER)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                selectedRole === Role.CASHIER
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tRoles(Role.CASHIER)}
            </button>
          </div>

          {/* Status Filters */}
          <div className="flex items-center rounded-lg bg-muted/60 p-1 border border-border/60">
            <button
              onClick={() => setSelectedStatus("ALL")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                selectedStatus === "ALL"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("filters.allStatuses")}
            </button>
            <button
              onClick={() => setSelectedStatus("ACTIVE")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                selectedStatus === "ACTIVE"
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("filters.activeOnly")}
            </button>
            <button
              onClick={() => setSelectedStatus("INACTIVE")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                selectedStatus === "INACTIVE"
                  ? "bg-red-500/20 text-red-700 dark:text-red-400 shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("filters.inactiveOnly")}
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-4 py-3.5 text-start font-semibold">{t("table.user")}</th>
                <th className="px-4 py-3.5 text-start font-semibold">{t("table.role")}</th>
                <th className="px-4 py-3.5 text-start font-semibold">{t("table.status")}</th>
                <th className="px-4 py-3.5 text-start font-semibold hidden md:table-cell">{t("table.createdAt")}</th>
                <th className="px-4 py-3.5 text-end font-semibold">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="size-8 text-muted-foreground/60" />
                      <p className="text-sm font-medium">{t("table.empty")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelf = user.id === currentUser.id;
                  const canEdit =
                    isSelf ||
                    currentUser.role === Role.OWNER ||
                    (currentUser.role === Role.MANAGER && user.role === Role.CASHIER);
                  const canDelete =
                    !isSelf &&
                    (currentUser.role === Role.OWNER ||
                      (currentUser.role === Role.MANAGER && user.role === Role.CASHIER));
                  const roleStyle = roleStyles[user.role] || roleStyles.CASHIER;

                  const initials = user.name
                    ? user.name
                        .trim()
                        .split(/\s+/)
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "U";

                  const formattedDate = format.dateTime(new Date(user.createdAt), {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        !user.isActive && "opacity-60 bg-muted/10"
                      )}
                    >
                      {/* User Info & Avatar */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-full font-bold text-xs border shadow-2xs",
                              roleStyle.avatarClass
                            )}
                          >
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground truncate">
                                {user.name}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 rounded font-medium">
                                  (أنت)
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground truncate font-mono" dir="ltr">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-3.5">
                        <Badge
                          variant="outline"
                          className={cn("px-2 py-0.5 font-semibold text-xs border", roleStyle.badgeClass)}
                        >
                          {tRoles(user.role)}
                        </Badge>
                      </td>

                      {/* Active Status Switch */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.isActive}
                            disabled={isSelf}
                            onCheckedChange={() => handleToggleStatus(user)}
                            aria-label={t("table.status")}
                          />
                          <span
                            className={cn(
                              "text-xs font-medium",
                              user.isActive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground"
                            )}
                          >
                            {user.isActive ? t("table.active") : t("table.inactive")}
                          </span>
                        </div>
                      </td>

                      {/* Created At Date */}
                      <td className="px-4 py-3.5 hidden md:table-cell text-muted-foreground text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-muted-foreground/70" />
                          <span className="tabular-nums" suppressHydrationWarning>
                            {formattedDate}
                          </span>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3.5 text-end">
                        <div className="flex items-center justify-end gap-1">
                          {!user.isActive && canEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(user)}
                              className="h-8.5 px-2.5 gap-1.5 rounded-lg border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold cursor-pointer"
                            >
                              <RotateCcw className="size-3.5" />
                              <span className="hidden sm:inline">{t("table.reactivate")}</span>
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDialogState({ mode: "edit", user })}
                              className="h-8.5 px-2.5 gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted font-medium cursor-pointer"
                            >
                              <Edit2 className="size-3.5" />
                              <span className="hidden sm:inline">{t("editUser")}</span>
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTargetUser(user)}
                              className="h-8.5 px-2.5 gap-1.5 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 font-medium cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                              <span className="sr-only sm:not-sr-only sm:inline">
                                {t("deleteConfirm.confirm")}
                              </span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Creation / Editing Modal */}
      {dialogState && (
        <UserDialog
          state={dialogState}
          currentUserId={currentUser.id}
          currentUserRole={currentUser.role}
          onClose={() => setDialogState(null)}
          onSaved={() => {
            setDialogState(null);
            refreshUsers();
          }}
        />
      )}

      {/* Reactivation Credentials Modal */}
      {reactivatedCredentials && (
        <Dialog
          open={true}
          onOpenChange={(open) => !open && setReactivatedCredentials(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <KeyRound className="size-6" />
              </div>
              <DialogTitle className="text-center font-bold text-lg">
                {t("dialog.reactivateTitle")}
              </DialogTitle>
              <DialogDescription className="text-center text-xs text-muted-foreground pt-1">
                {t("dialog.reactivateDesc")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5 rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs sm:text-sm my-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("dialog.name")}:</span>
                <span className="font-semibold text-foreground">
                  {reactivatedCredentials.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("dialog.email")}:</span>
                <span className="font-mono text-foreground" dir="ltr">
                  {reactivatedCredentials.email}
                </span>
              </div>
              <div className="pt-2.5 border-t border-border/60 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-foreground">
                  {tAuth("password")}:
                </span>
                <div className="flex items-center gap-2">
                  <code
                    className="rounded-lg bg-background px-3 py-1.5 font-mono text-sm font-bold tracking-wider text-primary border border-primary/30 select-all"
                    dir="ltr"
                  >
                    {reactivatedCredentials.tempPassword}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyReactivatedPassword}
                    className="h-8.5 px-3 gap-1.5 cursor-pointer shrink-0"
                  >
                    {reactivateCopied ? (
                      <>
                        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          {t("dialog.copied")}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span className="text-xs">{t("dialog.copyPassword")}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                onClick={() => setReactivatedCredentials(null)}
                className="w-full h-10 font-semibold cursor-pointer"
              >
                {t("dialog.confirmDone")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteTargetUser && (
        <Dialog
          open={true}
          onOpenChange={(open) => !open && !isDeleting && setDeleteTargetUser(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="size-5" />
                {t("deleteConfirm.title")}
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm text-muted-foreground leading-relaxed">
                {t("deleteConfirm.desc", { name: deleteTargetUser.name })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTargetUser(null)}
                disabled={isDeleting}
                className="cursor-pointer"
              >
                {t("deleteConfirm.cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="cursor-pointer gap-1.5"
              >
                {isDeleting && <RefreshCw className="size-3.5 animate-spin" />}
                {isDeleting ? t("deleteConfirm.deleting") : t("deleteConfirm.confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
