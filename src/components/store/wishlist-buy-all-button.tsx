"use client";

import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { addWishlistToCartAction } from "@/features/wishlist/actions";
import { useRouter } from "@/i18n/navigation";

export function WishlistBuyAllButton({
  listId,
  disabled,
}: {
  listId: string;
  disabled?: boolean;
}) {
  const t = useTranslations("wishlist");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-6">
      <Button
        type="button"
        size="lg"
        disabled={disabled || pending}
        onClick={() => {
          setError(null);
          setMessage(null);
          const formData = new FormData();
          formData.set("listId", listId);
          startTransition(async () => {
            const result = await addWishlistToCartAction(formData);
            if (!result.ok) {
              setError(result.error ?? t("errorGeneric"));
              return;
            }
            setMessage(result.message);
            if (result.added > 0) {
              router.push("/cart");
              router.refresh();
            }
          });
        }}
      >
        <ShoppingBag className="size-4" />
        {pending ? t("buyAllWorking") : t("buyAll")}
      </Button>
      {message ? <p className="mt-2 text-sm text-muted-foreground">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
