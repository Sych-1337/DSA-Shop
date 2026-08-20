"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { subscribeBackInStockAction } from "@/features/back-in-stock/actions";

export function BackInStockForm({
  productId,
  variantId,
  defaultEmail = "",
}: {
  productId: string;
  variantId: string;
  defaultEmail?: string;
}) {
  const t = useTranslations("product");
  const [email, setEmail] = useState(defaultEmail);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <form
      className="mt-4 rounded-2xl border border-border bg-surface-muted/60 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        const formData = new FormData();
        formData.set("email", email);
        formData.set("productId", productId);
        formData.set("variantId", variantId);
        startTransition(async () => {
          const result = await subscribeBackInStockAction(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setSuccess(result.message);
        });
      }}
    >
      <p className="text-sm font-semibold">{t("bisTitle")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("bisLead")}</p>
      <label className="mt-3 block text-sm">
        <span className="mb-1.5 block text-muted-foreground">{t("bisEmail")}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
        />
      </label>
      <Button type="submit" variant="secondary" className="mt-3 w-full sm:w-auto" disabled={pending}>
        {pending ? t("bisWorking") : t("bisSubmit")}
      </Button>
      {success ? <p className="mt-2 text-sm text-success">{success}</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </form>
  );
}
