"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ShieldCheck,
  UserCheck,
  Calculator,
  KeyRound,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ManagedUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string | Date;
}

const createUserFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email format"),
  role: z.nativeEnum(Role),
});

const updateUserFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  role: z.nativeEnum(Role),
  isActive: z.boolean(),
});

export function UserDialog({
  state,
  currentUserId,
  currentUserRole,
  onClose,
  onSaved,
}: {
  state: { mode: "create" } | { mode: "edit"; user: ManagedUserRow } | null;
  currentUserId: string;
  currentUserRole: Role;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("users");
  const editing = state?.mode === "edit" ? state.user : null;

  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? t("dialog.editTitle") : t("dialog.addTitle")}
          </DialogTitle>
        </DialogHeader>
        <UserForm
          key={editing?.id ?? "create"}
          editingUser={editing}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onClose={onClose}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

function UserForm({
  editingUser,
  currentUserId,
  currentUserRole,
  onClose,
  onSaved,
}: {
  editingUser: ManagedUserRow | null;
  currentUserId: string;
  currentUserRole: Role;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("users");
  const tRoles = useTranslations("roles");
  const tAuth = useTranslations("auth");

  const isSelf = editingUser?.id === currentUserId;

  const [name, setName] = useState(editingUser?.name ?? "");
  const [email, setEmail] = useState(editingUser?.email ?? "");
  const [role, setRole] = useState<Role>(editingUser?.role ?? Role.CASHIER);
  const [isActive, setIsActive] = useState<boolean>(editingUser?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    tempPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const allRoleOptions: Array<{
    role: Role;
    icon: typeof ShieldCheck;
    colorClass: string;
    borderClass: string;
  }> = [
    {
      role: Role.OWNER,
      icon: ShieldCheck,
      colorClass: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
      borderClass: "border-amber-500/30 hover:border-amber-500",
    },
    {
      role: Role.MANAGER,
      icon: UserCheck,
      colorClass: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
      borderClass: "border-indigo-500/30 hover:border-indigo-500",
    },
    {
      role: Role.CASHIER,
      icon: Calculator,
      colorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
      borderClass: "border-emerald-500/30 hover:border-emerald-500",
    },
  ];

  // المدير يمكنه فقط إدارة الكاشير
  const roleOptions =
    currentUserRole === "MANAGER"
      ? allRoleOptions.filter((r) => r.role === Role.CASHIER)
      : allRoleOptions;

  async function handleCopy() {
    if (!createdCredentials) return;
    try {
      await navigator.clipboard.writeText(createdCredentials.tempPassword);
      setCopied(true);
      toast.success(t("dialog.copied"));
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // ignore
    }
  }

  async function onSave(e?: React.FormEvent) {
    if (e) e.preventDefault();

    if (editingUser) {
      const parsed = updateUserFormSchema.safeParse({ name, role, isActive });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message || t("toast.error"));
        return;
      }

      if (isSelf && !isActive) {
        setError(t("toast.cannotDeactivateSelf"));
        return;
      }

      if (isSelf && role !== Role.OWNER) {
        setError(t("toast.cannotDeactivateSelf"));
        return;
      }

      setError(null);
      setSaving(true);

      try {
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: parsed.data.name,
            role: parsed.data.role,
            isActive: parsed.data.isActive,
          }),
        });

        const data = await res.json();
        if (!editingUser.isActive && parsed.data.isActive && data.tempPassword) {
          toast.success(t("toast.reactivated"));
          setCreatedCredentials({
            name: parsed.data.name,
            email: editingUser.email,
            tempPassword: data.tempPassword,
          });
        } else {
          toast.success(t("toast.updated"));
          onSaved();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : t("toast.error");
        toast.error(msg);
      } finally {
        setSaving(false);
      }
    } else {
      const parsed = createUserFormSchema.safeParse({ name, email, role });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message || t("toast.error"));
        return;
      }

      setError(null);
      setSaving(true);

      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: parsed.data.name,
            email: parsed.data.email,
            role: parsed.data.role,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || t("toast.error"));
        }

        const data = await res.json();
        toast.success(t("toast.created"));

        if (data.tempPassword) {
          setCreatedCredentials({
            name: parsed.data.name,
            email: parsed.data.email,
            tempPassword: data.tempPassword,
          });
        } else {
          onSaved();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : t("toast.error");
        toast.error(msg);
      } finally {
        setSaving(false);
      }
    }
  }

  // بطاقة عرض كلمة المرور المؤقتة بعد نجاح الإنشاء
  if (createdCredentials) {
    return (
      <div className="space-y-4 py-1">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
          <div className="mx-auto mb-2.5 flex size-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <KeyRound className="size-5" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {t("dialog.tempPasswordTitle")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("dialog.tempPasswordDesc")}
          </p>
        </div>

        <div className="space-y-2.5 rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("dialog.name")}:</span>
            <span className="font-semibold text-foreground">
              {createdCredentials.name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("dialog.email")}:</span>
            <span className="font-mono text-foreground" dir="ltr">
              {createdCredentials.email}
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
                {createdCredentials.tempPassword}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8.5 px-3 gap-1.5 cursor-pointer shrink-0"
              >
                {copied ? (
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
            onClick={() => {
              onSaved();
            }}
            className="w-full h-10 font-semibold cursor-pointer"
          >
            {t("dialog.confirmDone")}
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      {/* Full Name */}
      <div className="grid gap-2">
        <Label htmlFor="user-name">{t("dialog.name")}</Label>
        <Input
          id="user-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("dialog.namePlaceholder")}
          autoFocus
        />
      </div>

      {/* Email */}
      <div className="grid gap-2">
        <Label htmlFor="user-email">{t("dialog.email")}</Label>
        <Input
          id="user-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("dialog.emailPlaceholder")}
          disabled={editingUser !== null}
          className={editingUser ? "bg-muted cursor-not-allowed opacity-80" : ""}
          dir="ltr"
        />
      </div>

      {/* Role Selection Cards */}
      <div className="grid gap-2">
        <Label>{t("dialog.role")}</Label>
        <div
          className={cn(
            "grid gap-2",
            roleOptions.length > 1 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1"
          )}
        >
          {roleOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = role === opt.role;
            const disabledDemote = isSelf && opt.role !== Role.OWNER;

            return (
              <button
                type="button"
                key={opt.role}
                disabled={disabledDemote}
                onClick={() => setRole(opt.role)}
                className={cn(
                  "flex flex-col items-start p-3 rounded-xl border text-start transition-all duration-150 relative cursor-pointer",
                  opt.borderClass,
                  isSelected
                    ? "bg-card ring-2 ring-primary border-primary shadow-xs"
                    : "bg-card/60 hover:bg-card/90",
                  disabledDemote && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2 mb-1.5 w-full justify-between">
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg",
                      opt.colorClass
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <span className="font-semibold text-xs text-foreground">
                    {tRoles(opt.role)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight line-clamp-3">
                  {t(`dialog.roleDescriptions.${opt.role}`)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Account Status Switch (Edit Mode Only) */}
      {editingUser ? (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card/60">
          <div className="flex flex-col min-w-0 me-3">
            <span className="text-sm font-semibold text-foreground">
              {t("dialog.status")}
            </span>
            <span className="text-xs text-muted-foreground">
              {isActive ? t("dialog.activeDesc") : t("dialog.inactiveDesc")}
            </span>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
            disabled={isSelf}
            aria-label={t("dialog.status")}
          />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      ) : null}

      <DialogFooter className="gap-2 sm:gap-0 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={saving}
          className="cursor-pointer"
        >
          {t("dialog.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={
            saving || !name.trim() || (!editingUser && !email.trim())
          }
          className="cursor-pointer"
        >
          {saving
            ? t("dialog.saving")
            : editingUser
            ? t("dialog.save")
            : t("dialog.create")}
        </Button>
      </DialogFooter>
    </form>
  );
}

