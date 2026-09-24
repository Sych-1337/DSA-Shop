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
import { listPayments } from "@/features/orders/admin-service";
import { paymentStatusLabel, paymentStatusTone } from "@/lib/admin/labels";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requirePermission("payments.read", "/admin/payments");
  const { payments, total } = await listPayments();

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Платежі" meta={`Транзакцій: ${total}`} />

      <AdminTable minWidth="720px">
        <AdminTableHead>
          <tr>
            <AdminTh>Provider ID</AdminTh>
            <AdminTh>Замовлення</AdminTh>
            <AdminTh>Сума</AdminTh>
            <AdminTh>Статус</AdminTh>
            <AdminTh>Дата</AdminTh>
          </tr>
        </AdminTableHead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-surface-muted/40">
              <AdminTd className="font-mono text-xs">
                {payment.externalPaymentId ?? payment.id}
              </AdminTd>
              <AdminTd>
                <Link href={`/admin/orders/${payment.orderId}`} className="font-semibold text-primary">
                  {payment.order.orderNumber}
                </Link>
              </AdminTd>
              <AdminTd className="tabular-nums">{formatMoney(payment.amount)}</AdminTd>
              <AdminTd>
                <AdminStatusBadge tone={paymentStatusTone(payment.status)}>
                  {paymentStatusLabel(payment.status)}
                </AdminStatusBadge>
              </AdminTd>
              <AdminTd className="whitespace-nowrap text-muted-foreground">
                {payment.createdAt.toLocaleString("uk-UA")}
              </AdminTd>
            </tr>
          ))}
          {payments.length === 0 ? (
            <AdminEmptyRow colSpan={5}>Платежів ще немає</AdminEmptyRow>
          ) : null}
        </tbody>
      </AdminTable>
    </div>
  );
}
