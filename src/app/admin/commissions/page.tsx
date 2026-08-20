import Link from "next/link";

import {
  ensureDraftPeriodAction,
  lockPeriodAction,
  rebuildPeriodAction,
} from "@/features/commission/actions";
import { getCommissionDashboard } from "@/features/commission/service";
import { formatMoney } from "@/lib/money";

export default async function AdminCommissionsPage() {
  const { agreement, periods, cumulativePayout, currentRateBps } = await getCommissionDashboard();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl font-semibold">Комісія розробника</h1>
          <p className="mt-2 text-muted-foreground">
            7% → 4% після року або досягнення payoff; місячні settlement-и з lock.
          </p>
        </div>
        <form action={ensureDraftPeriodAction}>
          <button
            type="submit"
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold"
          >
            Створити / відкрити поточний період
          </button>
        </form>
      </div>

      {!agreement ? (
        <p className="text-muted-foreground">Немає активної угоди. Запустіть seed.</p>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-muted-foreground">Угода</p>
            <p className="font-semibold">{agreement.name}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-muted-foreground">Поточна ставка</p>
            <p className="text-display text-2xl font-semibold">
              {((currentRateBps ?? 0) / 100).toFixed(2)}%
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-muted-foreground">Payoff target</p>
            <p className="font-semibold">{formatMoney(agreement.payoffTargetAmount)}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-muted-foreground">Виплачено накопичено</p>
            <p className="font-semibold">{formatMoney(cumulativePayout)}</p>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-display mb-3 text-xl font-semibold">Періоди</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Lines</th>
                <th className="px-3 py-2">Base</th>
                <th className="px-3 py-2">Commission</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/commissions/${period.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {period.year}-{String(period.month).padStart(2, "0")}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{period.status}</td>
                  <td className="px-3 py-2">{period._count.lineItems}</td>
                  <td className="px-3 py-2">{formatMoney(period.totalEligibleBase)}</td>
                  <td className="px-3 py-2">{formatMoney(period.totalCommission)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {period.status !== "LOCKED" ? (
                        <>
                          <form action={rebuildPeriodAction}>
                            <input type="hidden" name="periodId" value={period.id} />
                            <button
                              type="submit"
                              className="rounded border border-border px-2 py-1 text-xs"
                            >
                              Rebuild
                            </button>
                          </form>
                          <form action={lockPeriodAction}>
                            <input type="hidden" name="periodId" value={period.id} />
                            <button
                              type="submit"
                              className="rounded bg-primary px-2 py-1 text-xs font-semibold text-white"
                            >
                              Lock
                            </button>
                          </form>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">locked</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {periods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-muted-foreground">
                    Періодів ще немає.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
