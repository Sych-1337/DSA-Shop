"use client";

import { Heart, Plus, ShoppingBag, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  CreatableTaxonomyField,
  type TaxonomyValue,
} from "@/components/admin/creatable-taxonomy-field";
import { ImagePickerField } from "@/components/admin/image-picker-dialog";
import { Button } from "@/components/ui/button";
import { upsertAdminProduct } from "@/features/catalog/admin-actions";
import {
  baseSkuFromVariantSku,
  CLOTHING_SIZES,
  isClothingCategory,
  isClothingSize,
  type ClothingSize,
} from "@/features/catalog/clothing-sizes";
import {
  MAX_CUSTOM_SPECS,
  type CustomSpecRow,
} from "@/features/catalog/custom-specs";
import { MAX_PRODUCT_IMAGES } from "@/features/media/constants";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string; slug?: string };

type SizeRowState = { enabled: boolean; stock: string };

type SizeVariantSeed = {
  title: string;
  sku: string;
  stock: number;
  isActive: boolean;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9а-яіїєґ]+/gi, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function kopiykyToUah(value: number) {
  return (value / 100).toFixed(value % 100 === 0 ? 0 : 2);
}

function uahToKopiyky(value: string) {
  const n = Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function initTaxonomy(
  id: string | null | undefined,
  options: Option[],
): TaxonomyValue {
  if (!id) return { mode: "none" };
  const match = options.find((item) => item.id === id);
  if (!match) return { mode: "none" };
  return { mode: "existing", id: match.id, name: match.name };
}

function taxonomyDisplay(value: TaxonomyValue) {
  return value.mode === "none" ? "" : value.name;
}

function emptySizeState(): Record<ClothingSize, SizeRowState> {
  return Object.fromEntries(
    CLOTHING_SIZES.map((size) => [size, { enabled: false, stock: "0" }]),
  ) as Record<ClothingSize, SizeRowState>;
}

function initSizeState(variants?: SizeVariantSeed[]): Record<ClothingSize, SizeRowState> {
  const state = emptySizeState();
  if (!variants?.length) return state;
  for (const variant of variants) {
    if (!isClothingSize(variant.title) || !variant.isActive) continue;
    state[variant.title] = {
      enabled: true,
      stock: String(Math.max(0, variant.stock)),
    };
  }
  return state;
}

function resolveBaseSku(productSku: string, variants?: SizeVariantSeed[]) {
  const sizeVariant = variants?.find((v) => isClothingSize(v.title) && v.isActive);
  if (sizeVariant) return baseSkuFromVariantSku(sizeVariant.sku);
  if (productSku && !isClothingSize(productSku.split("-").pop() ?? "")) return productSku;
  return productSku.replace(/-(XS|S|M|L|XL)$/i, "") || productSku;
}

const editUnderline =
  "border-b border-dashed border-transparent bg-transparent outline-none transition hover:border-primary/40 focus:border-primary";

export function AdminProductForm({
  product,
  categories,
  fandoms,
  brands,
}: {
  product?: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string | null;
    description: string | null;
    status: string;
    primaryCategoryId: string | null;
    fandomId: string | null;
    brandId: string | null;
    priceAmount: number;
    compareAtPriceAmount: number | null;
    isFeatured: boolean;
    isNew: boolean;
    sku: string;
    stock: number;
    imageUrl?: string | null;
    imageUrls?: string[];
    customSpecs?: CustomSpecRow[];
    sizeVariants?: SizeVariantSeed[];
  };
  categories: Option[];
  fandoms: Option[];
  brands: Option[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));

  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [status, setStatus] = useState(product?.status ?? "DRAFT");
  const [category, setCategory] = useState<TaxonomyValue>(() =>
    initTaxonomy(product?.primaryCategoryId, categories),
  );
  const [fandom, setFandom] = useState<TaxonomyValue>(() =>
    initTaxonomy(product?.fandomId, fandoms),
  );
  const [brand, setBrand] = useState<TaxonomyValue>(() =>
    initTaxonomy(product?.brandId, brands),
  );
  const [priceUah, setPriceUah] = useState(kopiykyToUah(product?.priceAmount ?? 0));
  const [compareUah, setCompareUah] = useState(
    product?.compareAtPriceAmount != null ? kopiykyToUah(product.compareAtPriceAmount) : "",
  );
  const [showComparePrice, setShowComparePrice] = useState(
    product?.compareAtPriceAmount != null,
  );
  const [sku, setSku] = useState(() => resolveBaseSku(product?.sku ?? "", product?.sizeVariants));
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [sizes, setSizes] = useState(() => initSizeState(product?.sizeVariants));
  const [previewSize, setPreviewSize] = useState<ClothingSize | null>(null);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isNew, setIsNew] = useState(product?.isNew ?? false);
  const [images, setImages] = useState<string[]>(() => {
    if (product?.imageUrls?.length) return product.imageUrls.slice(0, MAX_PRODUCT_IMAGES);
    if (product?.imageUrl) return [product.imageUrl];
    return [];
  });
  const [activeImage, setActiveImage] = useState(0);
  const [customSpecs, setCustomSpecs] = useState<CustomSpecRow[]>(
    () => product?.customSpecs ?? [],
  );

  const priceAmount = uahToKopiyky(priceUah);
  const compareAtPriceAmount = compareUah.trim() ? uahToKopiyky(compareUah) : null;

  const apparel = useMemo(() => {
    if (category.mode === "existing") {
      const opt = categories.find((item) => item.id === category.id);
      return isClothingCategory({ slug: opt?.slug, name: category.name });
    }
    if (category.mode === "new") {
      return isClothingCategory({ name: category.name });
    }
    return false;
  }, [category, categories]);

  const enabledSizes = useMemo(
    () =>
      CLOTHING_SIZES.filter((size) => sizes[size].enabled).map((size) => ({
        size,
        stock: Math.max(0, Number(sizes[size].stock) || 0),
      })),
    [sizes],
  );

  const totalSizeStock = enabledSizes.reduce((sum, row) => sum + row.stock, 0);
  const stockNum = apparel ? totalSizeStock : Math.max(0, Number(stock) || 0);
  const activePreviewSize =
    previewSize && sizes[previewSize].enabled
      ? previewSize
      : (enabledSizes[0]?.size ?? null);
  const activePreviewStock = activePreviewSize
    ? Math.max(0, Number(sizes[activePreviewSize].stock) || 0)
    : 0;

  const displayTitle = title.trim() || "Назва товару";
  const safeActive = Math.min(activeImage, Math.max(0, images.length - 1));
  const displayImage =
    images[safeActive]?.trim() ||
    `/api/placeholder?title=${encodeURIComponent(displayTitle)}&hue=320`;
  const fandomName = taxonomyDisplay(fandom);
  const brandName = taxonomyDisplay(brand);
  const categoryName = taxonomyDisplay(category);
  const canSubmit =
    Boolean(title.trim() && slug.trim() && sku.trim()) &&
    (!apparel || enabledSizes.length > 0);

  function updateSize(size: ClothingSize, patch: Partial<SizeRowState>) {
    setSizes((prev) => ({
      ...prev,
      [size]: { ...prev[size], ...patch },
    }));
  }

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        startTransition(async () => {
          const result = await upsertAdminProduct(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push("/admin/products");
          router.refresh();
        });
      }}
    >
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="priceAmount" value={priceAmount} />
      <input type="hidden" name="compareAtPriceAmount" value={compareAtPriceAmount ?? ""} />
      <input type="hidden" name="isFeatured" value={isFeatured ? "on" : ""} />
      <input type="hidden" name="isNew" value={isNew ? "on" : ""} />
      <input
        type="hidden"
        name="primaryCategoryId"
        value={category.mode === "existing" ? category.id : ""}
      />
      <input
        type="hidden"
        name="newCategoryName"
        value={category.mode === "new" ? category.name : ""}
      />
      <input type="hidden" name="fandomId" value={fandom.mode === "existing" ? fandom.id : ""} />
      <input
        type="hidden"
        name="newFandomName"
        value={fandom.mode === "new" ? fandom.name : ""}
      />
      <input type="hidden" name="brandId" value={brand.mode === "existing" ? brand.id : ""} />
      <input type="hidden" name="newBrandName" value={brand.mode === "new" ? brand.name : ""} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="shortDescription" value={shortDescription} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="sku" value={sku} />
      <input type="hidden" name="stock" value={apparel ? String(totalSizeStock) : stock} />
      <input type="hidden" name="imageUrl" value={images[0] ?? ""} />
      <input type="hidden" name="imagesJson" value={JSON.stringify(images)} />
      <input
        type="hidden"
        name="customSpecsJson"
        value={JSON.stringify(
          customSpecs.filter((row) => row.label.trim() && row.value.trim()),
        )}
      />
      <input
        type="hidden"
        name="sizesJson"
        value={apparel ? JSON.stringify(enabledSizes) : ""}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-card)] sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:p-4">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1 text-xs">
            <span className="text-muted-foreground">Статус</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>
          <label className="block space-y-1 text-xs sm:col-span-2 lg:col-span-2">
            <span className="text-muted-foreground">Slug (URL)</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              placeholder="product-slug"
            />
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              Хіт
            </label>
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
              />
              Новинка
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending || !canSubmit}>
            {pending ? "Збереження..." : "Зберегти"}
          </Button>
          <Button href="/admin/products" variant="secondary">
            Скасувати
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[1.35rem] border border-border bg-background shadow-[var(--shadow-card)]">
        <div className="border-b border-border px-4 py-3 text-xs text-muted-foreground sm:px-6">
          <span>Головна</span>
          <span className="mx-1.5">/</span>
          <span>Каталог</span>
          {categoryName ? (
            <>
              <span className="mx-1.5">/</span>
              <span>{categoryName}</span>
            </>
          ) : null}
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{displayTitle}</span>
        </div>

        <div className="space-y-8 p-4 sm:p-6">
          <div>
            <div className="max-w-md">
              <CreatableTaxonomyField
                label="Фендом"
                options={fandoms}
                value={fandom}
                onChange={setFandom}
                placeholder="Обрати або додати фендом"
                createLabel="Додати фендом"
                tone="primary"
              />
            </div>
            <input
              value={title}
              onChange={(e) => {
                const next = e.target.value;
                setTitle(next);
                if (!slugTouched) setSlug(slugify(next));
              }}
              placeholder="Назва товару"
              className={cn(
                "text-display mt-3 w-full text-3xl font-semibold sm:text-4xl",
                editUnderline,
                !title.trim() && "text-muted-foreground/50",
              )}
            />
            <input
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Короткий опис (підзаголовок)"
              className={cn(
                "mt-3 w-full max-w-2xl text-base text-muted-foreground",
                editUnderline,
              )}
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="aspect-square overflow-hidden rounded-[1.75rem] border border-border bg-surface-muted shadow-[var(--shadow-card)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={displayImage} alt={displayTitle} className="size-full object-cover" />
              </div>

              {images.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveImage(index)}
                        className={cn(
                          "size-20 overflow-hidden rounded-xl border",
                          safeActive === index ? "border-primary" : "border-border",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="size-full object-cover" />
                      </button>
                      <div className="absolute -top-1.5 -right-1.5 flex gap-0.5">
                        {index !== 0 ? (
                          <button
                            type="button"
                            title="Зробити головним"
                            className="inline-flex size-6 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground shadow hover:text-primary"
                            onClick={() => {
                              setImages((prev) => {
                                const next = [...prev];
                                const [item] = next.splice(index, 1);
                                if (!item) return prev;
                                next.unshift(item);
                                return next;
                              });
                              setActiveImage(0);
                            }}
                          >
                            <Star className="size-3" />
                          </button>
                        ) : (
                          <span
                            title="Головне фото"
                            className="inline-flex size-6 items-center justify-center rounded-full border border-primary/40 bg-primary text-white shadow"
                          >
                            <Star className="size-3 fill-current" />
                          </span>
                        )}
                        <button
                          type="button"
                          title="Видалити"
                          className="inline-flex size-6 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground shadow hover:text-danger"
                          onClick={() => {
                            setImages((prev) => prev.filter((_, i) => i !== index));
                            setActiveImage((prev) => {
                              if (index < prev) return prev - 1;
                              if (index === prev) return Math.max(0, prev - 1);
                              return prev;
                            });
                          }}
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                      {index === 0 ? (
                        <p className="mt-1 text-center text-[10px] font-semibold text-primary">
                          Головне
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              <ImagePickerField
                value={images[0]}
                onAdd={(urls) => {
                  setImages((prev) => {
                    const merged = [...prev];
                    for (const url of urls) {
                      if (merged.length >= MAX_PRODUCT_IMAGES) break;
                      if (!merged.includes(url)) merged.push(url);
                    }
                    return merged;
                  });
                  setActiveImage((prev) => (images.length === 0 ? 0 : prev));
                }}
                maxRemaining={MAX_PRODUCT_IMAGES - images.length}
                buttonLabel={
                  images.length === 0 ? "Завантажити картинку" : "Додати картинку"
                }
                showClear={false}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-3">
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={priceUah}
                      onChange={(e) => setPriceUah(e.target.value)}
                      className={cn(
                        "w-28 text-3xl font-bold text-primary tabular-nums",
                        editUnderline,
                      )}
                    />
                    <span className="text-xl font-bold text-primary">грн</span>
                  </div>
                  {showComparePrice ? (
                    <div className="flex items-baseline gap-2 text-muted-foreground">
                      <div className="flex items-baseline gap-1 line-through">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={compareUah}
                          onChange={(e) => setCompareUah(e.target.value)}
                          placeholder="—"
                          autoFocus={!compareUah}
                          className={cn(
                            "w-24 text-base tabular-nums line-through",
                            editUnderline,
                          )}
                        />
                        <span className="text-sm">грн</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCompareUah("");
                          setShowComparePrice(false);
                        }}
                        className="text-xs text-muted-foreground underline-offset-2 hover:text-danger hover:underline"
                      >
                        прибрати
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowComparePrice(true);
                        setCompareUah((prev) => prev || "");
                      }}
                      className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                    >
                      + стара ціна
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{formatMoney(priceAmount)}</p>

                {!apparel ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        stockNum > 0 ? "text-success" : "text-danger",
                      )}
                    >
                      {stockNum > 0 ? "В наявності:" : "Немає в наявності"}
                    </p>
                    <input
                      type="number"
                      min={0}
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="h-8 w-20 rounded-lg border border-border bg-surface px-2 text-sm outline-none focus:border-primary"
                      aria-label="Залишок"
                    />
                  </div>
                ) : (
                  <p
                    className={cn(
                      "text-sm font-medium",
                      stockNum > 0 ? "text-success" : "text-danger",
                    )}
                  >
                    {stockNum > 0
                      ? `В наявності: ${stockNum}${
                          activePreviewSize ? ` (розмір ${activePreviewSize}: ${activePreviewStock})` : ""
                        }`
                      : "Немає в наявності"}
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{apparel ? "Базовий SKU:" : "SKU:"}</span>
                  <input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="SKU-001"
                    className={cn("min-w-0 flex-1 text-sm text-foreground", editUnderline)}
                  />
                </div>
                {apparel && sku.trim() && activePreviewSize ? (
                  <p className="text-xs text-muted-foreground">
                    Приклад: {sku.trim()}-{activePreviewSize}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <CreatableTaxonomyField
                  label="Категорія"
                  options={categories}
                  value={category}
                  onChange={setCategory}
                  placeholder="—"
                  createLabel="Додати категорію"
                />
                <CreatableTaxonomyField
                  label="Бренд"
                  options={brands}
                  value={brand}
                  onChange={setBrand}
                  placeholder="—"
                  createLabel="Додати бренд"
                />
              </div>

              {apparel ? (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">Розміри одягу</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Увімкніть розміри в наявності та вкажіть кількість для кожного.
                      </p>
                    </div>
                    {enabledSizes.length === 0 ? (
                      <p className="text-xs font-medium text-danger">Оберіть хоча б один розмір</p>
                    ) : null}
                  </div>
                  <div className="mt-3 space-y-2">
                    {CLOTHING_SIZES.map((size) => {
                      const row = sizes[size];
                      return (
                        <div
                          key={size}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-3 py-2",
                            row.enabled
                              ? "border-primary/40 bg-surface"
                              : "border-border bg-background/50",
                          )}
                        >
                          <label className="flex min-w-14 items-center gap-2 text-sm font-semibold">
                            <input
                              type="checkbox"
                              checked={row.enabled}
                              onChange={(e) => {
                                updateSize(size, { enabled: e.target.checked });
                                if (e.target.checked) setPreviewSize(size);
                              }}
                            />
                            {size}
                          </label>
                          <span className="text-xs text-muted-foreground">к-сть</span>
                          <input
                            type="number"
                            min={0}
                            disabled={!row.enabled}
                            value={row.stock}
                            onChange={(e) => updateSize(size, { stock: e.target.value })}
                            className="h-9 w-24 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary disabled:opacity-40"
                          />
                          <span
                            className={cn(
                              "ml-auto text-xs font-medium",
                              row.enabled && Number(row.stock) > 0
                                ? "text-success"
                                : "text-muted-foreground",
                            )}
                          >
                            {row.enabled
                              ? Number(row.stock) > 0
                                ? "в наявності"
                                : "0 — немає"
                              : "вимкнено"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {apparel && enabledSizes.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-semibold">Розмір</p>
                  <div className="flex flex-wrap gap-2">
                    {enabledSizes.map((row) => (
                      <button
                        key={row.size}
                        type="button"
                        onClick={() => setPreviewSize(row.size)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium",
                          activePreviewSize === row.size
                            ? "border-primary bg-primary text-white"
                            : "border-border hover:border-primary",
                          row.stock <= 0 && "opacity-50",
                        )}
                      >
                        {row.size}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 sm:w-auto sm:justify-start">
                  <span className="text-sm text-muted-foreground">К‑сть</span>
                  <span className="w-16 text-sm">1</span>
                </div>
                <button
                  type="button"
                  disabled
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-white opacity-90"
                >
                  <ShoppingBag className="size-4" />
                  В кошик
                </button>
                <button
                  type="button"
                  disabled
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-6 text-base font-semibold"
                >
                  <Heart className="size-4" />
                  В обране
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
              <h2 className="text-display text-2xl font-semibold">Опис</h2>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                placeholder="Опис скоро зʼявиться."
                className="mt-3 w-full resize-y rounded-xl border border-dashed border-border/80 bg-transparent px-3 py-2 text-sm leading-relaxed text-muted-foreground outline-none transition focus:border-primary"
              />
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-display text-2xl font-semibold">Характеристики</h2>
                <button
                  type="button"
                  disabled={customSpecs.length >= MAX_CUSTOM_SPECS}
                  onClick={() =>
                    setCustomSpecs((prev) =>
                      prev.length >= MAX_CUSTOM_SPECS
                        ? prev
                        : [...prev, { label: "", value: "" }],
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-2 hover:underline disabled:opacity-40"
                >
                  <Plus className="size-3.5" />
                  Додати рядок
                </button>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4 border-b border-border py-2">
                  <dt className="text-muted-foreground">Бренд</dt>
                  <dd className="text-right font-medium">{brandName || "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-border py-2">
                  <dt className="text-muted-foreground">Категорія</dt>
                  <dd className="text-right font-medium">{categoryName || "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-border py-2">
                  <dt className="text-muted-foreground">Фендом</dt>
                  <dd className="text-right font-medium text-primary">{fandomName || "—"}</dd>
                </div>
                {apparel ? (
                  <div className="flex items-center justify-between gap-4 border-b border-border py-2">
                    <dt className="text-muted-foreground">Розміри</dt>
                    <dd className="text-right font-medium">
                      {enabledSizes.length
                        ? enabledSizes.map((row) => `${row.size} (${row.stock})`).join(", ")
                        : "—"}
                    </dd>
                  </div>
                ) : null}
                {customSpecs.map((row, index) => (
                  <div
                    key={`spec-${index}`}
                    className="flex items-center gap-2 border-b border-border py-2"
                  >
                    <input
                      value={row.label}
                      onChange={(e) =>
                        setCustomSpecs((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, label: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Назва (напр. Матеріал)"
                      className="min-w-0 flex-1 bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/40 focus:text-foreground"
                    />
                    <input
                      value={row.value}
                      onChange={(e) =>
                        setCustomSpecs((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, value: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Значення (напр. PVC)"
                      className="min-w-0 flex-1 bg-transparent text-right text-sm font-medium outline-none placeholder:text-muted-foreground/40 focus:text-foreground"
                    />
                    <button
                      type="button"
                      title="Видалити рядок"
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted hover:text-danger"
                      onClick={() =>
                        setCustomSpecs((prev) => prev.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </dl>
              {customSpecs.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Додайте свої рядки: як розмір фігурки, матеріал, масштаб тощо.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
