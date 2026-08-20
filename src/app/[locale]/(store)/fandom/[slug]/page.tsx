import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/store/product-card";
import { parseCatalogSearchParams } from "@/features/catalog/schema";
import { getFandomBySlug, listCatalogProducts } from "@/features/catalog/service";

export default async function FandomPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("catalog");
  const { slug } = await params;
  const fandom = await getFandomBySlug(slug);
  if (!fandom) notFound();

  const query = parseCatalogSearchParams({
    ...(await searchParams),
    fandom: slug,
  });
  const result = await listCatalogProducts(query);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
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
