import { AdminProductForm } from "@/components/admin/product-form";
import {
  listActiveBrands,
  listActiveCategories,
  listActiveFandoms,
} from "@/features/catalog/service";

export default async function NewProductPage() {
  const [categories, fandoms, brands] = await Promise.all([
    listActiveCategories(),
    listActiveFandoms(),
    listActiveBrands(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-2xl font-semibold sm:text-3xl">Новий товар</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Редагуйте прямо на сторінці товару — так вона виглядатиме на сайті. Можна додати свою
          категорію, фендом або бренд.
        </p>
      </div>
      <AdminProductForm
        categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
        fandoms={fandoms.map((f) => ({ id: f.id, name: f.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
