import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import {
  AdminEmptyRow,
  AdminTable,
  AdminTableHead,
  AdminTd,
  AdminTh,
} from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { getDashboardMetrics } from "@/features/orders/admin-service";
import {
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  paymentStatusTone,
} from "@/lib/admin/labels";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

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
    {
      label: "Оплачено сьогодні",
      value: String(metrics.paidToday),
      href: "/admin/orders?paymentStatus=PAID",
    },
    {
      label: "Низький залишок",
      value: String(metrics.queues.lowStock),
      href: "/admin/inventory?lowStock=1",
    },
  ];

  const queues = [
    { label: "Нові", count: metrics.queues.newOrders, href: "/admin/orders?status=NEW" },
    {
      label: "На підтвердженні",
      count: metrics.queues.awaitingConfirmation,
      href: "/admin/orders?status=AWAITING_CONFIRMATION",
      highlight: true,
    },
    { label: "Збірка", count: metrics.queues.picking, href: "/admin/orders?status=PICKING" },
    {
      label: "До відправки",
      count: metrics.queues.readyToShip,
      href: "/admin/orders?status=READY_TO_SHIP",
    },
    {
      label: "Помилки оплати",
      count: metrics.queues.failedPayments,
      href: "/admin/orders?paymentStatus=FAILED",
      danger: true,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Огляд"
        description="Операційна панель продажів D&A"
        actions={
          <>
            <Button href="/admin/sales" variant="secondary" size="sm">
              Sales
            </Button>
            <Button href="/admin/products/new" size="sm">
              Додати товар
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-border bg-surface p-3.5 shadow-[var(--shadow-card)] transition hover:border-primary/60 sm:p-4"
          >
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-display mt-1 text-xl font-semibold sm:text-2xl">{card.value}</p>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Черги
          </h2>
          <Link href="/admin/orders" className="text-xs font-semibold text-primary">
            Усі замовлення →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {queues.map((queue) => (
            <Link
              key={queue.label}
              href={queue.href}
              className={cn(
                "rounded-xl border bg-surface px-3 py-3 transition hover:border-primary/60",
                queue.danger
                  ? "border-red-500/30"
                  : queue.highlight
                    ? "border-amber-500/35"
                    : "border-border",
              )}
            >
              <p className="text-xs text-muted-foreground">{queue.label}</p>
              <p
                className={cn(
                  "mt-1 text-2xl font-bold tabular-nums",
                  queue.danger ? "text-red-600 dark:text-red-400" : "text-primary",
                )}
              >
                {queue.count}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Останні замовлення
          </h2>
          <Link href="/admin/sales" className="text-xs font-semibold text-primary">
            Sales →
          </Link>
        </div>
        <AdminTable minWidth="640px">
          <AdminTableHead>
            <tr>
              <AdminTh>Номер</AdminTh>
              <AdminTh>Клієнт</AdminTh>
              <AdminTh>Сума</AdminTh>
              <AdminTh>Статус</AdminTh>
              <AdminTh>Оплата</AdminTh>
            </tr>
          </AdminTableHead>
          <tbody>
            {metrics.recentOrders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0 hover:bg-surface-muted/40">
                <AdminTd>
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold text-primary">
                    {order.orderNumber}
                  </Link>
                </AdminTd>
                <AdminTd>
                  {order.customerFirstName} {order.customerLastName}
                </AdminTd>
                <AdminTd className="tabular-nums">{formatMoney(order.totalAmount)}</AdminTd>
                <AdminTd>
                  <AdminStatusBadge tone={orderStatusTone(order.status)}>
                    {orderStatusLabel(order.status)}
                  </AdminStatusBadge>
                </AdminTd>
                <AdminTd>
                  <AdminStatusBadge tone={paymentStatusTone(order.paymentStatus)}>
                    {paymentStatusLabel(order.paymentStatus)}
                  </AdminStatusBadge>
                </AdminTd>
              </tr>
            ))}
            {metrics.recentOrders.length === 0 ? (
              <AdminEmptyRow colSpan={5}>
                Поки немає замовлень — оформіть тестовий checkout на storefront.
              </AdminEmptyRow>
            ) : null}
          </tbody>
        </AdminTable>
      </section>
    </div>
  );
}
