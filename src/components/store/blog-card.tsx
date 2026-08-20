import { Link } from "@/i18n/navigation";

export type BlogCardPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  authorName: string | null;
  publishedAt: Date | null;
};

const DATE_LOCALES: Record<string, string> = {
  uk: "uk-UA",
  en: "en-GB",
  ru: "ru-RU",
};

function coverSrc(post: BlogCardPost) {
  if (post.coverImageUrl) return post.coverImageUrl;
  return `/api/placeholder?title=${encodeURIComponent(post.title.slice(0, 24))}&hue=320`;
}

export function BlogCard({
  post,
  locale = "uk",
}: {
  post: BlogCardPost;
  locale?: string;
}) {
  const dateLocale = DATE_LOCALES[locale] ?? "uk-UA";
  const meta = [
    post.publishedAt ? post.publishedAt.toLocaleDateString(dateLocale) : null,
    post.authorName,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition hover:border-primary/40">
      <Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverSrc(post)}
            alt={post.title}
            className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {meta ? (
            <p className="text-xs tracking-wide text-muted-foreground uppercase">{meta}</p>
          ) : null}
          <h3 className="text-display mt-2 text-lg font-semibold transition group-hover:text-primary sm:text-xl">
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
