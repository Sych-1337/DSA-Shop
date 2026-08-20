import type { Metadata } from "next";

import { prisma } from "@/lib/db/prisma";

import { absoluteUrl } from "./json-ld";

export type SeoEntityType =
  | "product"
  | "category"
  | "collection"
  | "fandom"
  | "blog"
  | "page"
  | "home";

export async function getSeoMeta(entityType: SeoEntityType, entityId: string) {
  return prisma.seoMeta.findUnique({
    where: { entityType_entityId: { entityType, entityId } },
  });
}

export async function upsertSeoMeta(input: {
  entityType: string;
  entityId: string;
  title?: string | null;
  description?: string | null;
  h1?: string | null;
  canonicalPath?: string | null;
  ogImageUrl?: string | null;
  noindex?: boolean;
}) {
  return prisma.seoMeta.upsert({
    where: {
      entityType_entityId: {
        entityType: input.entityType,
        entityId: input.entityId,
      },
    },
    create: {
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title || null,
      description: input.description || null,
      h1: input.h1 || null,
      canonicalPath: input.canonicalPath || null,
      ogImageUrl: input.ogImageUrl || null,
      noindex: input.noindex ?? false,
    },
    update: {
      title: input.title || null,
      description: input.description || null,
      h1: input.h1 || null,
      canonicalPath: input.canonicalPath || null,
      ogImageUrl: input.ogImageUrl || null,
      noindex: input.noindex ?? false,
    },
  });
}

export async function listSeoMeta(limit = 100) {
  return prisma.seoMeta.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function listRedirects() {
  return prisma.redirect.findMany({ orderBy: { updatedAt: "desc" } });
}

export async function createRedirect(input: {
  fromPath: string;
  toPath: string;
  statusCode: number;
  isActive?: boolean;
  note?: string | null;
}) {
  return prisma.redirect.create({
    data: {
      fromPath: input.fromPath,
      toPath: input.toPath,
      statusCode: input.statusCode,
      isActive: input.isActive ?? true,
      note: input.note || null,
    },
  });
}

export async function toggleRedirect(id: string, isActive: boolean) {
  return prisma.redirect.update({ where: { id }, data: { isActive } });
}

export async function findActiveRedirect(fromPath: string) {
  return prisma.redirect.findFirst({
    where: { fromPath, isActive: true },
  });
}

export async function bumpRedirectHit(id: string) {
  return prisma.redirect.update({
    where: { id },
    data: { hitCount: { increment: 1 } },
  });
}

export async function buildEntityMetadata(input: {
  entityType: SeoEntityType;
  entityId: string;
  fallbackTitle: string;
  fallbackDescription?: string | null;
  fallbackPath: string;
  fallbackImage?: string | null;
}): Promise<Metadata> {
  const meta = await getSeoMeta(input.entityType, input.entityId);
  const title = meta?.title || input.fallbackTitle;
  const description = meta?.description || input.fallbackDescription || undefined;
  const path = meta?.canonicalPath || input.fallbackPath;
  const image = meta?.ogImageUrl || input.fallbackImage || undefined;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      images: image ? [{ url: image }] : undefined,
      locale: "uk_UA",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: meta?.noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export {
  absoluteUrl,
  blogPostingJsonLd,
  breadcrumbJsonLd,
  jsonLdScript,
  organizationJsonLd,
  productJsonLd,
  websiteJsonLd,
} from "./json-ld";
