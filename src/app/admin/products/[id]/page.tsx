import { notFound } from "next/navigation";

import { AdminProductForm } from "@/components/admin/product-form";
import { parseCustomSpecs } from "@/features/catalog/custom-specs";
import {
  getAdminProductById,
  listActiveBrands,
  listActiveCategories,
  listActiveFandoms,
} from "@/features/catalog/service";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, fandoms, brands] = await Promise.all([
    getAdminProductById(id),
    listActiveCategories(),
    listActiveFandoms(),
    listActiveBrands(),
  ]);

  if (!product) notFound();

  const variant = product.variants.find((item) => item.isActive) ?? product.variants[0];
  const stock =
    product.variants.reduce(
      (sum, item) =>
        sum + (item.isActive ? item.inventory.reduce((s, row) => s + row.onHand, 0) : 0),
      0,
    ) ||
    variant?.inventory.reduce((sum, row) => sum + row.onHand, 0) ||
    0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-2xl font-semibold sm:text-3xl">Сторінка товару</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Клікайте по полях і редагуйте одразу на макеті вітрини. Нову категорію, фендом чи бренд
          можна створити з тих самих списків. Для одягу — розміри та залишки.
        </p>
      </div>
      <AdminProductForm
        product={{
          id: product.id,
          title: product.title,
          slug: product.slug,
          shortDescription: product.shortDescription,
          description: product.description,
          status: product.status,
          primaryCategoryId: product.primaryCategoryId,
          fandomId: product.fandomId,
          brandId: product.brandId,
          priceAmount: product.priceAmount,
          compareAtPriceAmount: product.compareAtPriceAmount,
          isFeatured: product.isFeatured,
          isNew: product.isNew,
          sku: variant?.sku ?? "",
          stock,
          imageUrl: product.images[0]?.url ?? null,
          imageUrls: product.images.map((image) => image.url),
          customSpecs: parseCustomSpecs(product.customSpecs),
          sizeVariants: product.variants.map((item) => ({
            title: item.title,
            sku: item.sku,
            stock: item.inventory.reduce((sum, row) => sum + row.onHand, 0),
            isActive: item.isActive,
          })),
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
        fandoms={fandoms.map((f) => ({ id: f.id, name: f.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
