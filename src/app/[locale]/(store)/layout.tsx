import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { SiteAnalytics } from "@/components/analytics/site-analytics";
import { StoreFooter } from "@/components/store/store-footer";
import { StoreHeader } from "@/components/store/store-header";
import { getCartSummary } from "@/features/cart/service";
import { storeDisplayName, storeTagline } from "@/lib/brand";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

async function getStoreChrome() {
  const [settings, tBrand] = await Promise.all([
    prisma.storeSetting.findMany({
      where: { key: { in: ["store.name", "store.tagline", "store.promoBar"] } },
    }),
    getTranslations("brand"),
  ]);

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const promo = map["store.promoBar"] as { text?: string; enabled?: boolean } | undefined;

  return {
    storeName: storeDisplayName(map["store.name"] as string | undefined),
    tagline: storeTagline(map["store.tagline"] as string | undefined) || tBrand("tagline"),
    promoText: promo?.enabled === false ? undefined : tBrand("promo"),
  };
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [chrome, cart, t] = await Promise.all([
    getStoreChrome(),
    getCartSummary(),
    getTranslations("nav"),
  ]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        {t("skipToContent")}
      </a>
      <StoreHeader
        storeName={chrome.storeName}
        tagline={chrome.tagline}
        promoText={chrome.promoText}
        cartCount={cart.itemCount}
        cartTotalLabel={formatMoney(cart.subtotalAmount)}
      />
      <div id="main" className="flex-1">
        {children}
      </div>
      <StoreFooter storeName={chrome.storeName} tagline={chrome.tagline} />
      <Suspense fallback={null}>
        <SiteAnalytics />
      </Suspense>
    </>
  );
}
