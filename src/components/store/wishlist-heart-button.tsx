"use client";

import { Heart, ListPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { toggleWishlistProductAction } from "@/features/wishlist/actions";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type ListOption = { id: string; name: string; isDefault: boolean };

export function WishlistHeartButton({
  productId,
  initialActive = false,
  lists = [],
  className,
  size = "md",
}: {
  productId: string;
  initialActive?: boolean;
  lists?: ListOption[];
  className?: string;
  size?: "sm" | "md";
}) {
  const t = useTranslations("wishlist");
  const tProduct = useTranslations("product");
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function runToggle(listId?: string) {
    setMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("productId", productId);
      if (listId) formData.set("listId", listId);
      const result = await toggleWishlistProductAction(formData);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setActive(result.added);
      setOpen(false);
      router.refresh();
    });
  }

  const iconSize = size === "sm" ? "size-4" : "size-4";

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            runToggle();
          }}
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-surface/90 text-foreground shadow transition hover:text-primary disabled:opacity-60",
            size === "sm" ? "size-9" : "size-10",
            active && "text-primary",
          )}
          aria-label={tProduct("ariaWishlist")}
          aria-pressed={active}
        >
          <Heart className={cn(iconSize, active && "fill-current")} />
        </button>
        {lists.length > 1 ? (
          <button
            type="button"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen((value) => !value);
            }}
            className={cn(
              "inline-flex items-center justify-center rounded-full bg-surface/90 text-foreground shadow transition hover:text-primary disabled:opacity-60",
              size === "sm" ? "size-9" : "size-10",
            )}
            aria-label={t("chooseList")}
            aria-expanded={open}
          >
            <ListPlus className={iconSize} />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className="absolute top-full right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-surface p-2 shadow-[var(--shadow-card)]"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <p className="px-2 py-1 text-xs text-muted-foreground">{t("chooseList")}</p>
          <ul className="mt-1 max-h-56 space-y-0.5 overflow-y-auto">
            {lists.map((list) => (
              <li key={list.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => runToggle(list.id)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-muted"
                >
                  <span className="truncate">{list.name}</span>
                  {list.isDefault ? (
                    <span className="text-[10px] text-muted-foreground uppercase">{t("defaultBadge")}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {message ? (
        <p className="absolute top-full right-0 z-20 mt-2 w-48 rounded-lg border border-danger/30 bg-surface px-2 py-1 text-xs text-danger shadow">
          {message}
        </p>
      ) : null}
    </div>
  );
}
