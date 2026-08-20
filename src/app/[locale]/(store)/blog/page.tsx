import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { BlogCard } from "@/components/store/blog-card";
import { listPublishedBlogPosts } from "@/features/content/service";
import { buildEntityMetadata } from "@/features/seo/service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("blog");
  return buildEntityMetadata({
    entityType: "page",
    entityId: "blog",
    fallbackTitle: t("title"),
    fallbackDescription: t("subtitle"),
    fallbackPath: "/blog",
  });
}

export default async function BlogIndexPage() {
  const t = await getTranslations("blog");
  const locale = await getLocale();
  const posts = await listPublishedBlogPosts();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
      <h1 className="text-display text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground sm:text-lg">{t("subtitle")}</p>

      {posts.length === 0 ? (
        <p className="mt-10 text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {posts.map((post) => (
            <li key={post.id}>
              <BlogCard post={post} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
