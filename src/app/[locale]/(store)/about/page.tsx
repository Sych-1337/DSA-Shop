import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ContentPage } from "@/components/store/content-page";
import { getAboutContent } from "@/content/info-pages";
import { buildEntityMetadata } from "@/features/seo/service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages");
  return buildEntityMetadata({
    entityType: "page",
    entityId: "about",
    fallbackTitle: t("about"),
    fallbackDescription: t("about"),
    fallbackPath: "/about",
  });
}

export default async function AboutPage() {
  const t = await getTranslations("pages");
  const locale = await getLocale();
  return <ContentPage title={t("about")} content={getAboutContent(locale)} />;
}
