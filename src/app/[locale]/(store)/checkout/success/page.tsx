import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getOrderByNumber } from "@/features/checkout/service";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";
import { verifyOrderAccessToken } from "@/lib/security/order-access";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("checkout");
  const tCart = await getTranslations("cart");
  const params = await searchParams;
  const orderNumber = typeof params.order === "string" ? params.order : null;
  const token = typeof params.token === "string" ? params.token : null;
  if (!orderNumber || !token) notFound();

  const order = await getOrderByNumber(orderNumber);
  if (!order || !verifyOrderAccessToken(token, order.orderNumber, order.customerEmail)) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-primary text-sm font-semibold tracking-wide uppercase">
        {t("successBadge")}
      </p>
      <h1 className="text-display mt-2 text-4xl font-semibold">{t("success")}</h1>
      <p className="mt-3 text-muted-foreground">{t("orderNumber", { number: order.orderNumber })}</p>
      <p className="mt-2 text-lg font-semibold">{formatMoney(order.totalAmount)}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("paymentStatus", { payment: order.paymentStatus, status: order.status })}
      </p>

      <ul className="mt-8 space-y-2 rounded-2xl border border-border bg-surface p-5 text-left text-sm shadow-[var(--shadow-card)]">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4">
            <span>
              {item.productTitle} × {item.quantity}
            </span>
            <span>{formatMoney(item.lineTotalAmount)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href={`/track-order?order=${order.orderNumber}`} variant="secondary">
          {t("track")}
        </Button>
        <Button href="/">{t("toHome")}</Button>
        <Button href="/catalog" variant="outline">
          {tCart("continue")}
        </Button>
      </div>
    </main>
  );
}
