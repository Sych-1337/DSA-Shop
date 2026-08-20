import Link from "next/link";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Сповіщення про наявність</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Підписки «повідомити, коли зʼявиться». Листи йдуть у stub inbox (/admin/emails).
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/back-in-stock"
          className={!pendingOnly ? "font-semibold text-primary" : "text-muted-foreground hover:text-primary"}
        >
          Усі
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link
          href="/admin/back-in-stock?pending=1"
          className={pendingOnly ? "font-semibold text-primary" : "text-muted-foreground hover:text-primary"}
        >
          Очікують
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Підписок ще немає.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Товар</th>
                <th className="px-3 py-2 font-medium">Варіант</th>
                <th className="px-3 py-2 font-medium">Статус</th>
                <th className="px-3 py-2 font-medium">Створено</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">{row.email}</td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/products/${row.productId}`} className="hover:text-primary">
                      {row.product.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.variant.title} · {row.variant.sku}
                  </td>
                  <td className="px-3 py-2">
                    {row.notifiedAt ? (
                      <span className="text-success">Надіслано</span>
                    ) : (
                      <span className="text-amber-600">Очікує</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.createdAt.toLocaleString("uk-UA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
