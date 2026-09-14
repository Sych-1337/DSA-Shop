import type { MetadataRoute } from "next";

import { ContentStatus, ProductStatus } from "@/generated/prisma";
import { absoluteUrl } from "@/features/seo/json-ld";
import { locales } from "@/i18n/config";
import { prisma } from "@/lib/db/prisma";

/** Don't hit Postgres during `next build` (Docker build has no live DB). */
export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  "",
  "/catalog",
  "/blog",
  "/about",
  "/contacts",
  "/delivery-payment",
  "/returns",
  "/faq",
  "/privacy",
  "/terms",
  "/public-offer",
  "/track-order",
  "/wishlist",
];

function staticEntries(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: absoluteUrl(`/${locale}${path}`),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.7,
      });
    }
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string; updatedAt: Date }[] = [];
  let collections: { slug: string; updatedAt: Date }[] = [];
  let fandoms: { slug: string; updatedAt: Date }[] = [];
  let posts: { slug: string; updatedAt: Date }[] = [];

  try {
    [products, categories, collections, fandoms, posts] = await Promise.all([
      prisma.product.findMany({
        where: { status: ProductStatus.PUBLISHED, archivedAt: null },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.collection.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.fandom.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.blogPost.findMany({
        where: { status: ContentStatus.PUBLISHED, archivedAt: null },
        select: { slug: true, updatedAt: true },
      }),
    ]);
  } catch (error) {
    console.warn("[sitemap] DB unavailable, returning static URLs only:", error);
    return staticEntries();
  }

  const entries = staticEntries();

  for (const locale of locales) {
    for (const p of products) {
      entries.push({
        url: absoluteUrl(`/${locale}/product/${p.slug}`),
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const c of categories) {
      entries.push({
        url: absoluteUrl(`/${locale}/catalog/${c.slug}`),
        lastModified: c.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const c of collections) {
      entries.push({
        url: absoluteUrl(`/${locale}/collection/${c.slug}`),
        lastModified: c.updatedAt,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
    for (const f of fandoms) {
      entries.push({
        url: absoluteUrl(`/${locale}/fandom/${f.slug}`),
        lastModified: f.updatedAt,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
    for (const post of posts) {
      entries.push({
        url: absoluteUrl(`/${locale}/blog/${post.slug}`),
        lastModified: post.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
