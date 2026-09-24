import Link from "next/link";

import {
  AdminFilterBar,
  adminFilterInputClassName,
  adminFilterSelectClassName,
} from "@/components/admin/admin-filter-bar";
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
import { listAdminOrders } from "@/features/orders/admin-service";
import { statusLabel } from "@/features/orders/state-machine";
import { OrderStatus, PaymentStatus } from "@/generated/prisma";
import {
  orderStatusTone,
  paymentStatusLabel,
  paymentStatusTone,
} from "@/lib/admin/labels";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const QUICK_STATUSES: { key: string; label: string; status?: OrderStatus }[] = [
  { key: "all", label: "Усі" },
  { key: "NEW", label: "Нові", status: "NEW" },
  { key: "AWAITING_CONFIRMATION", label: "На підтвердженні", status: "AWAITING_CONFIRMATION" },
  { key: "CONFIRMED", label: "Підтверджені", status: "CONFIRMED" },
  { key: "PICKING", label: "Збірка", status: "PICKING" },
  { key: "READY_TO_SHIP", label: "До відправки", status: "READY_TO_SHIP" },
  { key: "SHIPPED", label: "В дорозі", status: "SHIPPED" },
  { key: "DELIVERED", label: "Доставлено", status: "DELIVERED" },
];

function buildOrdersHref(input: {
  q?: string;
  status?: string;
  paymentStatus?: string;
}) {
  const sp = new URLSearchParams();
  if (input.q) sp.set("q", input.q);
  if (input.status) sp.set("status", input.status);
  if (input.paymentStatus) sp.set("paymentStatus", input.paymentStatus);
  const qs = sp.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

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

  const statusChips = QUICK_STATUSES.map((item) => ({
    href: buildOrdersHref({ q, status: item.status, paymentStatus }),
    label: item.label,
    active: (status ?? "all") === item.key,
  }));

  const paymentChips = [
    { key: "all", label: "Усі оплати" },
    { key: "PENDING", label: "Очікує", paymentStatus: "PENDING" as const },
    { key: "PAID", label: "Оплачено", paymentStatus: "PAID" as const },
    { key: "FAILED", label: "Помилка", paymentStatus: "FAILED" as const },
  ].map((item) => ({
    href: buildOrdersHref({
      q,
      status,
      paymentStatus: "paymentStatus" in item ? item.paymentStatus : undefined,
    }),
    label: item.label,
    active: (paymentStatus ?? "all") === item.key,
  }));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Замовлення"
        meta={`Знайдено: ${total}`}
        actions={
          <Button href="/admin/sales" variant="secondary" size="sm">
            Sales board
          </Button>
        }
      />

      <AdminFilterBar chips={statusChips}>
        <div className="flex w-full flex-wrap gap-1.5">
          {paymentChips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className={
                chip.active
                  ? "inline-flex rounded-md border border-primary bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary"
                  : "inline-flex rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }
            >
              {chip.label}
            </Link>
          ))}
        </div>
        <form method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <input
            name="q"
            defaultValue={q}
            placeholder="Номер / email / телефон…"
            className={adminFilterInputClassName("flex-1")}
          />
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <select
            name="paymentStatus"
            defaultValue={paymentStatus ?? ""}
            className={adminFilterSelectClassName()}
          >
            <option value="">Усі оплати</option>
            {Object.values(PaymentStatus).map((value) => (
              <option key={value} value={value}>
                {paymentStatusLabel(value)}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary" size="sm">
            Пошук
          </Button>
          {q || status || paymentStatus ? (
            <Button href="/admin/orders" variant="outline" size="sm">
              Скинути
            </Button>
          ) : null}
        </form>
      </AdminFilterBar>

      <AdminTable minWidth="860px">
        <AdminTableHead>
          <tr>
            <AdminTh>Номер</AdminTh>
            <AdminTh>Дата</AdminTh>
            <AdminTh>Клієнт</AdminTh>
            <AdminTh>Сума</AdminTh>
            <AdminTh>Статус</AdminTh>
            <AdminTh>Оплата</AdminTh>
            <AdminTh>Доставка</AdminTh>
          </tr>
        </AdminTableHead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border last:border-0 hover:bg-surface-muted/40">
              <AdminTd>
                <Link href={`/admin/orders/${order.id}`} className="font-semibold text-primary">
                  {order.orderNumber}
                </Link>
              </AdminTd>
              <AdminTd className="whitespace-nowrap text-muted-foreground">
                {order.createdAt.toLocaleString("uk-UA", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </AdminTd>
              <AdminTd>
                <p className="font-medium">
                  {order.customerFirstName} {order.customerLastName}
                </p>
                <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
              </AdminTd>
              <AdminTd className="tabular-nums font-medium">
                {formatMoney(order.totalAmount)}
              </AdminTd>
              <AdminTd>
                <AdminStatusBadge tone={orderStatusTone(order.status)}>
                  {statusLabel(order.status)}
                </AdminStatusBadge>
              </AdminTd>
              <AdminTd>
                <AdminStatusBadge tone={paymentStatusTone(order.paymentStatus)}>
                  {paymentStatusLabel(order.paymentStatus)}
                </AdminStatusBadge>
              </AdminTd>
              <AdminTd className="text-xs text-muted-foreground">{order.fulfillmentStatus}</AdminTd>
            </tr>
          ))}
          {orders.length === 0 ? (
            <AdminEmptyRow colSpan={7}>Замовлень не знайдено</AdminEmptyRow>
          ) : null}
        </tbody>
      </AdminTable>
    </div>
  );
}
