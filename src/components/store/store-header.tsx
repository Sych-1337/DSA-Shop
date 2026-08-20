import { getTranslations } from "next-intl/server";
import { Heart, Search, ShoppingBag, User } from "lucide-react";

import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { MobileNav } from "@/components/store/mobile-nav";
import { SearchSuggest } from "@/components/store/search-suggest";
import { Link } from "@/i18n/navigation";

type StoreHeaderProps = {
  storeName: string;
  tagline: string;
  promoText?: string;
  cartCount?: number;
  cartTotalLabel?: string;
};

export async function StoreHeader({
  storeName,
  tagline,
  promoText,
  cartCount = 0,
  cartTotalLabel = "0 ₴",
}: StoreHeaderProps) {
  const t = await getTranslations("nav");

  const NAV = [
    { href: "/", label: t("home") },
    { href: "/catalog", label: t("catalog") },
    { href: "/catalog?sort=newest", label: t("newArrivals") },
    { href: "/catalog?sort=popular", label: t("sale") },
    { href: "/blog", label: t("blog") },
    { href: "/contacts", label: t("contacts") },
  ] as const;

  return (
    <header className="sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
      {promoText ? (
        <div className="bg-chrome px-4 py-2 text-center text-xs font-medium tracking-wide text-chrome-foreground/90 sm:text-sm">
          <span className="text-primary">★</span> {promoText}{" "}
          <span className="text-primary">★</span>
        </div>
      ) : null}

      <div className="border-b border-white/10 bg-chrome text-chrome-foreground">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:gap-4 lg:gap-6 lg:py-4">
          <MobileNav
            items={[...NAV]}
            storeName={storeName}
            searchPlaceholder={t("searchPlaceholder")}
            searchLabel={t("searchAria")}
            accountLabel={t("account")}
            wishlistLabel={t("wishlist")}
            cartLabel={t("cart")}
          />

          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="text-display flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold tracking-tight text-white shadow-[var(--shadow-glow)] sm:size-11">
              D&A
            </span>
            <span className="min-w-0 max-[360px]:hidden">
              <span className="text-display block truncate text-lg font-semibold tracking-wide sm:text-2xl">
                {storeName}
              </span>
              <span className="hidden text-[10px] tracking-[0.14em] text-chrome-foreground/55 uppercase sm:block">
                {tagline}
              </span>
            </span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 xl:flex">
            {NAV.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="rounded-full px-3 py-2 text-sm font-medium text-chrome-foreground/80 transition hover:bg-white/10 hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <SearchSuggest
            className="relative hidden min-w-0 flex-1 md:block lg:max-w-md"
            placeholder={t("searchPlaceholder")}
            ariaLabel={t("searchAria")}
            submitLabel={t("searchSubmit")}
          />

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2 md:ml-0">
            <Link
              href="/search"
              className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10 hover:text-primary md:hidden"
              aria-label={t("searchAria")}
            >
              <Search className="size-5" />
            </Link>
            <LanguageSwitcher className="hidden sm:flex" />
            <ThemeToggle />
            <Link
              href="/account"
              className="hidden size-11 items-center justify-center rounded-full hover:bg-white/10 hover:text-primary sm:inline-flex"
              aria-label={t("account")}
            >
              <User className="size-5" />
            </Link>
            <Link
              href="/wishlist"
              className="hidden size-11 items-center justify-center rounded-full hover:bg-white/10 hover:text-primary sm:inline-flex"
              aria-label={t("wishlist")}
            >
              <Heart className="size-5" />
            </Link>
            <Link
              href="/cart"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-3 text-sm font-semibold text-white shadow-[var(--shadow-glow)] hover:bg-primary-hover sm:px-4"
              aria-label={t("cart")}
            >
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline">{cartTotalLabel}</span>
              {cartCount > 0 ? (
                <span className="rounded-full bg-white/20 px-1.5 text-xs">{cartCount}</span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
