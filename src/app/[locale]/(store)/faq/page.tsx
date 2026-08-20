import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { FaqList } from "@/components/store/faq-list";
import { getFaqItems } from "@/content/info-pages";
import { buildEntityMetadata } from "@/features/seo/service";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages");
  const tFaq = await getTranslations("faq");
  return buildEntityMetadata({
    entityType: "page",
    entityId: "faq",
    fallbackTitle: t("faq"),
    fallbackDescription: tFaq("lead"),
    fallbackPath: "/faq",
  });
}

export default async function FaqPage() {
  const t = await getTranslations("pages");
  const tFaq = await getTranslations("faq");
  const locale = await getLocale();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <h1 className="text-display text-3xl font-semibold sm:text-4xl">{t("faq")}</h1>
      <p className="mt-3 text-muted-foreground sm:text-lg">{tFaq("lead")}</p>
      <FaqList items={getFaqItems(locale)} />
      <p className="mt-8 text-sm text-muted-foreground">
        {tFaq("moreHelp")}{" "}
        <Link href="/contacts" className="font-semibold text-primary hover:underline">
          {tFaq("contactsLink")}
        </Link>
      </p>
    </main>
  );
}
