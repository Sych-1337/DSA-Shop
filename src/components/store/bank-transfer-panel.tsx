"use client";

import { useTranslations } from "next-intl";

import { formatMoney } from "@/lib/money";
import type { FopRequisites } from "@/lib/commerce/fop";

export function BankTransferPanel({
  orderNumber,
  totalAmount,
  fop,
}: {
  orderNumber: string;
  totalAmount: number;
  fop: FopRequisites;
}) {
  const t = useTranslations("checkout");

  return (
    <div className="mt-6 space-y-6">
      <section className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold">{t("bankTransferTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("bankTransferLead")}</p>
        <p className="text-2xl font-bold">{formatMoney(totalAmount)}</p>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{t("bankIban")}</dt>
            <dd className="mt-0.5 break-all font-mono text-sm font-medium">{fop.iban}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("bankRecipient")}</dt>
            <dd className="mt-0.5 font-medium">{fop.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("bankEdrpou")}</dt>
            <dd className="mt-0.5 font-medium">{fop.edrpou}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("bankName")}</dt>
            <dd className="mt-0.5 font-medium">{fop.bankName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("bankPurpose")}</dt>
            <dd className="mt-0.5 font-semibold">{fop.purpose}</dd>
          </div>
        </dl>

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
          {/* Plain img — next/image optimizer broke this static asset in prod */}
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
  );
}
