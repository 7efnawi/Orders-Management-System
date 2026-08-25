"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ErrorCode = "INVALID_CREDENTIALS" | "NOT_AUTHORIZED" | "INACTIVE" | "VALIDATION_ERROR" | "NETWORK";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ErrorCode | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .safeParse({ email, password });
    if (!parsed.success) {
      setError("VALIDATION_ERROR");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { code?: string } | null;
        const code = (body?.code as ErrorCode) ?? (res.status === 401 ? "INVALID_CREDENTIALS" : "NETWORK");
        setError(code);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("NETWORK");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error === "VALIDATION_ERROR" || error === "INVALID_CREDENTIALS"}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error === "VALIDATION_ERROR" || error === "INVALID_CREDENTIALS"}
              required
            />
            {error ? (
              <p role="alert" className="text-destructive text-sm">
                {t(`errors.${error}`)}
              </p>
            ) : null}
          </div>
          <Button type="submit" disabled={loading} className="mt-2 h-11">
            {loading ? t("signingIn") : t("signIn")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
