import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addAdjustmentAction,
  lockPeriodAction,
  rebuildPeriodAction,
  recordPaymentAction,
} from "@/features/commission/actions";
import { getSettlementPeriodDetail } from "@/features/commission/service";
import { formatMoney } from "@/lib/money";

export default async function AdminCommissionPeriodPage({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;
  const period = await getSettlementPeriodDetail(periodId);
  if (!period) notFound();

  const isLocked = period.status === "LOCKED";

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/commissions" className="text-sm text-primary hover:underline">
          ← Усі періоди
        </Link>
        <h1 className="text-display mt-2 text-3xl font-semibold">
          Settlement {period.year}-{String(period.month).padStart(2, "0")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {period.status}
          {period.lockedAt ? ` · locked ${period.lockedAt.toLocaleString("uk-UA")}` : ""}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted-foreground">Eligible base</p>
          <p className="text-display text-2xl font-semibold">
            {formatMoney(period.totalEligibleBase)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted-foreground">Adjustments</p>
          <p className="text-display text-2xl font-semibold">
            {formatMoney(period.totalAdjustments)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted-foreground">Commission due</p>
          <p className="text-display text-2xl font-semibold">
            {formatMoney(period.totalCommission)}
          </p>
        </div>
      </section>

      {!isLocked ? (
        <div className="flex flex-wrap gap-2">
          <form action={rebuildPeriodAction}>
            <input type="hidden" name="periodId" value={period.id} />
            <button type="submit" className="rounded-lg border border-border px-4 py-2 text-sm">
              Rebuild from orders
            </button>
          </form>
          <form action={lockPeriodAction}>
            <input type="hidden" name="periodId" value={period.id} />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Lock period
            </button>
          </form>
        </div>
      ) : null}

      <section>
        <h2 className="text-display mb-3 text-xl font-semibold">Line items</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Base</th>
                <th className="px-3 py-2">Rate</th>
                <th className="px-3 py-2">Commission</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {period.lineItems.map((line) => (
                <tr key={line.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link href={`/admin/orders/${line.orderId}`} className="hover:text-primary">
                      {line.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{line.source}</td>
                  <td className="px-3 py-2">{formatMoney(line.baseAmount)}</td>
                  <td className="px-3 py-2">{(line.rateBps / 100).toFixed(2)}%</td>
                  <td className="px-3 py-2">{formatMoney(line.commissionAmount)}</td>
                  <td className="px-3 py-2">{line.status}</td>
                </tr>
              ))}
              {period.lineItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-muted-foreground">
                    Немає рядків. Переведіть замовлення в DELIVERED/COMPLETED або Rebuild.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-display text-xl font-semibold">Adjustments</h2>
          {!isLocked ? (
            <form action={addAdjustmentAction} className="space-y-2 rounded-xl border border-border p-4">
              <label className="block text-sm">
                Amount (kopiyky, can be negative)
                <input
                  name="amount"
                  type="number"
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                Reason
                <input
                  name="reason"
                  required
                  placeholder="Late return after prior lock"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <input type="hidden" name="periodId" value={period.id} />
              <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-sm text-white">
                Add adjustment
              </button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Період залоковано — late returns додавайте в наступний draft.
            </p>
          )}
          <ul className="divide-y divide-border rounded-xl border border-border text-sm">
            {period.adjustments.map((adj) => (
              <li key={adj.id} className="px-3 py-2">
                {formatMoney(adj.amount)} · {adj.reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-display text-xl font-semibold">Payments</h2>
          {isLocked ? (
            <form action={recordPaymentAction} className="space-y-2 rounded-xl border border-border p-4">
              <input type="hidden" name="periodId" value={period.id} />
              <label className="block text-sm">
                Amount (kopiyky)
                <input
                  name="amount"
                  type="number"
                  required
                  defaultValue={period.totalCommission}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                Method
                <input
                  name="method"
                  placeholder="bank_transfer"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                Note
                <input
                  name="note"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-sm text-white">
                Record payment
              </button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">Спочатку lock період.</p>
          )}
          <ul className="divide-y divide-border rounded-xl border border-border text-sm">
            {period.payments.map((p) => (
              <li key={p.id} className="px-3 py-2">
                {formatMoney(p.amount)} · {p.paidAt.toLocaleDateString("uk-UA")}
                {p.method ? ` · ${p.method}` : ""}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
