import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { prisma } from "@/lib/db/prisma";

import { absoluteUrl } from "./json-ld";
import {
  hreflangLanguages,
  localizedSeoPath,
  ogLocaleByAppLocale,
  resolveAppLocale,
} from "./locale-path";

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

/**
 * Storefront metadata with locale-prefixed canonical + hreflang for uk/en/ru.
 * `fallbackPath` may be bare (`/product/x`) or already localized — both work.
 */
export async function buildEntityMetadata(input: {
  entityType: SeoEntityType;
  entityId: string;
  fallbackTitle: string;
  fallbackDescription?: string | null;
  fallbackPath: string;
  fallbackImage?: string | null;
  locale?: string;
  /** Force noindex even if SeoMeta says otherwise (account, wishlist, thin filters). */
  forceNoindex?: boolean;
}): Promise<Metadata> {
  const meta = await getSeoMeta(input.entityType, input.entityId);
  const locale = resolveAppLocale(input.locale ?? (await getLocale()));
  const title = meta?.title || input.fallbackTitle;
  const description = meta?.description || input.fallbackDescription || undefined;
  const image = meta?.ogImageUrl || input.fallbackImage || undefined;
  const localizedPath = localizedSeoPath(
    locale,
    meta?.canonicalPath || input.fallbackPath,
  );
  const noindex = Boolean(input.forceNoindex || meta?.noindex);
  const alternateLocales = Object.values(ogLocaleByAppLocale).filter(
    (value) => value !== ogLocaleByAppLocale[locale],
  );

  return {
    title,
    description,
    alternates: {
      canonical: localizedPath,
      languages: hreflangLanguages(localizedPath),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(localizedPath),
      images: image ? [{ url: image }] : undefined,
      locale: ogLocaleByAppLocale[locale],
      alternateLocale: alternateLocales,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export {
  absoluteUrl,
  blogPostingJsonLd,
  breadcrumbJsonLd,
  collectionPageJsonLd,
  jsonLdScript,
  organizationJsonLd,
  productJsonLd,
  websiteJsonLd,
} from "./json-ld";

export {
  bareSeoPath,
  hreflangLanguages,
  localizedSeoPath,
  ogLocaleByAppLocale,
  resolveAppLocale,
} from "./locale-path";
