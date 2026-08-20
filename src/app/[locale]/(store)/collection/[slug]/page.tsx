import { notFound } from "next/navigation";

import { ProductCard } from "@/components/store/product-card";
import { getCollectionBySlug } from "@/features/catalog/service";
import { ProductStatus } from "@/generated/prisma";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const products = collection.products
    .map((row) => row.product)
    .filter((product) => product.status === ProductStatus.PUBLISHED);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
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
