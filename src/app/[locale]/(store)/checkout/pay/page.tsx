import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { BankTransferPanel } from "@/components/store/bank-transfer-panel";
import { MockPaymentPanel } from "@/components/store/mock-payment-panel";
import { getOrderByNumber } from "@/features/checkout/service";
import { PaymentMethod, PaymentStatus } from "@/generated/prisma";
import { Link } from "@/i18n/navigation";
import { CUSTOMER_REPORTED_PAID_MARKER, getFopRequisites } from "@/lib/commerce/fop";
import { formatMoney } from "@/lib/money";
import { isMockPaymentAllowed } from "@/lib/security/mock-payments";
import { verifyOrderAccessToken } from "@/lib/security/order-access";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("payTitle"), robots: { index: false, follow: false } };
}

export default async function CheckoutPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string; payment?: string; token?: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("checkout");
  const { order: orderNumber, token } = await searchParams;
  if (!orderNumber || !token) {
    redirect(`/${locale}/checkout`);
  }

  const order = await getOrderByNumber(orderNumber);
  if (!order || !verifyOrderAccessToken(token, order.orderNumber, order.customerEmail)) {
    redirect(`/${locale}/checkout`);
  }

  if (order.paymentStatus === PaymentStatus.PAID) {
    redirect(`/${locale}/checkout/success?order=${order.orderNumber}&token=${token}`);
  }

  const alreadyFailed =
    order.paymentStatus === PaymentStatus.FAILED ||
    order.paymentStatus === PaymentStatus.CANCELLED;

  const isBank =
    order.paymentMethod === PaymentMethod.BANK_TRANSFER ||
    order.payments.some((p) => p.provider === "bank_transfer");
  const fop = getFopRequisites(order.orderNumber);
  const showMock = isMockPaymentAllowed() && !isBank;
  const alreadyReportedPaid = order.notes.some((note) =>
    note.body.includes(CUSTOMER_REPORTED_PAID_MARKER),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
      <p className="text-sm font-semibold tracking-wide text-primary uppercase">
        {t("payStepLabel")}
      </p>
      <h1 className="text-display mt-2 text-3xl font-semibold sm:text-4xl">{t("payTitle")}</h1>
      <p className="mt-3 text-muted-foreground">{t("payLead")}</p>

      <ul className="mt-6 max-w-xl space-y-3 rounded-2xl border border-border bg-surface p-4 text-sm shadow-[var(--shadow-card)]">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  item.imageUrl ||
                  `/api/placeholder?title=${encodeURIComponent(item.productTitle.slice(0, 1))}&hue=320`
                }
                alt=""
                className="size-12 shrink-0 rounded-lg border border-border object-cover bg-surface-muted"
              />
              <span className="min-w-0 truncate">
                {item.productTitle} × {item.quantity}
              </span>
            </div>
            <span className="shrink-0">{formatMoney(item.lineTotalAmount)}</span>
          </li>
        ))}
        <li className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
          <span>{t("total")}</span>
          <span>{formatMoney(order.totalAmount)}</span>
        </li>
      </ul>

      {isBank ? (
        <BankTransferPanel
          orderNumber={order.orderNumber}
          totalAmount={order.totalAmount}
          fop={fop}
          accessToken={token}
          alreadyReportedPaid={alreadyReportedPaid}
        />
      ) : null}

      {showMock ? (
        <div className="max-w-lg">
          <MockPaymentPanel
            orderNumber={order.orderNumber}
            totalAmount={order.totalAmount}
            customerEmail={order.customerEmail}
            alreadyFailed={alreadyFailed}
            accessToken={token}
          />
        </div>
      ) : null}

      {!isBank && !showMock ? (
        <p className="mt-6 max-w-lg rounded-2xl border border-border bg-surface p-4 text-sm text-muted-foreground">
          {t("payOnlinePending")}
        </p>
      ) : null}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        <Link href="/contacts" className="hover:text-primary">
          {t("needHelp")}
        </Link>
        {" · "}
        <Link
          href={`/track-order?order=${order.orderNumber}`}
          className="hover:text-primary"
        >
          {t("track")}
        </Link>
      </p>
    </main>
  );
}
