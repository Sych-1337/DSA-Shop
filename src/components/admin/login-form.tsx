"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { safeAdminNext } from "@/lib/security/admin-next";

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeAdminNext(params.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setError(null);

    startTransition(async () => {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || "Невірний логін або пароль");
        return;
      }
      router.replace(next);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-sm space-y-4">
      <label className="block text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Пароль
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Вхід…" : "Увійти"}
      </Button>
    </form>
  );
}
