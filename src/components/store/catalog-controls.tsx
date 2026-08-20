import { getTranslations } from "next-intl/server";

import {
  buildCatalogHref,
  CatalogFilters as CatalogFiltersPanel,
  type FilterOption,
} from "@/components/store/catalog-filters";
import { CatalogSortSelect } from "@/components/store/catalog-sort-select";
import { Button } from "@/components/ui/button";
import type { CatalogQuery, CatalogSort } from "@/features/catalog/schema";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export { CatalogFiltersPanel as CatalogFilters, buildCatalogHref as buildHref };
export type { FilterOption };

export async function CatalogSortBar({
  basePath,
  query,
  total,
}: {
  basePath: string;
  query: CatalogQuery;
  total: number;
}) {
  const t = await getTranslations("catalog");
  const sortOptions: { value: CatalogSort; label: string }[] = [
    { value: "popular", label: t("sortPopular") },
    { value: "newest", label: t("sortNewest") },
    { value: "price_asc", label: t("sortPriceAsc") },
    { value: "price_desc", label: t("sortPriceDesc") },
    { value: "discount", label: t("sortDiscount") },
    { value: "rating", label: t("sortRating") },
  ];

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
      <p className="text-sm text-muted-foreground">{t("found", { total })}</p>
      <CatalogSortSelect
        label={t("sort")}
        current={query.sort}
        options={sortOptions.map((option) => ({
          ...option,
          href: buildCatalogHref(basePath, query, { sort: option.value }),
        }))}
      />
      <div className="hidden flex-wrap gap-2 sm:flex">
        {sortOptions.map((option) => (
          <Link
            key={option.value}
            href={buildCatalogHref(basePath, query, { sort: option.value })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              query.sort === option.value
                ? "border-primary bg-primary text-white"
                : "border-border hover:border-primary",
            )}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function CatalogPagination({
  basePath,
  query,
  totalPages,
}: {
  basePath: string;
  query: CatalogQuery;
  totalPages: number;
}) {
  const t = await getTranslations("catalog");
  const tCommon = await getTranslations("common");
  if (totalPages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {query.page > 1 ? (
        <Button
          href={buildCatalogHref(basePath, query, { page: query.page - 1 })}
          variant="outline"
          size="sm"
        >
          {tCommon("back")}
        </Button>
      ) : null}
      <span className="text-sm text-muted-foreground">
        {query.page} / {totalPages}
      </span>
      {query.page < totalPages ? (
        <Button
          href={buildCatalogHref(basePath, query, { page: query.page + 1 })}
          variant="outline"
          size="sm"
        >
          {t("next")}
        </Button>
      ) : null}
    </div>
  );
}
