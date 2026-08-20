"use client";

import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { addToCartAction } from "@/features/cart/actions";

export function ProductCardCartButton({
  variantId,
  disabled,
}: {
  variantId: string | null;
  disabled?: boolean;
}) {
  const t = useTranslations("product");
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={!variantId || disabled || pending}
      onClick={() => {
        if (!variantId) return;
        startTransition(async () => {
          await addToCartAction(
            (() => {
              const data = new FormData();
              data.set("variantId", variantId);
              data.set("quantity", "1");
              return data;
            })(),
          );
        });
      }}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[var(--shadow-glow)] hover:bg-primary-hover disabled:opacity-50"
      aria-label={t("ariaAddToCart")}
    >
      <ShoppingBag className="size-4" />
    </button>
  );
}
