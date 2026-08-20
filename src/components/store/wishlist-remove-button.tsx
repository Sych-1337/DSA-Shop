"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { removeWishlistItemAction } from "@/features/wishlist/actions";
import { useRouter } from "@/i18n/navigation";

export function WishlistRemoveButton({ itemId }: { itemId: string }) {
  const t = useTranslations("wishlist");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const formData = new FormData();
        formData.set("itemId", itemId);
        startTransition(async () => {
          await removeWishlistItemAction(formData);
          router.refresh();
        });
      }}
      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium shadow hover:border-danger hover:text-danger disabled:opacity-60"
    >
      {t("remove")}
    </button>
  );
}
