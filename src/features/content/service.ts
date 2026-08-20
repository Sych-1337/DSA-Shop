import { ContentStatus, type Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";

import type { HomepageBlock } from "@/generated/prisma";

export type HeroSlide = {
  imageUrl: string;
  imageAlt?: string;
  href?: string;
};

export type HeroConfig = {
  brandLabel?: string;
  brandExpansion?: string;
  headline?: string;
  support?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  imageUrl?: string;
  imageAlt?: string;
  autoplayMs?: number;
  slides?: HeroSlide[];
};

export type BenefitsConfig = {
  items?: { title: string; text: string; icon?: string }[];
};

export type CtaBannerConfig = {
  label?: string;
  href?: string;
  tone?: "primary" | "secondary";
};

export type ProductGridConfig = {
  limit?: number;
  linkHref?: string;
  linkLabel?: string;
};

export async function listHomepageBlocks(opts?: { enabledOnly?: boolean }) {
  return prisma.homepageBlock.findMany({
    where: opts?.enabledOnly ? { isEnabled: true } : undefined,
    orderBy: { sortOrder: "asc" },
  });
}

export async function updateHomepageBlock(input: {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  sortOrder: number;
  isEnabled: boolean;
  config: Prisma.InputJsonValue;
}) {
  return prisma.homepageBlock.update({
    where: { id: input.id },
    data: {
      title: input.title,
      subtitle: input.subtitle,
      sortOrder: input.sortOrder,
      isEnabled: input.isEnabled,
      config: input.config,
    },
  });
}

export async function listPublishedBlogPosts(options?: { take?: number }) {
  return prisma.blogPost.findMany({
    where: { status: ContentStatus.PUBLISHED, archivedAt: null },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: options?.take,
  });
}

export async function listAllBlogPosts() {
  return prisma.blogPost.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function getBlogPostBySlug(slug: string) {
  return prisma.blogPost.findUnique({ where: { slug } });
}

export async function getPublishedBlogPostBySlug(slug: string) {
  const post = await getBlogPostBySlug(slug);
  if (!post || post.status !== ContentStatus.PUBLISHED || post.archivedAt) return null;
  return post;
}

export async function upsertBlogPost(input: {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  body: string;
  coverImageUrl?: string | null;
  authorName?: string | null;
  status: ContentStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
}) {
  const existing = input.id
    ? await prisma.blogPost.findUnique({ where: { id: input.id } })
    : await prisma.blogPost.findUnique({ where: { slug: input.slug } });

  let publishedAt = existing?.publishedAt ?? null;
  if (input.status === ContentStatus.PUBLISHED) {
    publishedAt = publishedAt ?? new Date();
  } else if (input.status === ContentStatus.DRAFT) {
    publishedAt = null;
  }

  const data = {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt || null,
    body: input.body,
    coverImageUrl: input.coverImageUrl || null,
    authorName: input.authorName || null,
    status: input.status,
    seoTitle: input.seoTitle || null,
    seoDescription: input.seoDescription || null,
    publishedAt,
    archivedAt: input.status === ContentStatus.ARCHIVED ? new Date() : null,
  };

  if (existing) {
    return prisma.blogPost.update({ where: { id: existing.id }, data });
  }

  return prisma.blogPost.create({ data });
}

export function parseBlockConfig<T>(block: HomepageBlock): T {
  return (block.config ?? {}) as T;
}

export { ContentStatus };
export type { HomepageBlock };
