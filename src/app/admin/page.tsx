import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getDashboardMetrics } from "@/features/orders/admin-service";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requirePermission("orders.read", "/admin");
  const metrics = await getDashboardMetrics();

  const cards = [
    { label: "Замовлення сьогодні", value: String(metrics.ordersToday), href: "/admin/orders" },
    {
      label: "Оплачена виручка",
      value: formatMoney(metrics.revenuePaid),
      href: "/admin/payments",
    },
    { label: "Оплачено сьогодні", value: String(metrics.paidToday), href: "/admin/orders?paymentStatus=PAID" },
    {
      label: "Low stock",
      value: String(metrics.queues.lowStock),
      href: "/admin/inventory",
    },
  ];

  const queues = [
    { label: "Нові", count: metrics.queues.newOrders, href: "/admin/orders?status=NEW" },
    {
      label: "На підтвердженні",
      count: metrics.queues.awaitingConfirmation,
      href: "/admin/orders?status=AWAITING_CONFIRMATION",
    },
    { label: "Збірка", count: metrics.queues.picking, href: "/admin/orders?status=PICKING" },
    {
      label: "До відправки",
      count: metrics.queues.readyToShip,
      href: "/admin/orders?status=READY_TO_SHIP",
    },
    {
      label: "Failed payments",
      count: metrics.queues.failedPayments,
      href: "/admin/orders?paymentStatus=FAILED",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-display text-2xl font-semibold sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
            Операційна панель продажів D&A
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button href="/admin/sales" variant="secondary" size="sm" className="w-full sm:w-auto">
            Sales kanban
          </Button>
          <Button href="/admin/products/new" size="sm" className="w-full sm:w-auto">
            Додати товар
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] transition hover:border-primary sm:p-5"
          >
            <p className="text-xs text-muted-foreground sm:text-sm">{card.label}</p>
            <p className="text-display mt-1 text-xl font-semibold sm:mt-2 sm:text-2xl">{card.value}</p>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="text-display mb-3 text-xl font-semibold">Черги дій</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {queues.map((queue) => (
            <Link
              key={queue.label}
              href={queue.href}
              className="rounded-xl border border-border bg-surface px-4 py-3 hover:border-primary"
            >
              <p className="text-sm text-muted-foreground">{queue.label}</p>
              <p className="text-2xl font-bold text-primary">{queue.count}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-display text-xl font-semibold">Останні замовлення</h2>
          <Link href="/admin/orders" className="text-primary text-sm font-semibold">
            Усі →
          </Link>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Номер</th>
                <th className="px-4 py-3 font-medium">Клієнт</th>
                <th className="px-4 py-3 font-medium">Сума</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Оплата</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold text-primary">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {order.customerFirstName} {order.customerLastName}
                  </td>
                  <td className="px-4 py-3">{formatMoney(order.totalAmount)}</td>
                  <td className="px-4 py-3">{order.status}</td>
                  <td className="px-4 py-3">{order.paymentStatus}</td>
                </tr>
              ))}
              {metrics.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Поки немає замовлень — оформіть тестовий checkout на storefront.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
