import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { ProductCard } from "@/components/store/product-card";
import { getCollectionBySlug } from "@/features/catalog/service";
import { ProductStatus } from "@/generated/prisma";
import {
  buildEntityMetadata,
  collectionPageJsonLd,
} from "@/features/seo/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "404", robots: { index: false, follow: false } };
  return buildEntityMetadata({
    entityType: "collection",
    entityId: collection.id,
    fallbackTitle: collection.name,
    fallbackDescription: collection.description,
    fallbackPath: `/collection/${collection.slug}`,
    fallbackImage: collection.imageUrl,
    locale,
  });
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const products = collection.products
    .map((row) => row.product)
    .filter((product) => product.status === ProductStatus.PUBLISHED);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <JsonLd
        id={`collection-jsonld-${collection.slug}`}
        data={collectionPageJsonLd({
          name: collection.name,
          description: collection.description,
          path: `/collection/${collection.slug}`,
          locale,
        })}
      />
      <h1 className="text-display text-4xl font-semibold">{collection.name}</h1>
      {collection.description ? (
        <p className="mt-2 text-muted-foreground">{collection.description}</p>
      ) : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
