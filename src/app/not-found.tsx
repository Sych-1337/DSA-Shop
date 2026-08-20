import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";

import { NotFoundView } from "@/components/store/not-found-view";
import uk from "../../messages/uk.json";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <NextIntlClientProvider locale="uk" messages={uk}>
      <NotFoundView
        copy={{
          brand: uk.notFound.brand,
          code: uk.notFound.code,
          title: uk.notFound.title,
          body: uk.notFound.body,
          home: uk.notFound.home,
          catalog: uk.notFound.catalog,
          hint: uk.notFound.hint,
          support: uk.notFound.support,
        }}
      />
    </NextIntlClientProvider>
  );
}
