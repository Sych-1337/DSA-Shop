import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { formatMoney } from "@/lib/money";
import { createCouponAction, toggleCouponAction } from "@/features/coupons/admin-actions";
import { listCoupons } from "@/features/coupons/service";
import { CouponType } from "@/generated/prisma";
import { requirePermission, staffHasPermission } from "@/lib/auth/rbac";

export default async function AdminCouponsPage() {
  const staff = await requirePermission("products.read", "/admin/coupons");
  const canWrite = staffHasPermission(staff, "products.write");
  const coupons = await listCoupons();

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Промокоди"
        description={
          <>
            Застосовуються в кошику / checkout. Seed:{" "}
            <code className="font-mono">WELCOME15</code> (15%).
          </>
        }
        meta={`Кодів: ${coupons.length}`}
      />

      {canWrite ? (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold">Новий промокод</h2>
          <form action={createCouponAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Код</span>
              <input
                name="code"
                required
                placeholder="SUMMER10"
                className="h-10 w-full rounded-xl border border-border bg-background px-3 uppercase"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Тип</span>
              <select
                name="type"
                defaultValue={CouponType.PERCENTAGE}
                className="h-10 w-full rounded-xl border border-border bg-background px-3"
              >
                <option value={CouponType.PERCENTAGE}>Відсоток</option>
                <option value={CouponType.FIXED_AMOUNT}>Фіксована сума (₴)</option>
                <option value={CouponType.FREE_SHIPPING}>Безкоштовна доставка</option>
                <option value={CouponType.FIRST_ORDER}>Перше замовлення</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Знижка %</span>
              <input
                name="percentOff"
                type="number"
                min={0}
                max={100}
                defaultValue={10}
                className="h-10 w-full rounded-xl border border-border bg-background px-3"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Знижка ₴ (фікс)</span>
              <input
                name="amountOffUah"
                type="number"
                min={0}
                step="0.01"
                className="h-10 w-full rounded-xl border border-border bg-background px-3"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Мін. замовлення ₴</span>
              <input
                name="minOrderUah"
                type="number"
                min={0}
                step="1"
                className="h-10 w-full rounded-xl border border-border bg-background px-3"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Ліміт використань</span>
              <input
                name="usageLimit"
                type="number"
                min={0}
                className="h-10 w-full rounded-xl border border-border bg-background px-3"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm sm:col-span-2">
              <input name="isActive" type="checkbox" defaultChecked />
              Активний
            </label>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white sm:col-span-2"
            >
              Створити
            </button>
          </form>
        </section>
      ) : null}

      <section className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Код</th>
              <th className="px-3 py-3">Тип</th>
              <th className="px-3 py-3">Знижка</th>
              <th className="px-3 py-3">Використано</th>
              <th className="px-3 py-3">Статус</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b border-border/70">
                <td className="px-3 py-3 font-mono font-semibold">{coupon.code}</td>
                <td className="px-3 py-3">{coupon.type}</td>
                <td className="px-3 py-3">
                  {coupon.percentOff != null ? `${coupon.percentOff}%` : null}
                  {coupon.amountOff != null ? ` ${formatMoney(coupon.amountOff)}` : null}
                  {coupon.type === CouponType.FREE_SHIPPING ? " FREE SHIP" : null}
                </td>
                <td className="px-3 py-3">
                  {coupon.usageCount}
                  {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : ""}
                </td>
                <td className="px-3 py-3">
                  {coupon.isActive ? (
                    <span className="text-success">active</span>
                  ) : (
                    <span className="text-muted-foreground">off</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  {canWrite ? (
                    <form action={toggleCouponAction} className="inline">
                      <input type="hidden" name="id" value={coupon.id} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={coupon.isActive ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-border px-2 py-1 text-xs hover:border-primary"
                      >
                        {coupon.isActive ? "Вимкнути" : "Увімкнути"}
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </div>
  );
}
