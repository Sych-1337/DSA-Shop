import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import {
  CatalogPagination,
  CatalogSortBar,
} from "@/components/store/catalog-controls";
import { CatalogLayout } from "@/components/store/catalog-layout";
import { ProductCard } from "@/components/store/product-card";
import {
  isThinCatalogQuery,
  parseCatalogSearchParams,
} from "@/features/catalog/schema";
import {
  getCategoryBySlug,
  listActiveBrands,
  listActiveCategories,
  listActiveFandoms,
  listCatalogProducts,
} from "@/features/catalog/service";
import {
  buildEntityMetadata,
  collectionPageJsonLd,
} from "@/features/seo/service";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; categorySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale, categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return { title: "404", robots: { index: false, follow: false } };

  const query = parseCatalogSearchParams({
    ...(await searchParams),
    category: categorySlug,
  });

  return buildEntityMetadata({
    entityType: "category",
    entityId: category.id,
    fallbackTitle: category.name,
    fallbackDescription: category.description,
    fallbackPath: `/catalog/${category.slug}`,
    fallbackImage: category.imageUrl,
    locale,
    forceNoindex: isThinCatalogQuery(query, { ignoreCategory: true }),
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; categorySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("catalog");
  const { locale, categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const query = parseCatalogSearchParams({
    ...(await searchParams),
    category: categorySlug,
  });

  const [result, categories, fandoms, brands] = await Promise.all([
    listCatalogProducts(query),
    listActiveCategories(),
    listActiveFandoms(),
    listActiveBrands(),
  ]);

  const basePath = `/catalog`;
  const thin = isThinCatalogQuery(query, { ignoreCategory: true });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {!thin ? (
        <JsonLd
          id={`category-jsonld-${category.slug}`}
          data={collectionPageJsonLd({
            name: category.name,
            description: category.description,
            path: `/catalog/${category.slug}`,
            locale,
          })}
        />
      ) : null}
      <div className="mb-6">
        <p className="text-muted-foreground text-sm">{t("title")}</p>
        <h1 className="text-display text-3xl font-semibold sm:text-4xl">{category.name}</h1>
        {category.description ? (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        ) : null}
      </div>

      <CatalogLayout
        filterProps={{
          basePath,
          query,
          categories,
          fandoms,
          brands,
        }}
        toolbar={<CatalogSortBar basePath={basePath} query={query} total={result.total} />}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <CatalogPagination basePath={basePath} query={query} totalPages={result.totalPages} />
      </CatalogLayout>
    </main>
  );
}
