import Link from "next/link";

import {
  AdminFilterBar,
  adminFilterInputClassName,
} from "@/components/admin/admin-filter-bar";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminEmptyRow,
  AdminTable,
  AdminTableHead,
  AdminTd,
  AdminTh,
} from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { listAdminCustomers } from "@/features/customers/admin-service";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/money";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("customers.read", "/admin/customers");
  const { q } = await searchParams;
  const customers = await listAdminCustomers(q);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Клієнти"
        description="Профілі кабінету + замовлення за email/телефоном."
        meta={`Знайдено: ${customers.length}`}
      />

      <AdminFilterBar>
        <form method="get" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <input
            name="q"
            defaultValue={q}
            placeholder="Email, телефон, імʼя…"
            className={adminFilterInputClassName("flex-1")}
          />
          <Button type="submit" size="sm">
            Знайти
          </Button>
          {q ? (
            <Button href="/admin/customers" variant="outline" size="sm">
              Скинути
            </Button>
          ) : null}
        </form>
      </AdminFilterBar>

      <AdminTable minWidth="720px">
        <AdminTableHead>
          <tr>
            <AdminTh>Клієнт</AdminTh>
            <AdminTh>Контакти</AdminTh>
            <AdminTh>Замовлення</AdminTh>
            <AdminTh>Сума</AdminTh>
            <AdminTh>Оновлено</AdminTh>
          </tr>
        </AdminTableHead>
        <tbody>
          {customers.length === 0 ? (
            <AdminEmptyRow colSpan={5}>Профілів не знайдено.</AdminEmptyRow>
          ) : (
            customers.map((customer) => (
              <tr key={customer.id} className="border-b border-border/70 last:border-0 hover:bg-surface-muted/40">
                <AdminTd>
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {[customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
                      "Без імені"}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {customer.userId ? "Акаунт" : "Гість"} · адрес {customer._count.addresses}
                  </p>
                </AdminTd>
                <AdminTd>
                  <p>{customer.contactEmail ?? "—"}</p>
                  <p className="text-muted-foreground">{customer.phone ?? "—"}</p>
                </AdminTd>
                <AdminTd className="tabular-nums">{customer.orderCount}</AdminTd>
                <AdminTd className="tabular-nums">{formatMoney(customer.totalSpent)}</AdminTd>
                <AdminTd className="text-muted-foreground">
                  {customer.updatedAt.toLocaleDateString("uk-UA")}
                </AdminTd>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>
    </div>
  );
}
