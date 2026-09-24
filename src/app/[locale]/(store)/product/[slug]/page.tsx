import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { ProductPurchasePanel } from "@/components/store/product-purchase-panel";
import { ProductCard } from "@/components/store/product-card";
import { ProductInterestBeacon } from "@/components/store/product-interest-beacon";
import { ProductReviews } from "@/components/store/product-reviews";
import { getCustomerAccount } from "@/features/account/service";
import {
  AnalyticsEvents,
  productToAnalyticsItem,
} from "@/features/analytics/events";
import { trackEvent } from "@/features/analytics/service";
import { parseCustomSpecs } from "@/features/catalog/custom-specs";
import { getProductBySlug } from "@/features/catalog/service";
import { listRelatedRecommendations } from "@/features/recommendations/service";
import { listApprovedReviews } from "@/features/reviews/service";
import {
  breadcrumbJsonLd,
  buildEntityMetadata,
  productJsonLd,
} from "@/features/seo/service";
import {
  listWishlists,
  productInDefaultWishlist,
} from "@/features/wishlist/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("product");
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: t("fallbackTitle"), robots: { index: false, follow: false } };
  return buildEntityMetadata({
    entityType: "product",
    entityId: product.id,
    fallbackTitle: product.title,
    fallbackDescription: product.shortDescription,
    fallbackPath: `/product/${product.slug}`,
    fallbackImage: product.images[0]?.url,
    locale,
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const t = await getTranslations("product");
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const variants = product.variants.map((variant) => ({
    id: variant.id,
    title: variant.title,
    sku: variant.sku,
    priceAmount: variant.priceAmount,
    compareAtPriceAmount: variant.compareAtPriceAmount,
    available: variant.inventory.reduce((s, row) => s + Math.max(0, row.onHand - row.reserved), 0),
  }));

  const available = variants.reduce((s, v) => s + v.available, 0);
  const price = variants[0]?.priceAmount ?? 0;
  const customSpecs = parseCustomSpecs(product.customSpecs);
  const [wishlistLists, wishlistActive, reviews, account, related] = await Promise.all([
    listWishlists(),
    productInDefaultWishlist(product.id),
    listApprovedReviews(product.id),
    getCustomerAccount(),
    listRelatedRecommendations(product.id, 4),
  ]);

  await trackEvent({
    name: AnalyticsEvents.VIEW_ITEM,
    path: `/product/${product.slug}`,
    properties: {
      currency: "UAH",
      value: price / 100,
      items: [
        productToAnalyticsItem({
          id: product.id,
          title: product.title,
          priceAmount: price,
          brandName: product.brand?.name,
          categoryName: product.primaryCategory?.name,
          fandomName: product.fandom?.name,
          listId: "pdp",
          listName: "Product detail",
        }),
      ],
    },
  });

  const averageRating =
    product.averageRating != null ? Number(product.averageRating) : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <ProductInterestBeacon productId={product.id} />
      <JsonLd
        id={`product-jsonld-${product.slug}`}
        data={[
          breadcrumbJsonLd(
            [
              { name: t("home"), path: "/" },
              { name: t("catalog"), path: "/catalog" },
              ...(product.primaryCategory
                ? [
                    {
                      name: product.primaryCategory.name,
                      path: `/catalog/${product.primaryCategory.slug}`,
                    },
                  ]
                : []),
              { name: product.title, path: `/product/${product.slug}` },
            ],
            locale,
          ),
          productJsonLd({
            name: product.title,
            description: product.shortDescription,
            path: `/product/${product.slug}`,
            imageUrl: product.images[0]?.url,
            priceAmount: price,
            availability: available > 0 ? "InStock" : "OutOfStock",
            brandName: product.brand?.name,
            locale,
          }),
        ]}
      />

      <nav className="mb-6 flex flex-wrap gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          {t("home")}
        </Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-primary">
          {t("catalog")}
        </Link>
        {product.primaryCategory ? (
          <>
            <span>/</span>
            <Link
              href={`/catalog/${product.primaryCategory.slug}`}
              className="hover:text-primary"
            >
              {product.primaryCategory.name}
            </Link>
          </>
        ) : null}
        <span>/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="mb-4">
        {product.fandom ? (
          <Link href={`/fandom/${product.fandom.slug}`} className="text-sm font-semibold text-primary">
            {product.fandom.name}
          </Link>
        ) : null}
        <h1 className="text-display mt-1 text-3xl font-semibold sm:text-4xl">{product.title}</h1>
        {product.shortDescription ? (
          <p className="mt-2 max-w-2xl text-muted-foreground">{product.shortDescription}</p>
        ) : null}
      </div>

      <ProductPurchasePanel
        title={product.title}
        productId={product.id}
        variants={variants}
        images={product.images.map((image) => ({
          id: image.id,
          url: image.url,
          alt: image.alt,
        }))}
        wishlistActive={wishlistActive}
        wishlistLists={wishlistLists}
        defaultNotifyEmail={
          account.sessionUser?.email ?? account.profile?.contactEmail ?? ""
        }
      />

      <section className="mt-12 grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-display text-2xl font-semibold">{t("description")}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {product.description ?? t("descriptionSoon")}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-display text-2xl font-semibold">{t("specs")}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <dt className="text-muted-foreground">{t("type")}</dt>
              <dd>{product.productType ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <dt className="text-muted-foreground">{t("authenticity")}</dt>
              <dd>{product.authenticityType}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <dt className="text-muted-foreground">{t("brand")}</dt>
              <dd>{product.brand?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <dt className="text-muted-foreground">{t("category")}</dt>
              <dd>{product.primaryCategory?.name ?? "—"}</dd>
            </div>
            {product.fandom ? (
              <div className="flex justify-between gap-4 border-b border-border py-2">
                <dt className="text-muted-foreground">{t("fandom")}</dt>
                <dd className="text-primary">{product.fandom.name}</dd>
              </div>
            ) : null}
            {customSpecs.map((row) => (
              <div
                key={`${row.label}-${row.value}`}
                className="flex justify-between gap-4 border-b border-border py-2"
              >
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <ProductReviews
        productId={product.id}
        productSlug={product.slug}
        averageRating={averageRating}
        reviewCount={product.reviewCount}
        reviews={reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          title: review.title,
          body: review.body,
          authorName: review.authorName,
          createdAt: review.createdAt.toISOString(),
        }))}
        defaultName={
          [account.profile?.firstName, account.profile?.lastName].filter(Boolean).join(" ") ||
          account.sessionUser?.name ||
          undefined
        }
        defaultEmail={
          account.sessionUser?.email ?? account.profile?.contactEmail ?? undefined
        }
      />

      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-display mb-4 text-3xl font-semibold">{t("related")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
