import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { listOrdersForCustomer } from "@/features/account/service";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";

export default async function AccountOrdersPage() {
  const t = await getTranslations("pages");
  const tAccount = await getTranslations("account");
  const { orders, contact } = await listOrdersForCustomer();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <h1 className="text-display text-3xl font-semibold sm:text-4xl">{t("orders")}</h1>
      <p className="mt-3 text-muted-foreground">{tAccount("ordersLead")}</p>

      {!contact?.email && !contact?.phone ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-sm">
          <p>{tAccount("ordersNeedProfile")}</p>
          <Button href="/account" className="mt-4">
            {tAccount("ordersFillProfile")}
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-sm">
          <p>{tAccount("ordersEmpty")}</p>
          <p className="mt-2 text-muted-foreground">
            {contact.email ? contact.email : null}
            {contact.email && contact.phone ? " · " : null}
            {contact.phone ? contact.phone : null}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button href="/catalog">{tAccount("toCatalog")}</Button>
            <Button href="/track-order" variant="secondary">
              {t("trackOrder")}
            </Button>
          </div>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/track-order?order=${order.orderNumber}`}
                className="block rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition hover:border-primary"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.createdAt.toLocaleString("uk-UA")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{formatMoney(order.totalAmount)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.paymentStatus} · {order.status}
                    </p>
                  </div>
                </div>
                <p className="mt-3 truncate text-sm text-muted-foreground">
                  {order.items.map((item) => item.productTitle).join(" · ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/track-order" variant="secondary">
          {t("trackOrder")}
        </Button>
        <Link href="/account" className="text-sm text-primary hover:underline self-center">
          ← {t("account")}
        </Link>
      </div>
    </main>
  );
}
