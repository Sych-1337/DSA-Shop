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
    <div className="space-y-5">
      <AdminPageHeader title="Доставка" description="Останні накладні" meta={`Записів: ${shipments.length}`} />

      <AdminTable minWidth="720px">
        <AdminTableHead>
          <tr>
            <AdminTh>Tracking</AdminTh>
            <AdminTh>Замовлення</AdminTh>
            <AdminTh>Статус</AdminTh>
            <AdminTh>Метод</AdminTh>
            <AdminTh>Дата</AdminTh>
          </tr>
        </AdminTableHead>
        <tbody>
          {shipments.map((shipment) => (
            <tr key={shipment.id} className="border-b border-border last:border-0 hover:bg-surface-muted/40">
              <AdminTd className="font-mono text-xs">{shipment.trackingNumber ?? "—"}</AdminTd>
              <AdminTd>
                <Link href={`/admin/orders/${shipment.orderId}`} className="font-semibold text-primary">
                  {shipment.order.orderNumber}
                </Link>
              </AdminTd>
              <AdminTd>
                <AdminStatusBadge>{shipment.status}</AdminStatusBadge>
              </AdminTd>
              <AdminTd>{shipment.method}</AdminTd>
              <AdminTd className="whitespace-nowrap text-muted-foreground">
                {shipment.createdAt.toLocaleString("uk-UA")}
              </AdminTd>
            </tr>
          ))}
          {shipments.length === 0 ? (
            <AdminEmptyRow colSpan={5}>Відправлень ще немає</AdminEmptyRow>
          ) : null}
        </tbody>
      </AdminTable>
    </div>
  );
}
