"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function TrackOrderForm({
  defaultOrder = "",
  defaultEmail = "",
}: {
  defaultOrder?: string;
  defaultEmail?: string;
}) {
  const t = useTranslations("track");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const order = String(data.get("order") ?? "").trim();
        const email = String(data.get("email") ?? "").trim();
        if (!order || !email) return;
        setPending(true);
        const params = new URLSearchParams({ order, email });
        router.push(`/track-order?${params.toString()}`);
        router.refresh();
        setPending(false);
      }}
    >
      <label className="block space-y-1 text-sm">
        <span>{t("orderNumber")}</span>
        <input
          name="order"
          required
          defaultValue={defaultOrder}
          placeholder="KW-…"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-sm"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>{t("email")}</span>
        <input
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          className="h-11 w-full rounded-xl border border-border bg-background px-3"
        />
      </label>
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
        {pending ? t("searching") : t("submit")}
      </Button>
    </form>
  );
}
