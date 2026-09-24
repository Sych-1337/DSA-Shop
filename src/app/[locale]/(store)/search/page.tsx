import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import {
  CatalogPagination,
  CatalogSortBar,
} from "@/components/store/catalog-controls";
import { CatalogLayout } from "@/components/store/catalog-layout";
import { ProductCard } from "@/components/store/product-card";
import { parseCatalogSearchParams } from "@/features/catalog/schema";
import {
  listActiveBrands,
  listActiveCategories,
  listActiveFandoms,
  listCatalogProducts,
  listFeaturedProducts,
  listPopularSearchQueries,
  logSearchQuery,
} from "@/features/catalog/service";
import { buildEntityMetadata } from "@/features/seo/service";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("catalog");
  const query = parseCatalogSearchParams(await searchParams);
  const title = query.q ? t("searchFor", { query: query.q }) : t("search");
  return buildEntityMetadata({
    entityType: "page",
    entityId: "search",
    fallbackTitle: title,
    fallbackDescription: t("searchHint"),
    fallbackPath: "/search",
    locale,
    forceNoindex: true,
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("catalog");
  const params = await searchParams;
  const query = parseCatalogSearchParams(params);
  const [result, categories, fandoms, brands] = await Promise.all([
    listCatalogProducts(query),
    listActiveCategories(),
    listActiveFandoms(),
    listActiveBrands(),
  ]);

  if (query.q) {
    await logSearchQuery(query.q, result.total);
  }

  const empty = result.products.length === 0;
  const [popularQueries, similar] = empty
    ? await Promise.all([listPopularSearchQueries(6), listFeaturedProducts(4)])
    : [[], []];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-display text-3xl font-semibold sm:text-4xl">{t("search")}</h1>
        <p className="mt-2 text-muted-foreground">
          {query.q ? t("searchFor", { query: query.q }) : t("searchHint")}
        </p>
      </div>

      <CatalogLayout
        filterProps={{
          basePath: "/search",
          query,
          categories,
          fandoms,
          brands,
        }}
        toolbar={<CatalogSortBar basePath="/search" query={query} total={result.total} />}
      >
        {empty ? (
          <div className="space-y-8">
            <div className="rounded-2xl border border-dashed border-border p-8 text-center sm:p-12">
              <p className="font-semibold">{t("empty")}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t("searchEmptyHint")}</p>
              {popularQueries.length > 0 ? (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {popularQueries.map((term) => (
                    <Link
                      key={term}
                      href={`/search?q=${encodeURIComponent(term)}`}
                      className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary hover:text-primary"
                    >
                      {term}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            {similar.length > 0 ? (
              <section>
                <h2 className="text-display mb-4 text-2xl font-semibold">{t("searchTryThese")}</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {similar.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {!empty ? (
          <CatalogPagination basePath="/search" query={query} totalPages={result.totalPages} />
        ) : null}
      </CatalogLayout>
    </main>
  );
}
