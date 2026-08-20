import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ContentPage } from "@/components/store/content-page";
import { getOfferContent } from "@/content/info-pages";
import { buildEntityMetadata } from "@/features/seo/service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages");
  return buildEntityMetadata({
    entityType: "page",
    entityId: "public-offer",
    fallbackTitle: t("offer"),
    fallbackDescription: t("offer"),
    fallbackPath: "/public-offer",
  });
}

export default async function PublicOfferPage() {
  const t = await getTranslations("pages");
  const locale = await getLocale();
  return <ContentPage title={t("offer")} content={getOfferContent(locale)} />;
}
