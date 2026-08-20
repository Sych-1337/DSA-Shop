"use client";

import { Menu, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Link } from "@/i18n/navigation";

type NavItem = { href: string; label: string };

export function MobileNav({
  items,
  storeName,
  searchPlaceholder,
  searchLabel,
  accountLabel,
  wishlistLabel,
  cartLabel,
}: {
  items: NavItem[];
  storeName: string;
  searchPlaceholder: string;
  searchLabel: string;
  accountLabel: string;
  wishlistLabel: string;
  cartLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations("nav");

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10"
        aria-expanded={open}
        aria-label={t("menu")}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-0 left-0 flex h-full w-[min(100%,20rem)] flex-col bg-chrome p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-chrome-foreground shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-display text-xl font-semibold">{storeName}</span>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10"
                aria-label={t("close")}
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mb-4">
              <LanguageSwitcher />
            </div>
            <nav className="flex flex-col gap-1 overflow-y-auto">
              {items.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="rounded-xl px-3 py-3 text-base font-medium hover:bg-white/10 hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/account"
                className="rounded-xl px-3 py-3 text-base font-medium hover:bg-white/10 hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {accountLabel}
              </Link>
              <Link
                href="/wishlist"
                className="rounded-xl px-3 py-3 text-base font-medium hover:bg-white/10 hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {wishlistLabel}
              </Link>
              <Link
                href="/cart"
                className="rounded-xl px-3 py-3 text-base font-medium hover:bg-white/10 hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {cartLabel}
              </Link>
            </nav>
            <form action={`/${locale}/search`} className="mt-auto pt-6" onSubmit={() => setOpen(false)}>
              <label htmlFor="mobile-search" className="sr-only">
                {searchLabel}
              </label>
              <div className="relative">
                <input
                  id="mobile-search"
                  name="q"
                  placeholder={searchPlaceholder}
                  className="h-11 w-full rounded-full border border-white/10 bg-white/5 px-4 pr-11 text-sm"
                />
                <button
                  type="submit"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-2 text-primary"
                  aria-label={t("searchSubmit")}
                >
                  <Search className="size-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
