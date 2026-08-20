"use client";

import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { BackInStockForm } from "@/components/store/back-in-stock-form";
import { WishlistHeartButton } from "@/components/store/wishlist-heart-button";
import { addToCartAction } from "@/features/cart/actions";
import { useRouter } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type VariantView = {
  id: string;
  title: string;
  sku: string;
  priceAmount: number;
  compareAtPriceAmount: number | null;
  available: number;
};

type ImageView = {
  id: string;
  url: string;
  alt: string | null;
};

export function ProductPurchasePanel({
  title,
  productId,
  variants,
  images,
  wishlistActive = false,
  wishlistLists = [],
  defaultNotifyEmail = "",
}: {
  title: string;
  productId: string;
  variants: VariantView[];
  images: ImageView[];
  wishlistActive?: boolean;
  wishlistLists?: Array<{ id: string; name: string; isDefault: boolean }>;
  defaultNotifyEmail?: string;
}) {
  const t = useTranslations("product");
  const router = useRouter();
  const defaultVariant = variants[0];
  const [selectedId, setSelectedId] = useState(defaultVariant?.id);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(images[0]?.url);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) ?? defaultVariant,
    [variants, selectedId, defaultVariant],
  );

  if (!selected) {
    return <p className="text-muted-foreground">{t("noVariants")}</p>;
  }

  const onSale =
    selected.compareAtPriceAmount != null && selected.compareAtPriceAmount > selected.priceAmount;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <div className="aspect-square overflow-hidden rounded-[1.75rem] border border-border bg-surface-muted shadow-[var(--shadow-card)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage ?? "/api/placeholder?title=D%26A&hue=320"}
            alt={title}
            className="size-full object-cover"
          />
        </div>
        {images.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveImage(image.url)}
                className={cn(
                  "size-20 shrink-0 overflow-hidden rounded-xl border",
                  activeImage === image.url ? "border-primary" : "border-border",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.alt ?? title} className="size-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <div className="space-y-3">
          <p className="text-primary text-3xl font-bold">{formatMoney(selected.priceAmount)}</p>
          {onSale ? (
            <p className="text-muted-foreground line-through">
              {formatMoney(selected.compareAtPriceAmount!)}
            </p>
          ) : null}
          <p className={cn("text-sm font-medium", selected.available > 0 ? "text-success" : "text-danger")}>
            {selected.available > 0
              ? t("inStockCount", { count: selected.available })
              : t("outOfStock")}
          </p>
          <p className="text-muted-foreground text-sm">SKU: {selected.sku}</p>
        </div>

        {variants.length > 1 ? (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold">{t("variant")}</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedId(variant.id)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium",
                    selectedId === variant.id
                      ? "border-primary bg-primary text-white"
                      : "border-border hover:border-primary",
                    variant.available <= 0 && "opacity-50",
                  )}
                >
                  {variant.title}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="flex w-full items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 sm:w-auto sm:justify-start">
            <span className="text-sm text-muted-foreground">{t("qty")}</span>
            <input
              type="number"
              min={1}
              max={Math.max(1, selected.available)}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 bg-transparent text-sm outline-none"
            />
          </label>
          <Button
            size="lg"
            className="w-full sm:w-auto sm:flex-1 lg:flex-none"
            disabled={selected.available <= 0 || pending}
            onClick={() => {
              const formData = new FormData();
              formData.set("variantId", selected.id);
              formData.set("quantity", String(qty));
              startTransition(async () => {
                const result = await addToCartAction(formData);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setError(null);
                router.push("/cart");
                router.refresh();
              });
            }}
          >
            <ShoppingBag className="size-4" />
            {pending ? t("adding") : t("addToCart")}
          </Button>
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 sm:w-auto">
            <WishlistHeartButton
              productId={productId}
              initialActive={wishlistActive}
              lists={wishlistLists}
              size="sm"
            />
            <span className="text-sm font-semibold">{t("wishlist")}</span>
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        {selected.available <= 0 ? (
          <BackInStockForm
            key={selected.id}
            productId={productId}
            variantId={selected.id}
            defaultEmail={defaultNotifyEmail}
          />
        ) : null}
      </div>
    </div>
  );
}
