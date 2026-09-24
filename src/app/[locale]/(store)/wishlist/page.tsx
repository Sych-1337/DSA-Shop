import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { WishlistBuyAllButton } from "@/components/store/wishlist-buy-all-button";
import { WishlistListsManager } from "@/components/store/wishlist-lists-manager";
import { WishlistRemoveButton } from "@/components/store/wishlist-remove-button";
import { buildEntityMetadata } from "@/features/seo/service";
import { getWishlistView } from "@/features/wishlist/service";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages");
  const tWish = await getTranslations("wishlist");
  return buildEntityMetadata({
    entityType: "page",
    entityId: "wishlist",
    fallbackTitle: t("wishlist"),
    fallbackDescription: tWish("lead"),
    fallbackPath: "/wishlist",
    forceNoindex: true,
  });
}

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: Promise<{ list?: string }>;
}) {
  const t = await getTranslations("pages");
  const tWish = await getTranslations("wishlist");
  const { list: listId } = await searchParams;
  const view = await getWishlistView(listId);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
      <h1 className="text-display text-3xl font-semibold sm:text-4xl">{t("wishlist")}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground sm:text-lg">{tWish("lead")}</p>

      <WishlistListsManager
        key={view.activeList?.id ?? "none"}
        lists={view.lists}
        activeList={view.activeList}
      />

      {view.products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center sm:p-12">
          <p className="font-semibold">{tWish("empty")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{tWish("emptyHint")}</p>
          <Button href="/catalog" className="mt-6">
            {tWish("toCatalog")}
          </Button>
        </div>
      ) : (
        <>
          {view.activeList ? (
            <WishlistBuyAllButton listId={view.activeList.id} />
          ) : null}
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {view.products.map((product) => (
              <li key={product.wishlistItemId} className="relative">
                <ProductCard
                  product={product}
                  wishlistActive
                  lists={view.lists}
                />
                <div className="absolute right-3 bottom-3 z-10">
                  <WishlistRemoveButton itemId={product.wishlistItemId} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        <Link href="/account" className="hover:text-primary">
          {tWish("toAccount")}
        </Link>
        {" · "}
        <Link href="/" className="hover:text-primary">
          {tWish("home")}
        </Link>
      </p>
    </main>
  );
}
