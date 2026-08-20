import { Check, X } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { categoryPlaceholder, categoryVisual } from "@/components/store/catalog-category-visuals";
import { SoftImage } from "@/components/store/soft-image";
import { Button } from "@/components/ui/button";
import type { CatalogQuery } from "@/features/catalog/schema";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type FilterOption = {
  slug: string;
  name: string;
  imageUrl?: string | null;
  logoUrl?: string | null;
};

export function buildCatalogHref(
  basePath: string,
  current: CatalogQuery,
  patch: Partial<CatalogQuery>,
) {
  const next = { ...current, ...patch, page: patch.page ?? 1 };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.category) params.set("category", next.category);
  if (next.fandom) params.set("fandom", next.fandom);
  if (next.brand) params.set("brand", next.brand);
  if (next.minPrice !== undefined) params.set("minPrice", String(next.minPrice));
  if (next.maxPrice !== undefined) params.set("maxPrice", String(next.maxPrice));
  if (next.inStock) params.set("inStock", "1");
  if (next.onSale) params.set("onSale", "1");
  if (next.sort && next.sort !== "popular") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function ActiveChips({
  basePath,
  query,
  categories,
  fandoms,
  brands,
  clearLabel,
  inStockLabel,
  onSaleLabel,
}: {
  basePath: string;
  query: CatalogQuery;
  categories: FilterOption[];
  fandoms: FilterOption[];
  brands: FilterOption[];
  clearLabel: string;
  inStockLabel: string;
  onSaleLabel: string;
}) {
  const chips: { key: string; label: string; href: string }[] = [];
  if (query.category) {
    const name = categories.find((c) => c.slug === query.category)?.name ?? query.category;
    chips.push({
      key: "category",
      label: name,
      href: buildCatalogHref(basePath, query, { category: undefined }),
    });
  }
  if (query.fandom) {
    const name = fandoms.find((f) => f.slug === query.fandom)?.name ?? query.fandom;
    chips.push({
      key: "fandom",
      label: name,
      href: buildCatalogHref(basePath, query, { fandom: undefined }),
    });
  }
  if (query.brand) {
    const name = brands.find((b) => b.slug === query.brand)?.name ?? query.brand;
    chips.push({
      key: "brand",
      label: name,
      href: buildCatalogHref(basePath, query, { brand: undefined }),
    });
  }
  if (query.inStock) {
    chips.push({
      key: "stock",
      label: inStockLabel,
      href: buildCatalogHref(basePath, query, { inStock: undefined }),
    });
  }
  if (query.onSale) {
    chips.push({
      key: "sale",
      label: onSaleLabel,
      href: buildCatalogHref(basePath, query, { onSale: undefined }),
    });
  }
  if (query.q) {
    chips.push({
      key: "q",
      label: `«${query.q}»`,
      href: buildCatalogHref(basePath, query, { q: undefined }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/25"
        >
          <span className="truncate">{chip.label}</span>
          <X className="size-3.5 shrink-0 opacity-70" aria-hidden />
        </Link>
      ))}
      <Link
        href={basePath}
        className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
      >
        {clearLabel}
      </Link>
    </div>
  );
}

/** Horizontal visual category rail — primary UX for phones & tablets */
export async function CatalogCategoryRail({
  basePath,
  query,
  categories,
  allLabel,
}: {
  basePath: string;
  query: CatalogQuery;
  categories: FilterOption[];
  allLabel: string;
}) {
  const items = [
    { slug: "", name: allLabel, imageUrl: null as string | null },
    ...categories,
  ];

  return (
    <div className="-mx-4 mb-5 px-4 lg:mx-0 lg:px-0">
      <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible">
        {items.map((item) => {
          const active = item.slug
            ? query.category === item.slug
            : !query.category;
          const visual = categoryVisual(item.slug || "all");
          const Icon = visual.icon;
          const href = buildCatalogHref(basePath, query, {
            category: item.slug || undefined,
          });
          const image =
            item.imageUrl ||
            (item.slug ? categoryPlaceholder(item.slug, item.name) : null);

          return (
            <Link
              key={item.slug || "all"}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-w-[4.75rem] shrink-0 flex-col items-center gap-2 rounded-2xl px-1.5 py-1 transition",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "relative flex size-14 items-center justify-center overflow-hidden rounded-2xl border transition duration-300 sm:size-16",
                  active
                    ? "border-primary bg-primary/10 shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_22%,transparent)]"
                    : "border-border bg-surface shadow-[var(--shadow-card)] group-hover:border-primary/50 group-hover:scale-[1.03]",
                )}
              >
                {item.slug === "" ? (
                  <LayoutGridAll active={active} />
                ) : image ? (
                  <SoftImage
                    src={image}
                    fallback={categoryPlaceholder(item.slug, item.name)}
                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <Icon className={cn("size-6", active ? "text-primary" : "text-foreground/70")} />
                )}
                {active ? (
                  <span className="absolute right-1 bottom-1 flex size-5 items-center justify-center rounded-full bg-primary text-white shadow">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "max-w-[4.75rem] text-center text-[11px] leading-tight font-semibold sm:max-w-[5.5rem] sm:text-xs",
                  active && "text-primary",
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function LayoutGridAll({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "flex size-full items-center justify-center bg-gradient-to-br from-primary/25 via-surface to-primary/10",
        active && "from-primary/35",
      )}
    >
      <span className="text-display text-lg font-bold text-primary">D&A</span>
    </span>
  );
}

export async function CatalogFilters({
  basePath,
  query,
  categories,
  fandoms,
  brands,
  compact = false,
}: {
  basePath: string;
  query: CatalogQuery;
  categories: FilterOption[];
  fandoms: FilterOption[];
  brands: FilterOption[];
  /** Hide category grid when a rail is already shown above products */
  compact?: boolean;
}) {
  const t = await getTranslations("catalog");
  const hasActive = Boolean(
    query.category || query.fandom || query.brand || query.inStock || query.onSale || query.q,
  );

  return (
    <aside className="space-y-5 lg:sticky lg:top-28 lg:rounded-[1.35rem] lg:border lg:border-border lg:bg-surface lg:p-4 lg:shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-display text-lg font-semibold">{t("filters")}</p>
        {hasActive ? (
          <Link
            href={basePath}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t("resetFilters")}
          </Link>
        ) : null}
      </div>

      <ActiveChips
        basePath={basePath}
        query={query}
        categories={categories}
        fandoms={fandoms}
        brands={brands}
        clearLabel={t("resetFilters")}
        inStockLabel={t("inStockOnly")}
        onSaleLabel={t("onSale")}
      />

      {!compact ? (
        <section>
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {t("categories")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <CategoryTile
              href={buildCatalogHref(basePath, query, { category: undefined })}
              label={t("all")}
              active={!query.category}
              slug=""
            />
            {categories.map((category) => (
              <CategoryTile
                key={category.slug}
                href={buildCatalogHref(basePath, query, { category: category.slug })}
                label={category.name}
                active={query.category === category.slug}
                slug={category.slug}
                imageUrl={category.imageUrl}
              />
            ))}
          </div>
        </section>
      ) : null}

      <details className="group rounded-2xl border border-border bg-background/60 open:bg-surface" open={Boolean(query.fandom)}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-3 text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
          <span>{t("fandoms")}</span>
          <span className="text-muted-foreground transition group-open:rotate-180">▾</span>
        </summary>
        <div className="flex flex-wrap gap-2 px-3 pb-3.5">
          {fandoms.map((fandom) => {
            const active = query.fandom === fandom.slug;
            return (
              <Link
                key={fandom.slug}
                href={buildCatalogHref(basePath, query, {
                  fandom: active ? undefined : fandom.slug,
                })}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface hover:border-primary/60",
                )}
              >
                <span className="flex size-5 overflow-hidden rounded-full bg-surface-muted">
                  <SoftImage
                    src={
                      fandom.imageUrl ??
                      categoryPlaceholder(fandom.slug, fandom.name)
                    }
                    fallback={categoryPlaceholder(fandom.slug, fandom.name)}
                    className="size-full object-cover"
                  />
                </span>
                {fandom.name}
              </Link>
            );
          })}
        </div>
      </details>

      <details className="group rounded-2xl border border-border bg-background/60 open:bg-surface" open={Boolean(query.brand)}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-3 text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
          <span>{t("brands")}</span>
          <span className="text-muted-foreground transition group-open:rotate-180">▾</span>
        </summary>
        <ul className="space-y-1 px-2 pb-3">
          {brands.map((brand) => {
            const active = query.brand === brand.slug;
            return (
              <li key={brand.slug}>
                <Link
                  href={buildCatalogHref(basePath, query, {
                    brand: active ? undefined : brand.slug,
                  })}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition",
                    active
                      ? "bg-primary/10 font-semibold text-primary"
                      : "hover:bg-surface-muted",
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
                    {brand.logoUrl || brand.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={(brand.logoUrl ?? brand.imageUrl)!}
                        alt=""
                        className="size-full object-contain p-0.5"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-primary">
                        {brand.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 truncate">{brand.name}</span>
                  {active ? <Check className="ml-auto size-4 shrink-0" /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </details>

      <div className="grid gap-2">
        <ToggleLink
          href={buildCatalogHref(basePath, query, {
            inStock: !query.inStock ? true : undefined,
          })}
          active={Boolean(query.inStock)}
          label={t("inStockOnly")}
        />
        <ToggleLink
          href={buildCatalogHref(basePath, query, {
            onSale: !query.onSale ? true : undefined,
          })}
          active={Boolean(query.onSale)}
          label={t("onSale")}
        />
      </div>

      {hasActive ? (
        <Button href={basePath} variant="secondary" size="sm" className="w-full">
          {t("resetFilters")}
        </Button>
      ) : null}
    </aside>
  );
}

function CategoryTile({
  href,
  label,
  active,
  slug,
  imageUrl,
}: {
  href: string;
  label: string;
  active: boolean;
  slug: string;
  imageUrl?: string | null;
}) {
  const visual = categoryVisual(slug || "all");
  const Icon = visual.icon;
  const image = imageUrl || (slug ? categoryPlaceholder(slug, label) : null);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border text-left transition duration-300",
        active
          ? "border-primary bg-primary/10 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
          : "border-border bg-background/80 hover:border-primary/45 hover:bg-surface",
      )}
    >
      <span className="relative aspect-[5/3] overflow-hidden bg-surface-muted">
        {slug === "" ? (
          <span className="flex size-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/5">
            <span className="text-display text-base font-bold text-primary">All</span>
          </span>
        ) : image ? (
          <SoftImage
            src={image}
            fallback={categoryPlaceholder(slug, label)}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <Icon className="size-6 text-primary" />
          </span>
        )}
        {active ? (
          <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-white">
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "truncate px-2.5 py-2 text-xs font-semibold",
          active ? "text-primary" : "text-foreground",
        )}
      >
        {label}
      </span>
    </Link>
  );
}

function ToggleLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-sm font-semibold transition",
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-surface hover:border-primary/50",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          active ? "bg-white/25" : "bg-surface-muted",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition",
            active && "translate-x-5",
          )}
        />
      </span>
    </Link>
  );
}
