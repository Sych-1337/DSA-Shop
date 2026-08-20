import { getLocale, getTranslations } from "next-intl/server";
import { Gift, Headphones, Package, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BlogCard, type BlogCardPost } from "@/components/store/blog-card";
import { HeroBannerCarousel } from "@/components/store/hero-banner-carousel";
import { ProductCard } from "@/components/store/product-card";
import type { ProductCardRecord } from "@/features/catalog/service";
import {
  parseBlockConfig,
  type CtaBannerConfig,
  type HeroConfig,
  type HomepageBlock,
  type ProductGridConfig,
} from "@/features/content/service";
import { HomepageBlockType } from "@/generated/prisma";
import { Link } from "@/i18n/navigation";

const BENEFIT_ICONS = {
  package: Package,
  gift: Gift,
  shield: ShieldCheck,
  headphones: Headphones,
} as const;

type CategoryLink = { href: string; label: string; imageUrl?: string | null };

async function HeroBlock({
  block,
  storeName,
  tagline,
}: {
  block: HomepageBlock;
  storeName: string;
  tagline: string;
}) {
  const t = await getTranslations("home");
  const tBrand = await getTranslations("brand");
  const config = parseBlockConfig<HeroConfig>(block);
  const brand = storeName;
  const expansion = tagline || tBrand("tagline");
  const headline = t("headline");
  const support = tBrand("support");
  const slides =
    config.slides?.filter((s) => s.imageUrl).length
      ? config.slides.filter((s) => s.imageUrl)
      : config.imageUrl
        ? [{ imageUrl: config.imageUrl, imageAlt: config.imageAlt }]
        : [{ imageUrl: "/banners/hero-01-neko.png", imageAlt: brand }];

  return (
    <section className="relative min-h-[min(92dvh,820px)] overflow-hidden border-b border-border">
      <HeroBannerCarousel slides={slides} autoplayMs={config.autoplayMs ?? 6500} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-chrome/95 via-chrome/80 to-chrome/35 dark:from-chrome/95 dark:via-chrome/85 dark:to-chrome/40" />
      <div className="manga-texture pointer-events-none absolute inset-0 opacity-30" />

      <div className="relative z-10 mx-auto flex min-h-[min(92dvh,820px)] max-w-7xl flex-col justify-end px-4 pb-24 pt-28 sm:pb-20 lg:justify-center lg:pb-24">
        <p className="text-display text-4xl font-semibold tracking-tight text-chrome-foreground sm:text-6xl lg:text-7xl">
          {brand}
        </p>
        {expansion ? (
          <p className="mt-2 text-sm font-semibold tracking-[0.22em] text-primary uppercase sm:text-base">
            {expansion}
          </p>
        ) : null}
        <h1 className="mt-5 max-w-xl text-2xl font-semibold text-chrome-foreground/95 sm:text-3xl">
          {headline}
        </h1>
        <p className="mt-3 max-w-md text-base text-chrome-foreground/70 sm:text-lg">{support}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={config.primaryCtaHref || "/catalog"} size="lg">
            {t("ctaCatalog")}
          </Button>
          {config.secondaryCtaHref ? (
            <Button href={config.secondaryCtaHref} variant="secondary" size="lg">
              {t("ctaPicks")}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CategoryStrip({ categories }: { categories: CategoryLink[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-8 lg:overflow-visible lg:pb-0">
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="flex min-w-[5.5rem] flex-col items-center gap-3 text-center"
          >
            <span className="flex size-16 items-center justify-center overflow-hidden rounded-full border border-border bg-surface shadow-[var(--shadow-card)] transition hover:border-primary">
              {category.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={category.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-primary">★</span>
              )}
            </span>
            <span className="text-sm font-medium">{category.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function BenefitsBlock() {
  const t = await getTranslations("home");
  const items = [
    { title: t("benefitDelivery"), text: t("benefitDeliveryText"), icon: "package" as const },
    { title: t("benefitGift"), text: t("benefitGiftText"), icon: "gift" as const },
    { title: t("benefitOriginal"), text: t("benefitOriginalText"), icon: "shield" as const },
    { title: t("benefitSupport"), text: t("benefitSupportText"), icon: "headphones" as const },
  ];

  return (
    <section className="border-y border-border bg-surface py-8">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((benefit) => {
          const Icon = BENEFIT_ICONS[benefit.icon] ?? Package;
          return (
            <div key={benefit.title} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-6 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">{benefit.title}</p>
                <p className="text-sm text-muted-foreground">{benefit.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

async function ProductCarouselBlock({
  block,
  products,
  variant,
  personalized,
}: {
  block: HomepageBlock;
  products: ProductCardRecord[];
  variant: "featured" | "newest" | "forYou" | "recent";
  personalized?: boolean;
}) {
  const t = await getTranslations("home");
  const config = parseBlockConfig<ProductGridConfig>(block);
  const copy =
    variant === "featured"
      ? { title: t("featuredTitle"), subtitle: t("featuredSubtitle"), link: t("featuredAll") }
      : variant === "newest"
        ? { title: t("newestTitle"), subtitle: t("newestSubtitle"), link: t("newestAll") }
        : variant === "recent"
          ? { title: t("recentTitle"), subtitle: t("recentSubtitle"), link: t("recentAll") }
          : {
              title: t("forYouTitle"),
              subtitle: personalized ? t("forYouSubtitlePersonalized") : t("forYouSubtitle"),
              link: t("forYouAll"),
            };

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-display text-3xl font-semibold">{copy.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
        {config.linkHref ? (
          <Button href={config.linkHref} variant="outline" size="sm" className="shrink-0 rounded-full">
            {config.linkLabel || copy.link}
          </Button>
        ) : null}
      </div>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scroll-px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[min(78vw,18rem)] shrink-0 snap-start sm:w-auto sm:min-w-0"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}

async function CtaBannerBlock({ block }: { block: HomepageBlock }) {
  const t = await getTranslations("home");
  const config = parseBlockConfig<CtaBannerConfig>(block);
  if (!config.href) return null;
  // Blog teaser section replaces the legacy /blog CTA banner.
  if (config.href === "/blog") return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16">
      <div className="flex flex-col items-start justify-between gap-4 border border-border bg-surface-muted px-6 py-8 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-display text-2xl font-semibold">{block.title || t("blogCtaTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {block.subtitle || t("blogCtaSubtitle")}
          </p>
        </div>
        <Button href={config.href} variant={config.tone === "secondary" ? "secondary" : "primary"}>
          {config.label || t("blogCtaButton")}
        </Button>
      </div>
    </section>
  );
}

async function BlogTeaserSection({ posts }: { posts: BlogCardPost[] }) {
  const t = await getTranslations("home");
  const locale = await getLocale();
  if (posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-4">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-display text-2xl font-semibold sm:text-3xl">{t("blogTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">{t("blogSubtitle")}</p>
        </div>
        <Button href="/blog" variant="outline">
          {t("blogAll")}
        </Button>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
        {posts.map((post) => (
          <li key={post.slug}>
            <BlogCard post={post} locale={locale} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function HomePage({
  storeName,
  tagline,
  blocks,
  categories,
  featured,
  newest,
  forYou,
  forYouPersonalized,
  recentlyViewed,
  blogPosts = [],
}: {
  storeName: string;
  tagline: string;
  blocks: HomepageBlock[];
  categories: CategoryLink[];
  featured: ProductCardRecord[];
  newest: ProductCardRecord[];
  forYou: ProductCardRecord[];
  forYouPersonalized: boolean;
  recentlyViewed: ProductCardRecord[];
  blogPosts?: BlogCardPost[];
}) {
  const hasForYouBlock = blocks.some(
    (block) => block.type === HomepageBlockType.PRODUCT_GRID_FOR_YOU,
  );

  return (
    <main>
      {blocks.map((block) => {
        switch (block.type) {
          case HomepageBlockType.HERO:
            return (
              <HeroBlock
                key={block.id}
                block={block}
                storeName={storeName}
                tagline={tagline}
              />
            );
          case HomepageBlockType.CATEGORY_STRIP:
            return <CategoryStrip key={block.id} categories={categories} />;
          case HomepageBlockType.BENEFITS:
            return <BenefitsBlock key={block.id} />;
          case HomepageBlockType.PRODUCT_GRID_FEATURED:
            return (
              <ProductCarouselBlock
                key={block.id}
                block={block}
                products={featured}
                variant="featured"
              />
            );
          case HomepageBlockType.PRODUCT_GRID_FOR_YOU:
            return (
              <ProductCarouselBlock
                key={block.id}
                block={block}
                products={forYou}
                variant="forYou"
                personalized={forYouPersonalized}
              />
            );
          case HomepageBlockType.PRODUCT_GRID_NEW:
            return (
              <ProductCarouselBlock
                key={block.id}
                block={block}
                products={newest}
                variant="newest"
              />
            );
          case HomepageBlockType.CTA_BANNER:
            return <CtaBannerBlock key={block.id} block={block} />;
          default:
            return null;
        }
      })}
      {!hasForYouBlock && forYou.length > 0 ? (
        <ProductCarouselBlock
          block={{
            id: "for-you-fallback",
            key: "for-you",
            type: HomepageBlockType.PRODUCT_GRID_FOR_YOU,
            title: null,
            subtitle: null,
            sortOrder: 45,
            isEnabled: true,
            config: { limit: 4, linkHref: "/catalog", linkLabel: "Каталог" },
            createdAt: new Date(),
            updatedAt: new Date(),
          }}
          products={forYou}
          variant="forYou"
          personalized={forYouPersonalized}
        />
      ) : null}
      {recentlyViewed.length > 0 ? (
        <ProductCarouselBlock
          block={{
            id: "recent-fallback",
            key: "recent",
            type: HomepageBlockType.PRODUCT_GRID_NEW,
            title: null,
            subtitle: null,
            sortOrder: 55,
            isEnabled: true,
            config: { limit: 4, linkHref: "/catalog", linkLabel: "Каталог" },
            createdAt: new Date(),
            updatedAt: new Date(),
          }}
          products={recentlyViewed}
          variant="recent"
        />
      ) : null}
      <BlogTeaserSection posts={blogPosts} />
    </main>
  );
}
