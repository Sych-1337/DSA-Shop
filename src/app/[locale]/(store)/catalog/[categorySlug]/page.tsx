import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  CatalogPagination,
  CatalogSortBar,
} from "@/components/store/catalog-controls";
import { CatalogLayout } from "@/components/store/catalog-layout";
import { ProductCard } from "@/components/store/product-card";
import { parseCatalogSearchParams } from "@/features/catalog/schema";
import {
  getCategoryBySlug,
  listActiveBrands,
  listActiveCategories,
  listActiveFandoms,
  listCatalogProducts,
} from "@/features/catalog/service";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("catalog");
  const { categorySlug } = await params;
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

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
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
