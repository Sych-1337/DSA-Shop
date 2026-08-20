import { getTranslations } from "next-intl/server";

import { NotFoundView } from "@/components/store/not-found-view";

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");

  return (
    <NotFoundView
      copy={{
        brand: t("brand"),
        code: t("code"),
        title: t("title"),
        body: t("body"),
        home: t("home"),
        catalog: t("catalog"),
        hint: t("hint"),
        support: t("support"),
      }}
    />
  );
}
