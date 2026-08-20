import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { getPublishedBlogPostBySlug } from "@/features/content/service";
import {
  blogPostingJsonLd,
  breadcrumbJsonLd,
  buildEntityMetadata,
} from "@/features/seo/service";
import { trackEvent } from "@/features/analytics/service";

const DATE_LOCALES: Record<string, string> = {
  uk: "uk-UA",
  en: "en-GB",
  ru: "ru-RU",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("blog");
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) return { title: t("article") };
  return buildEntityMetadata({
    entityType: "blog",
    entityId: post.id,
    fallbackTitle: post.seoTitle || post.title,
    fallbackDescription: post.seoDescription || post.excerpt,
    fallbackPath: `/blog/${post.slug}`,
    fallbackImage: post.coverImageUrl,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = await getTranslations("blog");
  const locale = await getLocale();
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) notFound();

  await trackEvent({
    name: "view_blog_post",
    path: `/blog/${post.slug}`,
    properties: { slug: post.slug, id: post.id },
  });

  const paragraphs = post.body.split(/\n\n+/).filter(Boolean);
  const dateLocale = DATE_LOCALES[locale] ?? "uk-UA";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd
        id={`blog-jsonld-${post.slug}`}
        data={[
          breadcrumbJsonLd([
            { name: t("home"), path: "/" },
            { name: t("title"), path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          blogPostingJsonLd({
            title: post.title,
            description: post.excerpt,
            path: `/blog/${post.slug}`,
            publishedAt: post.publishedAt,
            authorName: post.authorName,
            imageUrl: post.coverImageUrl,
          }),
        ]}
      />

      <nav className="mb-6 flex flex-wrap gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          {t("home")}
        </Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-primary">
          {t("title")}
        </Link>
        <span>/</span>
        <span className="text-foreground">{post.title}</span>
      </nav>

      {post.coverImageUrl ? (
        <div className="mb-8 overflow-hidden rounded-[1.75rem] border border-border bg-surface-muted shadow-[var(--shadow-card)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      ) : null}

      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        {post.publishedAt ? post.publishedAt.toLocaleDateString(dateLocale) : null}
        {post.authorName ? ` · ${post.authorName}` : null}
      </p>
      <h1 className="text-display mt-2 text-4xl font-semibold">{post.title}</h1>
      {post.excerpt ? <p className="mt-3 text-lg text-muted-foreground">{post.excerpt}</p> : null}

      <article className="mt-10 space-y-4 text-base leading-relaxed">
        {paragraphs.map((p) => (
          <p key={p.slice(0, 48)}>{p}</p>
        ))}
      </article>
    </main>
  );
}
