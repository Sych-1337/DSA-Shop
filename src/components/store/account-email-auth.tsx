"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { mergeGuestAfterAuthAction } from "@/features/account/auth-actions";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";

export function AccountEmailAuth() {
  const t = useTranslations("account");
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-border bg-background p-4">
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          className={mode === "signin" ? "font-semibold text-primary" : "text-muted-foreground"}
          onClick={() => setMode("signin")}
        >
          {t("authSignInTab")}
        </button>
        <span className="text-muted-foreground">·</span>
        <button
          type="button"
          className={mode === "signup" ? "font-semibold text-primary" : "text-muted-foreground"}
          onClick={() => setMode("signup")}
        >
          {t("authSignUpTab")}
        </button>
      </div>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          const form = new FormData(event.currentTarget);
          const email = String(form.get("email") ?? "").trim();
          const password = String(form.get("password") ?? "");
          const name = String(form.get("name") ?? "").trim();

          startTransition(async () => {
            const result =
              mode === "signup"
                ? await authClient.signUp.email({
                    email,
                    password,
                    name: name || email.split("@")[0] || "D&A",
                  })
                : await authClient.signIn.email({ email, password });

            if (result.error) {
              setError(result.error.message || t("authFailed"));
              return;
            }

            await mergeGuestAfterAuthAction();
            router.refresh();
          });
        }}
      >
        {mode === "signup" ? (
          <label className="block space-y-1 text-sm">
            <span>{t("firstName")}</span>
            <input
              name="name"
              className="h-11 w-full rounded-xl border border-border px-3"
              placeholder={t("authNamePlaceholder")}
            />
          </label>
        ) : null}
        <label className="block space-y-1 text-sm">
          <span>{t("email")}</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-11 w-full rounded-xl border border-border px-3"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("authPassword")}</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="h-11 w-full rounded-xl border border-border px-3"
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending
            ? t("authWorking")
            : mode === "signup"
              ? t("authSignUp")
              : t("authSignIn")}
        </Button>
      </form>
    </div>
  );
}
