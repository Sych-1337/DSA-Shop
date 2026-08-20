import Link from "next/link";

import { InventoryTable } from "@/components/admin/inventory-table";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-3xl font-semibold">Склад</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Універсальний облік усіх активних SKU. Зміни залишків — тільки через рухи. Продажі
          автоматично резервують і списують товар.
        </p>
      </div>

      <form
        method="get"
        action="/admin/inventory"
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 sm:flex-row sm:flex-wrap sm:items-end sm:p-4"
      >
        <label className="block min-w-[200px] flex-1 space-y-1 text-xs">
          <span className="text-muted-foreground">Пошук (SKU / назва)</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="hoodie, APP-…"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block min-w-[160px] space-y-1 text-xs">
          <span className="text-muted-foreground">Склад</span>
          <select
            name="warehouseId"
            defaultValue={warehouseId ?? warehouse?.id ?? ""}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          >
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
                {wh.isDefault ? " (основний)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs">
          <input type="checkbox" name="lowStock" value="1" defaultChecked={lowStockOnly} />
          Лише низький залишок
        </label>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white"
        >
          Застосувати
        </button>
        {(q || lowStockOnly || page > 1) && (
          <Link
            href="/admin/inventory"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm"
          >
            Скинути
          </Link>
        )}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          Знайдено SKU: <span className="font-semibold text-foreground">{total}</span>
          {warehouse ? (
            <>
              {" "}
              · склад <span className="font-semibold text-foreground">{warehouse.name}</span>
            </>
          ) : null}
        </p>
        <p>
          Сторінка {page} / {totalPages}
        </p>
      </div>

      <InventoryTable rows={rows} canAdjust={canAdjust} canSeeCost={canSeeCost} />

      {totalPages > 1 ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href={hrefFor({ page: Math.max(1, page - 1) })}
            className={cn(
              "rounded-xl border border-border px-4 py-2 text-sm",
              page <= 1 && "pointer-events-none opacity-40",
            )}
          >
            Назад
          </Link>
          <Link
            href={hrefFor({ page: Math.min(totalPages, page + 1) })}
            className={cn(
              "rounded-xl border border-border px-4 py-2 text-sm",
              page >= totalPages && "pointer-events-none opacity-40",
            )}
          >
            Далі
          </Link>
        </div>
      ) : null}
    </div>
  );
}
