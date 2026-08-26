"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Clock, Loader2, LockOpen, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface OpenShiftCardProps {
  cashierName: string;
  cashierRole?: string;
  onShiftOpened: () => void | Promise<void>;
}

export function OpenShiftCard({
  cashierName,
  cashierRole = "CASHIER",
  onShiftOpened,
}: OpenShiftCardProps) {
  const t = useTranslations("closing.openShiftCard");
  const tRoles = useTranslations("roles");
  const [opening, setOpening] = useState(false);

  const handleOpenShift = async () => {
    setOpening(true);
    try {
      const res = await fetch("/api/shifts/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || t("errorToast"));
      }

      toast.success(t("successToast"));
      await onShiftOpened();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("errorToast");
      toast.error(msg);
    } finally {
      setOpening(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Clock className="h-7 w-7" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight">
          {t("title")}
        </CardTitle>
        <CardDescription className="mx-auto max-w-md text-sm mt-1 text-muted-foreground">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 pt-4 pb-8">
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          <UserCheck className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">{cashierName}</span>
          <Badge variant="outline" className="text-xs">
            {tRoles(cashierRole as "OWNER" | "MANAGER" | "CASHIER")}
          </Badge>
        </div>

        <Button
          size="lg"
          onClick={handleOpenShift}
          disabled={opening}
          className="h-11 px-8 font-semibold shadow-sm gap-2 text-base"
        >
          {opening ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t("openingButton")}</span>
            </>
          ) : (
            <>
              <LockOpen className="h-5 w-5" />
              <span>{t("openButton")}</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
