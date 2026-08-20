import Link from "next/link";

import { listAdminCustomers } from "@/features/customers/admin-service";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/lib/auth/rbac";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("customers.read", "/admin/customers");
  const { q } = await searchParams;
  const customers = await listAdminCustomers(q);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-display text-3xl font-semibold">Клієнти</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Профілі кабінету + замовлення за email/телефоном.
        </p>
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Email, телефон, імʼя…"
          className="h-10 min-w-[16rem] flex-1 rounded-xl border border-border bg-background px-3 text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-white"
        >
          Знайти
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Клієнт</th>
              <th className="px-4 py-3 font-medium">Контакти</th>
              <th className="px-4 py-3 font-medium">Замовлення</th>
              <th className="px-4 py-3 font-medium">Сума</th>
              <th className="px-4 py-3 font-medium">Оновлено</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-muted-foreground">
                  Профілів не знайдено.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {[customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
                        "Без імені"}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {customer.userId ? "Акаунт" : "Гість"} · адрес{" "}
                      {customer._count.addresses}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{customer.contactEmail ?? "—"}</p>
                    <p className="text-muted-foreground">{customer.phone ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">{customer.orderCount}</td>
                  <td className="px-4 py-3">{formatMoney(customer.totalSpent)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {customer.updatedAt.toLocaleDateString("uk-UA")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
