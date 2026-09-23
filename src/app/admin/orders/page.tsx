import Link from "next/link";

import { Button } from "@/components/ui/button";
import { listAdminOrders } from "@/features/orders/admin-service";
import { OrderStatus, PaymentStatus } from "@/generated/prisma";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("orders.read", "/admin/orders");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const status =
    typeof params.status === "string" && params.status in OrderStatus
      ? (params.status as OrderStatus)
      : undefined;
  const paymentStatus =
    typeof params.paymentStatus === "string" && params.paymentStatus in PaymentStatus
      ? (params.paymentStatus as PaymentStatus)
      : undefined;

  const { orders, total } = await listAdminOrders({ q, status, paymentStatus });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl font-semibold">Замовлення</h1>
          <p className="mt-1 text-sm text-muted-foreground">Всього: {total}</p>
        </div>
        <Button href="/admin/sales" variant="secondary" size="sm">
          Kanban
        </Button>
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Номер / email / телефон..."
          className="h-10 min-w-[220px] rounded-xl border border-border bg-surface px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-xl border border-border bg-surface px-3 text-sm"
        >
          <option value="">Усі статуси</option>
          {Object.values(OrderStatus).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          name="paymentStatus"
          defaultValue={paymentStatus ?? ""}
          className="h-10 rounded-xl border border-border bg-surface px-3 text-sm"
        >
          <option value="">Усі оплати</option>
          {Object.values(PaymentStatus).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm">
          Фільтр
        </Button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Номер</th>
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-4 py-3 font-medium">Клієнт</th>
              <th className="px-4 py-3 font-medium">Сума</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Оплата</th>
              <th className="px-4 py-3 font-medium">Доставка</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold text-primary">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {order.createdAt.toLocaleString("uk-UA")}
                </td>
                <td className="px-4 py-3">
                  <p>
                    {order.customerFirstName} {order.customerLastName}
                  </p>
                  <p className="text-muted-foreground text-xs">{order.customerEmail}</p>
                </td>
                <td className="px-4 py-3">{formatMoney(order.totalAmount)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-surface-muted px-2 py-1 text-xs">{order.status}</span>
                </td>
                <td className="px-4 py-3 text-xs">{order.paymentStatus}</td>
                <td className="px-4 py-3 text-xs">{order.fulfillmentStatus}</td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Замовлень не знайдено
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
