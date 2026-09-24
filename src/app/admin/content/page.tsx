import {
  saveBlogPostAction,
  updateHomepageBlockAction,
} from "@/features/content/actions";
import { listAllBlogPosts, listHomepageBlocks } from "@/features/content/service";
import { ContentStatus } from "@/generated/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/lib/auth/rbac";

export default async function AdminContentPage() {
  await requirePermission("content.write", "/admin/content");
  const [blocks, posts] = await Promise.all([listHomepageBlocks(), listAllBlogPosts()]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Контент"
        description="Блоки головної та статті блогу. Зміни одразу на вітрині."
      />

      <section className="space-y-4">
        <h2 className="text-display text-2xl font-semibold">Головна — блоки</h2>
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Немає блоків. Запустіть seed.</p>
        ) : null}
        {blocks.map((block) => (
          <form
            key={block.id}
            action={updateHomepageBlockAction}
            className="space-y-3 rounded-xl border border-border bg-surface p-4"
          >
            <input type="hidden" name="id" value={block.id} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {block.key}{" "}
                <span className="text-xs font-normal text-muted-foreground">({block.type})</span>
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isEnabled" defaultChecked={block.isEnabled} />
                Увімкнено
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Title
                <input
                  name="title"
                  defaultValue={block.title ?? ""}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                Sort
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={block.sortOrder}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
            </div>
            <label className="block text-sm">
              Subtitle
              <input
                name="subtitle"
                defaultValue={block.subtitle ?? ""}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Config (JSON)
              <textarea
                name="configJson"
                rows={5}
                defaultValue={JSON.stringify(block.config ?? {}, null, 2)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Зберегти блок
            </button>
          </form>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-display text-2xl font-semibold">Блог</h2>
        <form
          action={saveBlogPostAction}
          className="space-y-3 rounded-xl border border-border bg-surface p-4"
        >
          <p className="font-semibold">Нова стаття (або оновлення за slug)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Slug
              <input
                name="slug"
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Status
              <select
                name="status"
                defaultValue={ContentStatus.DRAFT}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            Title
            <input
              name="title"
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Excerpt
            <input
              name="excerpt"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Body
            <textarea
              name="body"
              required
              rows={6}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Author
              <input
                name="authorName"
                defaultValue="D&A"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Cover URL
              <input
                name="coverImageUrl"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              SEO title
              <input
                name="seoTitle"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              SEO description
              <input
                name="seoDescription"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Зберегти статтю
          </button>
        </form>

        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {posts.map((post) => (
            <li key={post.id} className="flex flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      post.coverImageUrl ||
                      `/api/placeholder?title=${encodeURIComponent(post.title.slice(0, 12))}&hue=320`
                    }
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{post.title}</p>
                  <p className="text-muted-foreground">
                    /blog/{post.slug} · {post.status}
                  </p>
                  {post.coverImageUrl ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      Cover: {post.coverImageUrl}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Cover URL ще не задано</p>
                  )}
                </div>
              </div>
              <form action={saveBlogPostAction} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={post.id} />
                <input type="hidden" name="slug" value={post.slug} />
                <input type="hidden" name="title" value={post.title} />
                <input type="hidden" name="excerpt" value={post.excerpt ?? ""} />
                <input type="hidden" name="body" value={post.body} />
                <input type="hidden" name="authorName" value={post.authorName ?? ""} />
                <input type="hidden" name="seoTitle" value={post.seoTitle ?? ""} />
                <input type="hidden" name="seoDescription" value={post.seoDescription ?? ""} />
                <label className="block text-xs">
                  Cover URL
                  <input
                    name="coverImageUrl"
                    defaultValue={post.coverImageUrl ?? ""}
                    placeholder="/banners/…"
                    className="mt-1 w-44 rounded-lg border border-border bg-background px-2 py-1 sm:w-56"
                  />
                </label>
                <select
                  name="status"
                  defaultValue={post.status}
                  className="rounded-lg border border-border bg-background px-2 py-1"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
                <button
                  type="submit"
                  className="rounded-lg border border-border px-3 py-1 font-medium"
                >
                  Оновити
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
