import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  addOrderNoteAction,
  createShipmentAction,
  markOrderPaidAction,
  transitionOrderAction,
} from "@/features/orders/actions";
import { getAdminOrder } from "@/features/orders/admin-service";
import { ORDER_TRANSITIONS } from "@/features/orders/state-machine";
import { PaymentStatus } from "@/generated/prisma";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const nextStatuses = ORDER_TRANSITIONS[order.status] ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">
            <Link href="/admin/orders" className="hover:text-primary">
              Замовлення
            </Link>{" "}
            / {order.orderNumber}
          </p>
          <h1 className="text-display mt-1 text-3xl font-semibold">{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {order.createdAt.toLocaleString("uk-UA")} · {order.source}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{formatMoney(order.totalAmount)}</p>
          <p className="text-sm text-muted-foreground">
            {order.status} / {order.paymentStatus}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-display text-xl font-semibold">Клієнт</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Імʼя</dt>
              <dd>
                {order.customerFirstName} {order.customerLastName}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{order.customerEmail}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Телефон</dt>
              <dd>{order.customerPhone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Місто</dt>
              <dd>{order.shippingCity ?? order.address?.city ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Доставка</dt>
              <dd>{order.shippingMethod}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Відділення / адреса</dt>
              <dd className="text-right">
                {order.shippingWarehouseRef ||
                  order.shippingAddressLine ||
                  order.address?.warehouseRef ||
                  order.address?.addressLine ||
                  "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Оплата</dt>
              <dd>
                {order.paymentMethod === "ONLINE" ? "Повна передоплата" : order.paymentMethod} ·{" "}
                {order.paymentStatus}
              </dd>
            </div>
            {order.customerNote ? (
              <div className="border-t border-border pt-2">
                <dt className="text-muted-foreground">Коментар покупця</dt>
                <dd className="mt-1 whitespace-pre-wrap">{order.customerNote}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-display text-xl font-semibold">Дії</h2>
          <div className="mt-4 space-y-3">
            {nextStatuses.length > 0 ? (
              <form action={transitionOrderAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="orderId" value={order.id} />
                <select
                  name="toStatus"
                  className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  defaultValue={nextStatuses[0]}
                >
                  {nextStatuses.map((status) => (
                    <option key={status} value={status}>
                      → {status}
                    </option>
                  ))}
                </select>
                <input
                  name="reason"
                  placeholder="Причина (опційно)"
                  className="h-10 min-w-[160px] flex-1 rounded-xl border border-border px-3 text-sm"
                />
                <Button type="submit" size="sm">
                  Змінити статус
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">Термінальний статус — переходів немає.</p>
            )}

            <form action={createShipmentAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <Button type="submit" variant="secondary" size="sm">
                Створити накладну (mock)
              </Button>
            </form>

            {order.paymentStatus !== PaymentStatus.PAID ? (
              <form action={markOrderPaidAction} className="space-y-2 rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">
                  Вручну підтвердити повну оплату (stub / банківський перевод).
                </p>
                <input type="hidden" name="orderId" value={order.id} />
                <input
                  name="reason"
                  placeholder="Причина (напр. оплата за рахунком)"
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm"
                />
                <Button type="submit" size="sm" variant="outline">
                  Позначити оплаченим
                </Button>
              </form>
            ) : null}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-display text-xl font-semibold">Товари</h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3">
              <div>
                <p className="font-medium">
                  {item.productTitle} · {item.variantTitle}
                </p>
                <p className="text-muted-foreground text-xs">
                  SKU {item.sku} · ×{item.quantity}
                </p>
              </div>
              <p className="font-semibold">{formatMoney(item.lineTotalAmount)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Підсумок</dt>
            <dd>{formatMoney(order.subtotalAmount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Знижка</dt>
            <dd>-{formatMoney(order.discountAmount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Доставка</dt>
            <dd>{formatMoney(order.shippingAmount)}</dd>
          </div>
          <div className="flex justify-between font-bold">
            <dt>Разом</dt>
            <dd>{formatMoney(order.totalAmount)}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-display text-xl font-semibold">Оплати</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {order.payments.map((payment) => (
              <li key={payment.id} className="rounded-xl border border-border px-3 py-2">
                <p className="font-medium">
                  {payment.provider} · {payment.status}
                </p>
                <p className="text-muted-foreground text-xs">
                  {payment.externalPaymentId} · {formatMoney(payment.amount)}
                </p>
              </li>
            ))}
            {order.payments.length === 0 ? (
              <p className="text-muted-foreground">Немає транзакцій</p>
            ) : null}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-display text-xl font-semibold">Відправлення</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {order.shipments.map((shipment) => (
              <li key={shipment.id} className="rounded-xl border border-border px-3 py-2">
                <p className="font-medium">{shipment.trackingNumber ?? shipment.id}</p>
                <p className="text-muted-foreground text-xs">
                  {shipment.provider} · {shipment.status}
                </p>
              </li>
            ))}
            {order.shipments.length === 0 ? (
              <p className="text-muted-foreground">Накладних ще немає</p>
            ) : null}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-display text-xl font-semibold">Історія</h2>
          <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto text-sm">
            {order.statusHistory.map((event) => (
              <li key={event.id} className="border-b border-border pb-2">
                <p className="font-medium">
                  {event.field}: {event.oldValue ?? "—"} → {event.newValue}
                </p>
                <p className="text-muted-foreground text-xs">
                  {event.createdAt.toLocaleString("uk-UA")}
                  {event.reason ? ` · ${event.reason}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-display text-xl font-semibold">Нотатки</h2>
          <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-sm">
            {order.notes.map((note) => (
              <li key={note.id} className="rounded-lg bg-surface-muted px-3 py-2">
                {note.body}
              </li>
            ))}
          </ul>
          <form action={addOrderNoteAction} className="mt-3 flex gap-2">
            <input type="hidden" name="orderId" value={order.id} />
            <input
              name="body"
              required
              placeholder="Внутрішня нотатка..."
              className="h-10 min-w-0 flex-1 rounded-xl border border-border px-3 text-sm"
            />
            <Button type="submit" size="sm" variant="secondary">
              Додати
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
