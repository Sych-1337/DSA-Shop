import Link from "next/link";

import { Button } from "@/components/ui/button";
import { listAdminProducts } from "@/features/catalog/service";
import { formatMoney } from "@/lib/money";
import { ProductStatus } from "@/generated/prisma";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const status =
    typeof params.status === "string" && params.status in ProductStatus
      ? (params.status as ProductStatus)
      : undefined;

  const { products, total } = await listAdminProducts({ q, status });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl font-semibold">Товари</h1>
          <p className="mt-1 text-sm text-muted-foreground">Всього: {total}</p>
        </div>
        <Button href="/admin/products/new">Додати товар</Button>
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Назва або SKU..."
          className="h-10 min-w-[220px] rounded-xl border border-border bg-surface px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-xl border border-border bg-surface px-3 text-sm"
        >
          <option value="">Усі статуси</option>
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
        <Button type="submit" variant="secondary" size="sm">
          Фільтр
        </Button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Товар</th>
              <th className="px-4 py-3 font-medium">Категорія</th>
              <th className="px-4 py-3 font-medium">Ціна</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.images[0]?.url ?? "/api/placeholder?title=P&hue=320"}
                      alt=""
                      className="size-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium">{product.title}</p>
                      <p className="text-muted-foreground text-xs">{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{product.primaryCategory?.name ?? "—"}</td>
                <td className="px-4 py-3">{formatMoney(product.priceAmount)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-surface-muted px-2 py-1 text-xs">{product.status}</span>
                </td>
                <td className="px-4 py-3 text-xs">{product.variants[0]?.sku ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${product.id}`} className="text-primary font-semibold">
                    Редагувати
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
