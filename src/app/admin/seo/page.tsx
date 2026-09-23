import {
  createRedirectAction,
  saveSeoMetaAction,
  toggleRedirectAction,
} from "@/features/content/actions";
import { listRedirects, listSeoMeta } from "@/features/seo/service";
import { requirePermission } from "@/lib/auth/rbac";

export default async function AdminSeoPage() {
  await requirePermission("seo.write", "/admin/seo");
  const [metas, redirects] = await Promise.all([listSeoMeta(), listRedirects()]);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-display text-3xl font-semibold">SEO</h1>
        <p className="mt-2 text-muted-foreground">
          Метадані сутностей та редіректи slug / старих URL.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-display text-2xl font-semibold">SeoMeta</h2>
        <form
          action={saveSeoMetaAction}
          className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2"
        >
          <label className="block text-sm">
            Entity type
            <input
              name="entityType"
              required
              placeholder="home | product | blog | page"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Entity id
            <input
              name="entityId"
              required
              placeholder="home | cuid"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            Title
            <input
              name="title"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            Description
            <textarea
              name="description"
              rows={2}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            H1
            <input
              name="h1"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Canonical path
            <input
              name="canonicalPath"
              placeholder="/"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            OG image URL
            <input
              name="ogImageUrl"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="noindex" />
            noindex
          </label>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white sm:col-span-2 sm:w-fit"
          >
            Зберегти SEO
          </button>
        </form>

        <ul className="divide-y divide-border rounded-xl border border-border bg-surface text-sm">
          {metas.map((row) => (
            <li key={row.id} className="px-4 py-3">
              <p className="font-medium">
                {row.entityType}/{row.entityId}
                {row.noindex ? (
                  <span className="ml-2 text-xs text-muted-foreground">noindex</span>
                ) : null}
              </p>
              <p className="text-muted-foreground">
                {row.title || "—"} · {row.canonicalPath || "no canonical"}
              </p>
            </li>
          ))}
          {metas.length === 0 ? (
            <li className="px-4 py-3 text-muted-foreground">Поки порожньо.</li>
          ) : null}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-display text-2xl font-semibold">Redirects</h2>
        <form
          action={createRedirectAction}
          className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2"
        >
          <label className="block text-sm">
            From
            <input
              name="fromPath"
              required
              placeholder="/old-path"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            To
            <input
              name="toPath"
              required
              placeholder="/new-path"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Code
            <select
              name="statusCode"
              defaultValue={301}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            >
              <option value={301}>301</option>
              <option value={302}>302</option>
            </select>
          </label>
          <label className="block text-sm">
            Note
            <input
              name="note"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white sm:col-span-2 sm:w-fit"
          >
            Додати редірект
          </button>
        </form>

        <ul className="divide-y divide-border rounded-xl border border-border bg-surface text-sm">
          {redirects.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {row.fromPath} → {row.toPath}{" "}
                  <span className="text-muted-foreground">({row.statusCode})</span>
                </p>
                <p className="text-muted-foreground">
                  hits: {row.hitCount} · {row.isActive ? "active" : "off"}
                </p>
              </div>
              <form action={toggleRedirectAction}>
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="isActive" value={row.isActive ? "false" : "true"} />
                <button type="submit" className="rounded-lg border border-border px-3 py-1">
                  {row.isActive ? "Вимкнути" : "Увімкнути"}
                </button>
              </form>
            </li>
          ))}
          {redirects.length === 0 ? (
            <li className="px-4 py-3 text-muted-foreground">Редіректів немає.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
