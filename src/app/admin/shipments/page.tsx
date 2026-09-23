import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function AdminShipmentsPage() {
  await requirePermission("orders.read", "/admin/shipments");
  const shipments = await prisma.shipment.findMany({
    include: { order: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-3xl font-semibold">Відправлення</h1>
        <p className="mt-1 text-sm text-muted-foreground">Останні накладні</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Tracking</th>
              <th className="px-4 py-3 font-medium">Замовлення</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Метод</th>
              <th className="px-4 py-3 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment) => (
              <tr key={shipment.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono text-xs">
                  {shipment.trackingNumber ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${shipment.orderId}`} className="text-primary font-semibold">
                    {shipment.order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{shipment.status}</td>
                <td className="px-4 py-3">{shipment.method}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {shipment.createdAt.toLocaleString("uk-UA")}
                </td>
              </tr>
            ))}
            {shipments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Відправлень ще немає
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
