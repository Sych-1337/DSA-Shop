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
  fop: FopRequisites | null;
}) {
  const t = useTranslations("checkout");

  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-lg font-semibold">{t("bankTransferTitle")}</h2>
      <p className="text-sm text-muted-foreground">{t("bankTransferLead")}</p>
      <p className="text-2xl font-bold">{formatMoney(totalAmount)}</p>
      {fop ? (
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">{t("bankRecipient")}</dt>
            <dd className="font-medium">{fop.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">IBAN</dt>
            <dd className="font-mono text-sm break-all">{fop.iban}</dd>
          </div>
          {fop.edrpou ? (
            <div>
              <dt className="text-muted-foreground">{t("bankEdrpou")}</dt>
              <dd>{fop.edrpou}</dd>
            </div>
          ) : null}
          {fop.bankName ? (
            <div>
              <dt className="text-muted-foreground">{t("bankName")}</dt>
              <dd>{fop.bankName}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted-foreground">{t("bankPurpose")}</dt>
            <dd className="font-semibold">{fop.purpose}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-danger">{t("bankRequisitesMissing")}</p>
      )}
      <p className="text-xs text-muted-foreground">
        {t("bankTransferWait", { order: orderNumber })}
      </p>
    </div>
  );
}
