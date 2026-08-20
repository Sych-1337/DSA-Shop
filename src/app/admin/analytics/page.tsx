import { getAnalyticsOverview } from "@/features/analytics/service";
import { requirePermission } from "@/lib/auth/rbac";

export default async function AdminAnalyticsPage() {
  await requirePermission("analytics.read", "/admin/analytics");
  const { eventCounts, recent, metrics, since, provider, firebaseConfigured } =
    await getAnalyticsOverview(14);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-display text-3xl font-semibold">Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          Події з {since.toLocaleDateString("uk-UA")} · внутрішній лог + provider{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">{provider}</code>
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold">Firebase / GA4</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Provider</dt>
            <dd className="font-medium">{provider}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Client measurement ID</dt>
            <dd className="font-medium">
              {firebaseConfigured ? "налаштовано" : "не задано (stub)"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Заготовка: клієнтський gtag (`SiteAnalytics`) + серверний Measurement Protocol при
          `ANALYTICS_PROVIDER=firebase` і `GA4_API_SECRET`. Події також пишуться в Postgres.
        </p>
      </section>

      <section>
        <h2 className="text-display mb-3 text-xl font-semibold">Топ подій (14 днів)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {eventCounts.map((row) => (
            <div
              key={row.name}
              className="rounded-xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-card)]"
            >
              <p className="text-sm text-muted-foreground">{row.name}</p>
              <p className="text-display text-2xl font-semibold">{row._count._all}</p>
            </div>
          ))}
          {eventCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ще немає подій. Відкрийте PDP, пошук, wishlist або завершіть оплату.
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-display mb-3 text-xl font-semibold">Daily metrics</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Key</th>
                <th className="px-3 py-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-2">{row.date.toISOString().slice(0, 10)}</td>
                  <td className="px-3 py-2">{row.key}</td>
                  <td className="px-3 py-2">{row.value}</td>
                </tr>
              ))}
              {metrics.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-muted-foreground">
                    Немає агрегованих метрик.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-display mb-3 text-xl font-semibold">Останні події</h2>
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface text-sm">
          {recent.map((event) => (
            <li key={event.id} className="px-4 py-3">
              <p className="font-medium">{event.name}</p>
              <p className="text-muted-foreground">
                {event.createdAt.toLocaleString("uk-UA")}
                {event.path ? ` · ${event.path}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
