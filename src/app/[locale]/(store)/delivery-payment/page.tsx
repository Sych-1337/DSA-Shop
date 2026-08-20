import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ContentPage } from "@/components/store/content-page";
import { getDeliveryContent } from "@/content/info-pages";
import { buildEntityMetadata } from "@/features/seo/service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages");
  return buildEntityMetadata({
    entityType: "page",
    entityId: "delivery-payment",
    fallbackTitle: t("delivery"),
    fallbackDescription: t("delivery"),
    fallbackPath: "/delivery-payment",
  });
}

export default async function DeliveryPaymentPage() {
  const t = await getTranslations("pages");
  const locale = await getLocale();
  return <ContentPage title={t("delivery")} content={getDeliveryContent(locale)} />;
}
