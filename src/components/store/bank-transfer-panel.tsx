"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { reportBankTransferPaidAction } from "@/features/checkout/actions";
import { formatMoney } from "@/lib/money";
import type { FopRequisites } from "@/lib/commerce/fop";

function CopyRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const t = useTranslations("checkout");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background/40 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={
              mono
                ? "mt-0.5 break-all font-mono text-sm font-medium"
                : "mt-0.5 break-words text-sm font-medium"
            }
          >
            {value}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold hover:border-primary hover:text-primary"
          aria-label={`${t("copy")} ${label}`}
        >
          {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          {copied ? t("copied") : t("copy")}
        </button>
      </div>
    </div>
  );
}

export function BankTransferPanel({
  orderNumber,
  totalAmount,
  fop,
  accessToken,
  alreadyReportedPaid,
}: {
  orderNumber: string;
  totalAmount: number;
  fop: FopRequisites;
  accessToken: string;
  alreadyReportedPaid: boolean;
}) {
  const t = useTranslations("checkout");
  const [reported, setReported] = useState(alreadyReportedPaid);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const amountLabel = formatMoney(totalAmount);
  const amountPlain = (totalAmount / 100).toFixed(2);

  function onReportPaid() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("orderNumber", orderNumber);
      formData.set("token", accessToken);
      const result = await reportBankTransferPaidAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setReported(true);
      setDialogOpen(true);
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold">{t("bankTransferTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("bankTransferLead")}</p>
          <p className="text-2xl font-bold">{amountLabel}</p>

          <div className="space-y-2">
            <CopyRow label={t("total")} value={amountPlain} mono />
            <CopyRow label={t("bankIban")} value={fop.iban} mono />
            <CopyRow label={t("bankRecipient")} value={fop.name} />
            <CopyRow label={t("bankEdrpou")} value={fop.edrpou} mono />
            <CopyRow label={t("bankName")} value={fop.bankName} />
            <CopyRow label={t("bankPurpose")} value={fop.purpose} />
          </div>

          <p className="text-xs text-muted-foreground">
            {t("bankTransferWait", { order: orderNumber })}
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-surface p-5 text-center shadow-[var(--shadow-card)]">
          <div>
            <h2 className="text-lg font-semibold">{t("bankQrTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("bankQrLead")}</p>
          </div>
          <div className="mx-auto w-fit rounded-2xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fop.qrImageUrl}
              alt={t("bankQrAlt")}
              width={220}
              height={220}
              className="size-[220px]"
              decoding="async"
            />
          </div>
          <dl className="space-y-1 text-sm">
            <div>
              <dt className="inline text-muted-foreground">{t("bankRecipient")}: </dt>
              <dd className="inline font-medium">{fop.name}</dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">{t("bankName")}: </dt>
              <dd className="inline font-medium">{fop.bankName}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        {reported ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-success">{t("paidReportedTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("paidReportedLead")}</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setDialogOpen(true)}>
              {t("paidThanksOpen")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{t("paidReportTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("paidReportLead")}</p>
            </div>
            <Button
              type="button"
              size="lg"
              className="w-full shrink-0 sm:w-auto"
              disabled={pending}
              onClick={onReportPaid}
            >
              {pending ? t("paidReporting") : t("paidReportButton")}
            </Button>
          </div>
        )}
        {error ? (
          <p className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </section>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <p className="text-display text-xl font-semibold text-success">{t("paidThanksTitle")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("paidThanksLead")}</p>
        <p className="mt-3 rounded-xl bg-surface-muted px-3 py-2 font-mono text-sm font-semibold">
          {orderNumber}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button href="/" className="w-full flex-1" size="md">
            {t("paidThanksHome")}
          </Button>
          <Button href="/account/orders" variant="secondary" className="w-full flex-1" size="md">
            {t("paidThanksOrders")}
          </Button>
        </div>
        <button
          type="button"
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setDialogOpen(false)}
        >
          {t("paidThanksStay")}
        </button>
      </Dialog>
    </div>
  );
}
