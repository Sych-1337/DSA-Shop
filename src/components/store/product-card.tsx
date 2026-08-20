import { getTranslations } from "next-intl/server";

import { ProductCardCartButton } from "@/components/store/product-card-cart-button";
import { WishlistHeartButton } from "@/components/store/wishlist-heart-button";
import type { ProductCardRecord } from "@/features/catalog/service";
import { availableStock } from "@/features/catalog/service";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type WishlistListOption = { id: string; name: string; isDefault: boolean };

export async function ProductCard({
  product,
  wishlistActive = false,
  lists = [],
}: {
  product: ProductCardRecord;
  wishlistActive?: boolean;
  lists?: WishlistListOption[];
}) {
  const t = await getTranslations("product");
  const image = product.images[0];
  const stock = availableStock(product);
  const defaultVariant =
    product.variants.find((variant) => {
      const available = variant.inventory.reduce(
        (sum, row) => sum + Math.max(0, row.onHand - row.reserved),
        0,
      );
      return available > 0;
    }) ?? product.variants[0];
  const onSale =
    product.compareAtPriceAmount != null && product.compareAtPriceAmount > product.priceAmount;
  const discountPct = onSale
    ? Math.round(
        ((product.compareAtPriceAmount! - product.priceAmount) / product.compareAtPriceAmount!) * 100,
      )
    : 0;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition hover:border-primary/40 dark:hover:shadow-[var(--shadow-glow)]">
      <div className="relative aspect-square overflow-hidden bg-surface-muted">
        <Link href={`/product/${product.slug}`} className="absolute inset-0 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image?.url ?? "/api/placeholder?title=D%26A&hue=320"}
            alt={image?.alt ?? product.title}
            className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col gap-1">
          {product.isFeatured ? (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white">
              {t("badgeHit")}
            </span>
          ) : null}
          {onSale ? (
            <span className="rounded-full bg-chrome/90 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              -{discountPct}%
            </span>
          ) : null}
          {product.isNew ? (
            <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-background uppercase">
              {t("badgeNew")}
            </span>
          ) : null}
        </div>
        <div className="absolute top-3 right-3 z-10 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
          <WishlistHeartButton
            productId={product.id}
            initialActive={wishlistActive}
            lists={lists}
          />
        </div>
        <div className="absolute right-3 bottom-3 z-10">
          <ProductCardCartButton
            variantId={stock > 0 ? (defaultVariant?.id ?? null) : null}
            disabled={stock <= 0}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col space-y-2 p-4">
        <div className="min-w-0">
          {product.fandom ? (
            <p className="text-muted-foreground truncate text-xs">{product.fandom.name}</p>
          ) : null}
          <Link
            href={`/product/${product.slug}`}
            className="line-clamp-2 font-semibold hover:text-primary"
          >
            {product.title}
          </Link>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            <p className="text-primary text-lg font-bold">{formatMoney(product.priceAmount)}</p>
            {onSale ? (
              <p className="text-muted-foreground text-xs line-through">
                {formatMoney(product.compareAtPriceAmount!)}
              </p>
            ) : null}
          </div>
          <p className={cn("text-xs", stock > 0 ? "text-success" : "text-danger")}>
            {stock > 0 ? t("inStock") : t("outOfStockShort")}
          </p>
        </div>
      </div>
    </article>
  );
}
