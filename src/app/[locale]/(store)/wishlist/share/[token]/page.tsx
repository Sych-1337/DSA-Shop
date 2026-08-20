import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { getPublicWishlist } from "@/features/wishlist/service";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("wishlist");
  const { token } = await params;
  const view = await getPublicWishlist(token);
  if (!view) return { title: t("shareNotFound"), robots: { index: false, follow: false } };
  return {
    title: t("shareTitle", { name: view.name }),
    description: t("shareLead"),
    robots: { index: false, follow: false },
  };
}

export default async function SharedWishlistPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const t = await getTranslations("wishlist");
  const { token } = await params;
  const view = await getPublicWishlist(token);
  if (!view) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
      <p className="text-sm font-semibold tracking-wide text-primary uppercase">{t("shareBadge")}</p>
      <h1 className="text-display mt-2 text-3xl font-semibold sm:text-4xl">
        {t("shareTitle", { name: view.name })}
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground sm:text-lg">{t("shareLead")}</p>

      {view.products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center sm:p-12">
          <p className="font-semibold">{t("shareEmpty")}</p>
          <Button href="/catalog" className="mt-6">
            {t("toCatalog")}
          </Button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {view.products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        <Link href="/wishlist" className="hover:text-primary">
          {t("shareOwn")}
        </Link>
        {" · "}
        <Link href="/" className="hover:text-primary">
          {t("home")}
        </Link>
      </p>
    </main>
  );
}
