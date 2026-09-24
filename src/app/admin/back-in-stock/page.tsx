import Link from "next/link";

import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import {
  AdminEmptyRow,
  AdminTable,
  AdminTableHead,
  AdminTd,
  AdminTh,
} from "@/components/admin/admin-table";
import { listBackInStockSubscriptions } from "@/features/back-in-stock/service";
import { requirePermission } from "@/lib/auth/rbac";

export default async function AdminBackInStockPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>;
}) {
  await requirePermission("customers.read", "/admin/back-in-stock");
  const { pending } = await searchParams;
  const pendingOnly = pending === "1";
  const rows = await listBackInStockSubscriptions({ pendingOnly });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Наявність"
        description="Підписки «повідомити, коли зʼявиться». Листи — у stub inbox (/admin/emails)."
        meta={`Підписок: ${rows.length}`}
      />

      <AdminFilterBar
        chips={[
          {
            href: "/admin/back-in-stock",
            label: "Усі",
            active: !pendingOnly,
          },
          {
            href: "/admin/back-in-stock?pending=1",
            label: "Очікують",
            active: pendingOnly,
          },
        ]}
      />

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Підписок ще немає.
        </p>
      ) : (
        <AdminTable minWidth="640px">
          <AdminTableHead>
            <tr>
              <AdminTh>Email</AdminTh>
              <AdminTh>Товар</AdminTh>
              <AdminTh>Варіант</AdminTh>
              <AdminTh>Статус</AdminTh>
              <AdminTh>Створено</AdminTh>
            </tr>
          </AdminTableHead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0 hover:bg-surface-muted/40">
                <AdminTd>{row.email}</AdminTd>
                <AdminTd>
                  <Link href={`/admin/products/${row.productId}`} className="hover:text-primary">
                    {row.product.title}
                  </Link>
                </AdminTd>
                <AdminTd className="text-muted-foreground">
                  {row.variant.title} · {row.variant.sku}
                </AdminTd>
                <AdminTd>
                  {row.notifiedAt ? (
                    <AdminStatusBadge tone="success">Надіслано</AdminStatusBadge>
                  ) : (
                    <AdminStatusBadge tone="warning">Очікує</AdminStatusBadge>
                  )}
                </AdminTd>
                <AdminTd className="text-muted-foreground">
                  {row.createdAt.toLocaleString("uk-UA")}
                </AdminTd>
              </tr>
            ))}
            {rows.length === 0 ? <AdminEmptyRow colSpan={5}>Немає записів</AdminEmptyRow> : null}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
