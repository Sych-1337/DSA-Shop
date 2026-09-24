import Link from "next/link";

import {
  AdminFilterBar,
  adminFilterInputClassName,
  adminFilterSelectClassName,
} from "@/components/admin/admin-filter-bar";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InventoryTable } from "@/components/admin/inventory-table";
import { Button } from "@/components/ui/button";
import { listInventoryRows, listWarehouses } from "@/features/inventory/service";
import { getStaffContext, requirePermission, staffHasPermission } from "@/lib/auth/rbac";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  warehouseId?: string;
  lowStock?: string;
  page?: string;
}>;

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission("inventory.read", "/admin/inventory");
  const staff = await getStaffContext();
  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const warehouseId = params.warehouseId || undefined;
  const lowStockOnly = params.lowStock === "1";
  const page = Math.max(1, Number(params.page) || 1);

  const [warehouses, { rows, total, pageSize, warehouse }] = await Promise.all([
    listWarehouses(),
    listInventoryRows({ q, warehouseId, lowStockOnly, page, pageSize: 40 }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canAdjust = staff ? staffHasPermission(staff, "inventory.adjust") : false;
  const canSeeCost = staff ? staffHasPermission(staff, "products.cost.read") : false;

  function hrefFor(next: { q?: string; warehouseId?: string; lowStock?: boolean; page?: number }) {
    const sp = new URLSearchParams();
    const nextQ = next.q ?? q;
    const nextWh = next.warehouseId ?? warehouseId ?? warehouse?.id;
    const nextLow = next.lowStock ?? lowStockOnly;
    const nextPage = next.page ?? page;
    if (nextQ) sp.set("q", nextQ);
    if (nextWh) sp.set("warehouseId", nextWh);
    if (nextLow) sp.set("lowStock", "1");
    if (nextPage > 1) sp.set("page", String(nextPage));
    const qs = sp.toString();
    return qs ? `/admin/inventory?${qs}` : "/admin/inventory";
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Склад"
        description="Універсальний облік SKU. Зміни залишків — лише через рухи."
        meta={
          <>
            SKU: <span className="font-semibold text-foreground">{total}</span>
            {warehouse ? (
              <>
                {" "}
                · <span className="font-semibold text-foreground">{warehouse.name}</span>
              </>
            ) : null}
          </>
        }
      />

      <AdminFilterBar
        chips={[
          {
            href: hrefFor({ lowStock: false, page: 1 }),
            label: "Усі SKU",
            active: !lowStockOnly,
          },
          {
            href: hrefFor({ lowStock: true, page: 1 }),
            label: "Низький залишок",
            active: lowStockOnly,
          },
        ]}
      >
        <form
          method="get"
          action="/admin/inventory"
          className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
        >
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="SKU / назва…"
            className={adminFilterInputClassName("flex-1")}
          />
          <select
            name="warehouseId"
            defaultValue={warehouseId ?? warehouse?.id ?? ""}
            className={adminFilterSelectClassName("min-w-[10rem]")}
          >
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
                {wh.isDefault ? " (основний)" : ""}
              </option>
            ))}
          </select>
          {lowStockOnly ? <input type="hidden" name="lowStock" value="1" /> : null}
          <Button type="submit" size="sm">
            Застосувати
          </Button>
          {q || lowStockOnly || page > 1 ? (
            <Button href="/admin/inventory" variant="outline" size="sm">
              Скинути
            </Button>
          ) : null}
        </form>
      </AdminFilterBar>

      <InventoryTable rows={rows} canAdjust={canAdjust} canSeeCost={canSeeCost} />

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-muted-foreground">
            Сторінка {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Link
              href={hrefFor({ page: Math.max(1, page - 1) })}
              className={cn(
                "rounded-lg border border-border px-3 py-1.5 text-sm",
                page <= 1 && "pointer-events-none opacity-40",
              )}
            >
              Назад
            </Link>
            <Link
              href={hrefFor({ page: Math.min(totalPages, page + 1) })}
              className={cn(
                "rounded-lg border border-border px-3 py-1.5 text-sm",
                page >= totalPages && "pointer-events-none opacity-40",
              )}
            >
              Далі
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
