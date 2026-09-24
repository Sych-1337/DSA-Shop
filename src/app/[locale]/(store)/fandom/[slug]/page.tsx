import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { ProductCard } from "@/components/store/product-card";
import {
  isThinCatalogQuery,
  parseCatalogSearchParams,
} from "@/features/catalog/schema";
import { getFandomBySlug, listCatalogProducts } from "@/features/catalog/service";
import {
  buildEntityMetadata,
  collectionPageJsonLd,
} from "@/features/seo/service";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const fandom = await getFandomBySlug(slug);
  if (!fandom) return { title: "404", robots: { index: false, follow: false } };

  const query = parseCatalogSearchParams({
    ...(await searchParams),
    fandom: slug,
  });

  return buildEntityMetadata({
    entityType: "fandom",
    entityId: fandom.id,
    fallbackTitle: fandom.name,
    fallbackDescription: fandom.description,
    fallbackPath: `/fandom/${fandom.slug}`,
    fallbackImage: fandom.imageUrl,
    locale,
    forceNoindex: isThinCatalogQuery(query, { ignoreFandom: true }),
  });
}

export default async function FandomPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("catalog");
  const { locale, slug } = await params;
  const fandom = await getFandomBySlug(slug);
  if (!fandom) notFound();

  const query = parseCatalogSearchParams({
    ...(await searchParams),
    fandom: slug,
  });
  const result = await listCatalogProducts(query);
  const thin = isThinCatalogQuery(query, { ignoreFandom: true });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {!thin ? (
        <JsonLd
          id={`fandom-jsonld-${fandom.slug}`}
          data={collectionPageJsonLd({
            name: fandom.name,
            description: fandom.description,
            path: `/fandom/${fandom.slug}`,
            locale,
          })}
        />
      ) : null}
      <h1 className="text-display text-4xl font-semibold">{fandom.name}</h1>
      {fandom.description ? (
        <p className="mt-2 text-muted-foreground">{fandom.description}</p>
      ) : (
        <p className="mt-2 text-muted-foreground">{t("fandomProducts")}</p>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {result.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
