import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ContentPage } from "@/components/store/content-page";
import { getPrivacyContent } from "@/content/info-pages";
import { buildEntityMetadata } from "@/features/seo/service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages");
  return buildEntityMetadata({
    entityType: "page",
    entityId: "privacy",
    fallbackTitle: t("privacy"),
    fallbackDescription: t("privacy"),
    fallbackPath: "/privacy",
  });
}

export default async function PrivacyPage() {
  const t = await getTranslations("pages");
  const locale = await getLocale();
  return <ContentPage title={t("privacy")} content={getPrivacyContent(locale)} />;
}
