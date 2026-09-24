import Link from "next/link";

import {
  AdminFilterBar,
  adminFilterInputClassName,
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
import { listAdminProducts } from "@/features/catalog/service";
import { ProductStatus } from "@/generated/prisma";
import { productStatusLabel, productStatusTone } from "@/lib/admin/labels";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/money";

function hrefFor(input: { q?: string; status?: string }) {
  const sp = new URLSearchParams();
  if (input.q) sp.set("q", input.q);
  if (input.status) sp.set("status", input.status);
  const qs = sp.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("products.read", "/admin/products");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const status =
    typeof params.status === "string" && params.status in ProductStatus
      ? (params.status as ProductStatus)
      : undefined;

  const { products, total } = await listAdminProducts({ q, status });

  const chips = [
    { key: "all", label: "Усі" },
    { key: "PUBLISHED", label: "Опубліковані", status: "PUBLISHED" as const },
    { key: "DRAFT", label: "Чернетки", status: "DRAFT" as const },
    { key: "ARCHIVED", label: "Архів", status: "ARCHIVED" as const },
  ].map((item) => ({
    href: hrefFor({ q, status: "status" in item ? item.status : undefined }),
    label: item.label,
    active: (status ?? "all") === item.key,
  }));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Товари"
        description="1) Категорія → 2) товар + варіант → 3) фото → 4) DRAFT → PUBLISHED"
        meta={`Знайдено: ${total}`}
        actions={<Button href="/admin/products/new" size="sm">Додати товар</Button>}
      />

      <AdminFilterBar chips={chips}>
        <form className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <input
            name="q"
            defaultValue={q}
            placeholder="Назва або SKU…"
            className={adminFilterInputClassName("flex-1")}
          />
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <Button type="submit" variant="secondary" size="sm">
            Пошук
          </Button>
          {q || status ? (
            <Button href="/admin/products" variant="outline" size="sm">
              Скинути
            </Button>
          ) : null}
        </form>
      </AdminFilterBar>

      <AdminTable minWidth="760px">
        <AdminTableHead>
          <tr>
            <AdminTh>Товар</AdminTh>
            <AdminTh>Категорія</AdminTh>
            <AdminTh>Ціна</AdminTh>
            <AdminTh>Статус</AdminTh>
            <AdminTh>SKU</AdminTh>
            <AdminTh />
          </tr>
        </AdminTableHead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-border last:border-0 hover:bg-surface-muted/40">
              <AdminTd>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.images[0]?.url ?? "/api/placeholder?title=P&hue=320"}
                    alt=""
                    className="size-10 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{product.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{product.slug}</p>
                  </div>
                </div>
              </AdminTd>
              <AdminTd>{product.primaryCategory?.name ?? "—"}</AdminTd>
              <AdminTd className="tabular-nums">{formatMoney(product.priceAmount)}</AdminTd>
              <AdminTd>
                <AdminStatusBadge tone={productStatusTone(product.status)}>
                  {productStatusLabel(product.status)}
                </AdminStatusBadge>
              </AdminTd>
              <AdminTd className="font-mono text-xs">{product.variants[0]?.sku ?? "—"}</AdminTd>
              <AdminTd className="text-right">
                <Link href={`/admin/products/${product.id}`} className="font-semibold text-primary">
                  Редагувати
                </Link>
              </AdminTd>
            </tr>
          ))}
          {products.length === 0 ? (
            <AdminEmptyRow colSpan={6}>Товарів не знайдено</AdminEmptyRow>
          ) : null}
        </tbody>
      </AdminTable>
    </div>
  );
}
