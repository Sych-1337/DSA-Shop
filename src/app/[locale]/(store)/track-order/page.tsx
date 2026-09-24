import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { OrderTimeline } from "@/components/store/order-timeline";
import { TrackOrderForm } from "@/components/store/track-order-form";
import { trackOrderByNumberAndEmail } from "@/features/checkout/service";
import { buildEntityMetadata } from "@/features/seo/service";
import { formatMoney } from "@/lib/money";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages");
  const tTrack = await getTranslations("track");
  return buildEntityMetadata({
    entityType: "page",
    entityId: "track-order",
    fallbackTitle: t("trackOrder"),
    fallbackDescription: tTrack("lead"),
    fallbackPath: "/track-order",
    forceNoindex: true,
  });
}

function param(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("pages");
  const tTrack = await getTranslations("track");
  const params = await searchParams;
  const orderNumber = param(params.order);
  const email = param(params.email);

  const order =
    orderNumber && email ? await trackOrderByNumberAndEmail(orderNumber, email) : null;
  const searched = Boolean(orderNumber && email);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <h1 className="text-display text-3xl font-semibold sm:text-4xl">{t("trackOrder")}</h1>
      <p className="mt-3 text-muted-foreground sm:text-lg">{tTrack("lead")}</p>

      <TrackOrderForm defaultOrder={orderNumber} defaultEmail={email} />

      {searched && !order ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          {tTrack("notFound")}
        </p>
      ) : null}

      {order ? (
        <section className="mt-8 space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <p className="text-sm text-muted-foreground">{tTrack("orderNumber")}</p>
            <p className="text-display mt-1 text-2xl font-semibold">{order.orderNumber}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{tTrack("status")}</dt>
                <dd className="font-semibold">{order.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{tTrack("payment")}</dt>
                <dd className="font-semibold">{order.paymentStatus}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{tTrack("fulfillment")}</dt>
                <dd className="font-semibold">{order.fulfillmentStatus}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{tTrack("total")}</dt>
                <dd className="font-semibold">{formatMoney(order.totalAmount)}</dd>
              </div>
            </dl>
          </div>

          <OrderTimeline
            status={order.status}
            paymentStatus={order.paymentStatus}
            fulfillmentStatus={order.fulfillmentStatus}
          />

          {order.shipments.length > 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-display text-lg font-semibold">{tTrack("shipping")}</h2>
              <ul className="mt-3 space-y-3 text-sm">
                {order.shipments.map((shipment) => (
                  <li key={shipment.id} className="flex flex-wrap justify-between gap-2">
                    <span>
                      {shipment.provider} · {shipment.status}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {shipment.trackingNumber || tTrack("noTracking")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-display text-lg font-semibold">{tTrack("items")}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4">
                  <span>
                    {item.productTitle} × {item.quantity}
                  </span>
                  <span>{formatMoney(item.lineTotalAmount)}</span>
                </li>
              ))}
            </ul>
          </div>

          {order.statusHistory.length > 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-display text-lg font-semibold">{tTrack("history")}</h2>
              <ol className="mt-3 space-y-2 text-sm">
                {order.statusHistory.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap justify-between gap-2">
                    <span>
                      {entry.field}: {entry.oldValue ?? "—"} → {entry.newValue}
                    </span>
                    <span className="text-muted-foreground">
                      {entry.createdAt.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
