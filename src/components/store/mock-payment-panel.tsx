"use client";

import { CreditCard, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { settleMockPaymentAction } from "@/features/checkout/actions";
import { useRouter } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";

type Outcome =
  | "paid"
  | "declined"
  | "insufficient_funds"
  | "cancelled"
  | "provider_error"
  | "network_error"
  | "timeout";

const OUTCOMES: Outcome[] = [
  "paid",
  "declined",
  "insufficient_funds",
  "cancelled",
  "provider_error",
  "network_error",
  "timeout",
];

export function MockPaymentPanel({
  orderNumber,
  totalAmount,
  customerEmail,
  alreadyFailed,
  accessToken,
}: {
  orderNumber: string;
  totalAmount: number;
  customerEmail: string;
  alreadyFailed: boolean;
  accessToken: string;
}) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState("4111 1111 1111 1111");
  const [expiry, setExpiry] = useState("12/30");
  const [cvc, setCvc] = useState("123");

  function run(outcome: Outcome) {
    setError(null);
    startTransition(async () => {
      // Soft errors: short fake “wait” so the UX feels like acquiring.
      if (outcome === "network_error" || outcome === "timeout") {
        await new Promise((resolve) => setTimeout(resolve, outcome === "timeout" ? 1600 : 700));
      }

      const formData = new FormData();
      formData.set("orderNumber", orderNumber);
      formData.set("outcome", outcome);
      formData.set("token", accessToken);
      const result = await settleMockPaymentAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.redirectUrl);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
        <p className="font-semibold text-amber-200">{t("payStubBadge")}</p>
        <p className="mt-1 text-muted-foreground">{t("payStubLead")}</p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-display text-xl font-semibold">{t("payTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("orderNumber", { number: orderNumber })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{customerEmail}</p>
          </div>
          <Shield className="size-5 text-muted-foreground" aria-hidden />
        </div>

        <p className="mt-5 text-3xl font-bold text-primary">{formatMoney(totalAmount)}</p>

        <div className="mt-6 space-y-3" aria-hidden>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">{t("payCardNumber")}</span>
            <div className="relative">
              <CreditCard className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={card}
                onChange={(event) => setCard(event.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background pr-3 pl-10 outline-none focus:border-primary"
                inputMode="numeric"
                autoComplete="cc-number"
              />
            </div>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted-foreground">{t("payExpiry")}</span>
              <input
                value={expiry}
                onChange={(event) => setExpiry(event.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
                autoComplete="cc-exp"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted-foreground">{t("payCvc")}</span>
              <input
                value={cvc}
                onChange={(event) => setCvc(event.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
                autoComplete="cc-csc"
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">{t("payCardHint")}</p>
        </div>

        {alreadyFailed ? (
          <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {t("payPreviousFailed")}
          </p>
        ) : null}

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

        <div className="mt-6">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={pending}
            onClick={() => run("paid")}
          >
            {pending ? t("payProcessing") : t("paySuccessCta")}
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-border bg-surface/60 p-5">
        <h3 className="text-sm font-semibold">{t("paySimulateTitle")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("paySimulateLead")}</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {OUTCOMES.map((outcome) => (
            <li key={outcome}>
              <Button
                type="button"
                variant={outcome === "paid" ? "primary" : "outline"}
                size="sm"
                className="w-full justify-start"
                disabled={pending}
                onClick={() => run(outcome)}
              >
                {t(`payOutcome_${outcome}`)}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
