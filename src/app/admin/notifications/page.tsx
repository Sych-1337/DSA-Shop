import Link from "next/link";

import { listAdminNotifications } from "@/features/customers/admin-service";
import { requirePermission } from "@/lib/auth/rbac";

const KIND_LABEL = {
  order: "Замовлення",
  payment: "Оплата",
  return: "Повернення",
} as const;

export default async function AdminNotificationsPage() {
  await requirePermission("orders.read", "/admin/notifications");
  const items = await listAdminNotifications();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-display text-3xl font-semibold">Сповіщення</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Живий stub: нові замовлення, fail-оплати й відкриті повернення. Без окремої inbox-таблиці.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          Поки тихо — критичних подій немає.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="block rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] transition hover:border-primary"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                    {KIND_LABEL[item.kind]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.createdAt.toLocaleString("uk-UA")}
                  </span>
                </div>
                <p className="mt-2 font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.meta}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
