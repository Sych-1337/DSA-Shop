import { getTranslations } from "next-intl/server";

import {
  CatalogCategoryRail,
  CatalogFilters,
  type FilterOption,
} from "@/components/store/catalog-filters";
import { CatalogFiltersDrawer } from "@/components/store/catalog-filters-drawer";
import type { CatalogQuery } from "@/features/catalog/schema";

export async function CatalogLayout({
  filterProps,
  toolbar,
  children,
}: {
  filterProps: {
    basePath: string;
    query: CatalogQuery;
    categories: FilterOption[];
    fandoms: FilterOption[];
    brands: FilterOption[];
  };
  toolbar: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = await getTranslations("catalog");
  const tNav = await getTranslations("nav");
  const activeCount = [
    filterProps.query.category,
    filterProps.query.fandom,
    filterProps.query.brand,
    filterProps.query.inStock,
    filterProps.query.onSale,
  ].filter(Boolean).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[272px_1fr]">
      <div className="hidden lg:block">
        <CatalogFilters {...filterProps} compact />
      </div>
      <section className="min-w-0">
        <CatalogCategoryRail
          basePath={filterProps.basePath}
          query={filterProps.query}
          categories={filterProps.categories}
          allLabel={t("all")}
        />
        <div className="mb-3 flex flex-wrap items-center gap-3 lg:hidden">
          <CatalogFiltersDrawer
            label={activeCount > 0 ? `${t("filters")} · ${activeCount}` : t("filters")}
            closeLabel={tNav("close")}
          >
            <CatalogFilters {...filterProps} compact />
          </CatalogFiltersDrawer>
        </div>
        {toolbar}
        {children}
      </section>
    </div>
  );
}
