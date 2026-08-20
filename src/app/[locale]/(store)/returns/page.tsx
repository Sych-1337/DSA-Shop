import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ContentPage } from "@/components/store/content-page";
import { ReturnRequestForm } from "@/components/store/return-request-form";
import { getReturnsContent } from "@/content/info-pages";
import { buildEntityMetadata } from "@/features/seo/service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages");
  return buildEntityMetadata({
    entityType: "page",
    entityId: "returns",
    fallbackTitle: t("returns"),
    fallbackDescription: t("returns"),
    fallbackPath: "/returns",
  });
}

export default async function ReturnsPage() {
  const t = await getTranslations("pages");
  const locale = await getLocale();
  return (
    <>
      <ContentPage title={t("returns")} content={getReturnsContent(locale)} />
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <ReturnRequestForm />
      </div>
    </>
  );
}
