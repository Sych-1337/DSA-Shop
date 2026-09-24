import { getTranslations } from "next-intl/server";
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
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("catalog");
  const tBrand = await getTranslations("brand");
  const query = parseCatalogSearchParams(await searchParams);
  return buildEntityMetadata({
    entityType: "page",
    entityId: "catalog",
    fallbackTitle: t("title"),
    fallbackDescription: tBrand("support"),
    fallbackPath: "/catalog",
    locale,
    forceNoindex: isThinCatalogQuery(query),
  });
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const t = await getTranslations("catalog");
  const tBrand = await getTranslations("brand");
  const raw = await searchParams;
  const query = parseCatalogSearchParams(raw);
  const [result, categories, fandoms, brands] = await Promise.all([
    listCatalogProducts(query),
    listActiveCategories(),
    listActiveFandoms(),
    listActiveBrands(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {!isThinCatalogQuery(query) ? (
        <JsonLd
          id="catalog-jsonld"
          data={collectionPageJsonLd({
            name: t("title"),
            description: tBrand("support"),
            path: "/catalog",
            locale,
          })}
        />
      ) : null}
      <div className="mb-6">
        <h1 className="text-display text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{tBrand("support")}</p>
      </div>

      <CatalogLayout
        filterProps={{
          basePath: "/catalog",
          query,
          categories,
          fandoms,
          brands,
        }}
        toolbar={<CatalogSortBar basePath="/catalog" query={query} total={result.total} />}
      >
        {result.products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center sm:p-12">
            <p className="font-semibold">{t("empty")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("emptyHint")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        <CatalogPagination basePath="/catalog" query={query} totalPages={result.totalPages} />
      </CatalogLayout>
    </main>
  );
}
