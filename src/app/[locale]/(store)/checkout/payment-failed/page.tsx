import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const REASONS = [
  "declined",
  "insufficient_funds",
  "cancelled",
  "provider_error",
] as const;

type Reason = (typeof REASONS)[number];

function isReason(value: string | undefined): value is Reason {
  return Boolean(value && (REASONS as readonly string[]).includes(value));
}

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; reason?: string }>;
}) {
  const t = await getTranslations("checkout");
  const { order, reason: rawReason } = await searchParams;
  const reason = isReason(rawReason) ? rawReason : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-sm font-semibold tracking-wide text-danger uppercase">{t("failedBadge")}</p>
      <h1 className="text-display mt-2 text-3xl font-semibold sm:text-4xl">{t("failed")}</h1>
      <p className="mt-3 text-muted-foreground">
        {reason ? t(`payFailReason_${reason}`) : t("failedDescription")}
      </p>
      {order ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("orderNumber", { number: order })}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {order ? (
          <Button href={`/checkout/pay?order=${order}`}>{t("retryPayment")}</Button>
        ) : (
          <Button href="/checkout">{t("retryPayment")}</Button>
        )}
        <Button href="/cart" variant="secondary">
          {t("backToCart")}
        </Button>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        <Link href="/contacts" className="hover:text-primary">
          {t("needHelp")}
        </Link>
        {" · "}
        <Link href="/" className="hover:text-primary">
          {t("toHome")}
        </Link>
      </p>
    </main>
  );
}
