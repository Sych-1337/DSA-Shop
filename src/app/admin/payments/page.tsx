import Link from "next/link";

import { listPayments } from "@/features/orders/admin-service";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requirePermission("payments.read", "/admin/payments");
  const { payments, total } = await listPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-3xl font-semibold">Платежі</h1>
        <p className="mt-1 text-sm text-muted-foreground">Всього транзакцій: {total}</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Provider ID</th>
              <th className="px-4 py-3 font-medium">Замовлення</th>
              <th className="px-4 py-3 font-medium">Сума</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-xs">{payment.externalPaymentId ?? payment.id}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${payment.orderId}`} className="text-primary font-semibold">
                    {payment.order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{formatMoney(payment.amount)}</td>
                <td className="px-4 py-3">{payment.status}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {payment.createdAt.toLocaleString("uk-UA")}
                </td>
              </tr>
            ))}
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Платежів ще немає
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
