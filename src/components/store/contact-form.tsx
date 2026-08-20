"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { submitContactMessage } from "@/features/contact/actions";

export function ContactForm() {
  const t = useTranslations("contact");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await submitContactMessage(formData);
          if (!result.ok) {
            setStatus("error");
            setError(t(result.error));
            return;
          }
          setStatus("ok");
          setError(null);
          event.currentTarget.reset();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>{t("name")}</span>
          <input
            name="name"
            required
            className="h-11 w-full rounded-xl border border-border bg-background px-3"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("email")}</span>
          <input
            name="email"
            type="email"
            required
            className="h-11 w-full rounded-xl border border-border bg-background px-3"
          />
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span>{t("topic")}</span>
        <input
          name="topic"
          className="h-11 w-full rounded-xl border border-border bg-background px-3"
          placeholder={t("topicPlaceholder")}
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>{t("message")}</span>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
        />
      </label>
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
        {pending ? t("sending") : t("send")}
      </Button>
      {status === "ok" ? <p className="text-sm font-medium text-success">{t("success")}</p> : null}
      {status === "error" && error ? <p className="text-sm text-danger">{error}</p> : null}
    </form>
  );
}
