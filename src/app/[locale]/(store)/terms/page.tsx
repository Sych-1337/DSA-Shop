import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ContentPage } from "@/components/store/content-page";
import { getTermsContent } from "@/content/info-pages";
import { buildEntityMetadata } from "@/features/seo/service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages");
  return buildEntityMetadata({
    entityType: "page",
    entityId: "terms",
    fallbackTitle: t("terms"),
    fallbackDescription: t("terms"),
    fallbackPath: "/terms",
  });
}

export default async function TermsPage() {
  const t = await getTranslations("pages");
  const locale = await getLocale();
  return <ContentPage title={t("terms")} content={getTermsContent(locale)} />;
}
