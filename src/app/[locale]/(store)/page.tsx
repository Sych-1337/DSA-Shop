import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { JsonLd } from "@/components/seo/json-ld";
import { HomePage } from "@/components/store/home-page";
import {
  listActiveCategories,
  listFeaturedProducts,
  listNewProducts,
} from "@/features/catalog/service";
import { listHomepageBlocks, listPublishedBlogPosts } from "@/features/content/service";
import {
  AnalyticsEvents,
  productToAnalyticsItem,
} from "@/features/analytics/events";
import { trackEvent } from "@/features/analytics/service";
import {
  listPersonalizedProducts,
  listRecentlyViewed,
} from "@/features/recommendations/service";
import {
  buildEntityMetadata,
  organizationJsonLd,
  websiteJsonLd,
} from "@/features/seo/service";
import { storeDisplayName, storeTagline } from "@/lib/brand";
import { prisma } from "@/lib/db/prisma";
import { locales, type AppLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const setting = await prisma.storeSetting.findUnique({ where: { key: "store.name" } });
  const storeName = storeDisplayName(setting?.value as string | undefined);
  const languages = Object.fromEntries(
    locales.map((l) => [l, `/${l}`]),
  ) as Record<AppLocale, string>;

  const meta = await buildEntityMetadata({
    entityType: "home",
    entityId: "home",
    fallbackTitle: t("siteTitle"),
    fallbackDescription: t("siteDescription"),
    fallbackPath: `/${locale}`,
  });

  return {
    ...meta,
    title: meta.title ?? `${storeName}`,
    alternates: {
      ...meta.alternates,
      languages,
    },
  };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [settings, blocks, categories, featured, newest, forYouResult, recentlyViewed, blogPosts] =
    await Promise.all([
      prisma.storeSetting.findMany({
        where: { key: { in: ["store.name", "store.tagline"] } },
      }),
      listHomepageBlocks({ enabledOnly: true }),
      listActiveCategories(),
      listFeaturedProducts(4),
      listNewProducts(4),
      listPersonalizedProducts(4),
      listRecentlyViewed(4),
      listPublishedBlogPosts({ take: 3 }),
    ]);

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const storeName = storeDisplayName(map["store.name"] as string | undefined);
  const tagline = storeTagline(map["store.tagline"] as string | undefined);

  if (forYouResult.products.length > 0) {
    await trackEvent({
      name: AnalyticsEvents.REC_IMPRESSION,
      path: `/${locale}`,
      properties: {
        item_list_id: forYouResult.listId,
        item_list_name: forYouResult.personalized ? "For you" : "For you (cold start)",
        personalized: forYouResult.personalized,
        items: forYouResult.products.map((product, index) =>
          productToAnalyticsItem({
            id: product.id,
            title: product.title,
            priceAmount: product.priceAmount,
            brandName: product.brand?.name,
            categoryName: product.primaryCategory?.name,
            fandomName: product.fandom?.name,
            index,
            listId: forYouResult.listId,
            listName: "For you",
          }),
        ),
      },
    });
  }

  return (
    <>
      <JsonLd
        id="home-jsonld"
        data={[organizationJsonLd(storeName), websiteJsonLd(storeName)]}
      />
      <HomePage
        storeName={storeName}
        tagline={tagline}
        blocks={blocks}
        categories={categories.slice(0, 8).map((c) => ({
          href: `/catalog/${c.slug}`,
          label: c.name,
          imageUrl: c.imageUrl,
        }))}
        featured={featured}
        newest={newest}
        forYou={forYouResult.products}
        forYouPersonalized={forYouResult.personalized}
        recentlyViewed={recentlyViewed}
        blogPosts={blogPosts}
      />
    </>
  );
}
