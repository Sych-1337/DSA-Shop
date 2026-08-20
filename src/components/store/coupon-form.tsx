"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { applyCouponAction, removeCouponAction } from "@/features/coupons/actions";

export function CouponForm({
  appliedCode,
  customerEmail,
}: {
  appliedCode: string | null;
  customerEmail?: string;
}) {
  const t = useTranslations("cart");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  if (appliedCode) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 px-3 py-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <p>
            <span className="text-muted-foreground">{t("couponApplied")}</span>{" "}
            <span className="font-semibold">{appliedCode}</span>
          </p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                await removeCouponAction();
              });
            }}
          >
            {t("couponRemove")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const formData = new FormData();
        formData.set("code", code);
        if (customerEmail) formData.set("email", customerEmail);
        startTransition(async () => {
          const result = await applyCouponAction(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setCode("");
        });
      }}
    >
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted-foreground">{t("couponLabel")}</span>
        <div className="flex gap-2">
          <input
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder={t("couponPlaceholder")}
            className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 uppercase outline-none focus:border-primary"
            autoComplete="off"
          />
          <Button type="submit" variant="secondary" disabled={pending || !code.trim()}>
            {pending ? t("couponApplying") : t("couponApply")}
          </Button>
        </div>
      </label>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <p className="text-xs text-muted-foreground">{t("couponHint")}</p>
    </form>
  );
}
