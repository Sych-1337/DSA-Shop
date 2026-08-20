import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminCustomer } from "@/features/customers/admin-service";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/lib/auth/rbac";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("customers.read", "/admin/customers");
  const { id } = await params;
  const data = await getAdminCustomer(id);
  if (!data) notFound();

  const { profile, orders } = data;
  const name =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Без імені";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-sm">
          <Link href="/admin/customers" className="text-primary hover:underline">
            ← Клієнти
          </Link>
        </p>
        <h1 className="text-display mt-2 text-3xl font-semibold">{name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {profile.userId ? "Привʼязаний акаунт" : "Guest-профіль"} · оновлено{" "}
          {profile.updatedAt.toLocaleString("uk-UA")}
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold">Контакти</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{profile.contactEmail ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Телефон</dt>
            <dd>{profile.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Місто</dt>
            <dd>{profile.city ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Telegram</dt>
            <dd>{profile.telegramUsername ? `@${profile.telegramUsername}` : "—"}</dd>
          </div>
        </dl>
        {profile.note ? (
          <p className="mt-4 text-sm text-muted-foreground">Нотатка: {profile.note}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold">Адреси ({profile.addresses.length})</h2>
        {profile.addresses.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Немає збережених адрес.</p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm">
            {profile.addresses.map((address) => (
              <li key={address.id} className="rounded-xl border border-border px-3 py-2">
                <p className="font-medium">
                  {address.label}
                  {address.isDefault ? (
                    <span className="ml-2 text-xs text-primary">за замовчуванням</span>
                  ) : null}
                </p>
                <p>
                  {address.firstName} {address.lastName} · {address.phone}
                </p>
                <p className="text-muted-foreground">
                  {address.city}
                  {address.shippingMethod === "ADDRESS"
                    ? ` · ${address.addressLine}`
                    : ` · ${address.warehouseRef}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold">Замовлення ({orders.length})</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Замовлень за контактами немає.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border text-sm">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <Link href={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">
                  {order.orderNumber}
                </Link>
                <span className="text-muted-foreground">
                  {order.status} · {order.paymentStatus}
                </span>
                <span>{formatMoney(order.totalAmount)}</span>
                <span className="text-muted-foreground">
                  {order.createdAt.toLocaleDateString("uk-UA")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {profile.reviews.length > 0 ? (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold">Відгуки</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {profile.reviews.map((review) => (
              <li key={review.id}>
                {review.rating}/5 · {review.product.title} · {review.status}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
