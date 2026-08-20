"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ProductStatus, type Prisma } from "@/generated/prisma";
import {
  CLOTHING_SIZES,
  isClothingCategory,
  isClothingSize,
  type ClothingSize,
} from "@/features/catalog/clothing-sizes";
import {
  customSpecRowSchema,
  MAX_CUSTOM_SPECS,
  parseCustomSpecs,
} from "@/features/catalog/custom-specs";
import { notifyBackInStockForProduct } from "@/features/back-in-stock/service";
import { setOnHandWithMovement } from "@/features/inventory/service";
import { MAX_PRODUCT_IMAGES } from "@/features/media/constants";
import { assertPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";

const sizeRowSchema = z.object({
  size: z.enum(CLOTHING_SIZES),
  stock: z.coerce.number().int().nonnegative(),
});

const upsertSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  status: z.nativeEnum(ProductStatus),
  primaryCategoryId: z.string().optional(),
  fandomId: z.string().optional(),
  brandId: z.string().optional(),
  newCategoryName: z.string().max(120).optional(),
  newFandomName: z.string().max(120).optional(),
  newBrandName: z.string().max(120).optional(),
  priceAmount: z.coerce.number().int().nonnegative(),
  compareAtPriceAmount: z.coerce.number().int().nonnegative().optional().nullable(),
  sku: z.string().min(1).max(64),
  stock: z.coerce.number().int().nonnegative().default(0),
  isFeatured: z.coerce.boolean().optional(),
  isNew: z.coerce.boolean().optional(),
  imageUrl: z.string().max(1000).optional(),
  imageUrls: z.array(z.string().min(1).max(1000)).max(MAX_PRODUCT_IMAGES).optional(),
  sizeRows: z.array(sizeRowSchema).optional(),
  customSpecs: z.array(customSpecRowSchema).max(MAX_CUSTOM_SPECS).optional(),
});

const CYR_MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "h",
  ґ: "g",
  д: "d",
  е: "e",
  є: "ye",
  ж: "zh",
  з: "z",
  и: "y",
  і: "i",
  ї: "yi",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ь: "",
  ю: "yu",
  я: "ya",
  ы: "y",
  э: "e",
  ё: "yo",
  ъ: "",
};

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .trim()
    .split("")
    .map((ch) => CYR_MAP[ch] ?? ch)
    .join("")
    .replace(/['’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `item-${Date.now().toString(36)}`;
}

function toSearchText(input: {
  title: string;
  shortDescription?: string | null;
  sku: string;
}) {
  return [input.title, input.shortDescription, input.sku].filter(Boolean).join(" ").toLowerCase();
}

function parseSizeRows(raw: string | undefined) {
  if (!raw?.trim()) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = z.array(sizeRowSchema).safeParse(parsed);
    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}

function parseImageUrls(raw: string | undefined, fallbackUrl?: string) {
  if (raw?.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      const result = z.array(z.string().min(1).max(1000)).max(MAX_PRODUCT_IMAGES).safeParse(parsed);
      if (result.success) {
        return [...new Set(result.data.map((url) => url.trim()).filter(Boolean))].slice(
          0,
          MAX_PRODUCT_IMAGES,
        );
      }
    } catch {
      // fall through
    }
  }
  if (fallbackUrl?.trim()) return [fallbackUrl.trim()];
  return [];
}

async function uniqueSlug(
  tx: Prisma.TransactionClient,
  table: "category" | "fandom" | "brand",
  desired: string,
) {
  let candidate = desired;
  let i = 2;
  while (true) {
    const existing =
      table === "category"
        ? await tx.category.findUnique({ where: { slug: candidate }, select: { id: true } })
        : table === "fandom"
          ? await tx.fandom.findUnique({ where: { slug: candidate }, select: { id: true } })
          : await tx.brand.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    candidate = `${desired}-${i}`;
    i += 1;
  }
}

async function resolveCategoryId(
  tx: Prisma.TransactionClient,
  id: string | undefined,
  newName: string | undefined,
) {
  if (id) return id;
  const name = newName?.trim();
  if (!name) return null;
  const existing = await tx.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) return existing.id;
  const slug = await uniqueSlug(tx, "category", slugify(name));
  const maxSort = await tx.category.aggregate({ _max: { sortOrder: true } });
  const created = await tx.category.create({
    data: {
      name,
      slug,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      isActive: true,
    },
  });
  return created.id;
}

async function resolveFandomId(
  tx: Prisma.TransactionClient,
  id: string | undefined,
  newName: string | undefined,
) {
  if (id) return id;
  const name = newName?.trim();
  if (!name) return null;
  const existing = await tx.fandom.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) return existing.id;
  const slug = await uniqueSlug(tx, "fandom", slugify(name));
  const maxSort = await tx.fandom.aggregate({ _max: { sortOrder: true } });
  const created = await tx.fandom.create({
    data: {
      name,
      slug,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      isActive: true,
    },
  });
  return created.id;
}

async function resolveBrandId(
  tx: Prisma.TransactionClient,
  id: string | undefined,
  newName: string | undefined,
) {
  if (id) return id;
  const name = newName?.trim();
  if (!name) return null;
  const existing = await tx.brand.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) return existing.id;
  const slug = await uniqueSlug(tx, "brand", slugify(name));
  const created = await tx.brand.create({
    data: { name, slug, isActive: true },
  });
  return created.id;
}

async function uniqueVariantSku(
  tx: Prisma.TransactionClient,
  desired: string,
  excludeVariantId?: string,
) {
  let candidate = desired.slice(0, 64);
  let i = 2;
  while (true) {
    const existing = await tx.productVariant.findUnique({
      where: { sku: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeVariantId) return candidate;
    const suffix = `-${i}`;
    candidate = `${desired.slice(0, Math.max(1, 64 - suffix.length))}${suffix}`;
    i += 1;
  }
}

async function syncApparelSizeVariants(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    baseSku: string;
    priceAmount: number;
    compareAtPriceAmount: number | null | undefined;
    warehouseId: string;
    sizeRows: { size: ClothingSize; stock: number }[];
    actorId?: string;
  },
) {
  const existing = await tx.productVariant.findMany({
    where: { productId: input.productId },
  });
  const enabled = new Map(input.sizeRows.map((row) => [row.size, row.stock]));

  for (const variant of existing) {
    if (isClothingSize(variant.title) && enabled.has(variant.title)) continue;
    await tx.productVariant.update({
      where: { id: variant.id },
      data: { isActive: false, isDefault: false },
    });
    await setOnHandWithMovement(tx, {
      warehouseId: input.warehouseId,
      variantId: variant.id,
      onHand: 0,
      actorId: input.actorId,
      reason: "Вимкнено розмір у картці товару",
    });
  }

  let sortOrder = 0;
  let defaultSet = false;
  for (const size of CLOTHING_SIZES) {
    if (!enabled.has(size)) continue;
    const stock = enabled.get(size) ?? 0;
    const match =
      existing.find((v) => v.title === size) ??
      existing.find((v) => v.sku.endsWith(`-${size}`));
    const desiredSku = await uniqueVariantSku(tx, `${input.baseSku}-${size}`, match?.id);

    let variantId: string;
    if (match) {
      await tx.productVariant.update({
        where: { id: match.id },
        data: {
          sku: desiredSku,
          title: size,
          priceAmount: input.priceAmount,
          compareAtPriceAmount: input.compareAtPriceAmount || null,
          isActive: true,
          isDefault: !defaultSet,
          sortOrder,
        },
      });
      variantId = match.id;
    } else {
      const created = await tx.productVariant.create({
        data: {
          productId: input.productId,
          sku: desiredSku,
          title: size,
          priceAmount: input.priceAmount,
          compareAtPriceAmount: input.compareAtPriceAmount || null,
          isActive: true,
          isDefault: !defaultSet,
          sortOrder,
        },
      });
      variantId = created.id;
    }
    await setOnHandWithMovement(tx, {
      warehouseId: input.warehouseId,
      variantId,
      onHand: stock,
      actorId: input.actorId,
      reason: "Оновлення залишку розміру з картки товару",
    });
    defaultSet = true;
    sortOrder += 1;
  }
}

async function syncSingleVariant(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    sku: string;
    priceAmount: number;
    compareAtPriceAmount: number | null | undefined;
    warehouseId: string;
    stock: number;
    actorId?: string;
  },
) {
  const existing = await tx.productVariant.findMany({
    where: { productId: input.productId },
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
  });

  const keep =
    existing.find((v) => v.title === "Default") ??
    existing.find((v) => !isClothingSize(v.title)) ??
    existing[0];

  for (const variant of existing) {
    if (keep && variant.id === keep.id) continue;
    await tx.productVariant.update({
      where: { id: variant.id },
      data: { isActive: false, isDefault: false },
    });
    await setOnHandWithMovement(tx, {
      warehouseId: input.warehouseId,
      variantId: variant.id,
      onHand: 0,
      actorId: input.actorId,
      reason: "Вимкнено варіант у картці товару",
    });
  }

  if (keep) {
    const sku = await uniqueVariantSku(tx, input.sku, keep.id);
    await tx.productVariant.update({
      where: { id: keep.id },
      data: {
        sku,
        title: "Default",
        priceAmount: input.priceAmount,
        compareAtPriceAmount: input.compareAtPriceAmount || null,
        isActive: true,
        isDefault: true,
        sortOrder: 0,
      },
    });
    await setOnHandWithMovement(tx, {
      warehouseId: input.warehouseId,
      variantId: keep.id,
      onHand: input.stock,
      actorId: input.actorId,
      reason: "Оновлення залишку з картки товару",
    });
    return;
  }

  const sku = await uniqueVariantSku(tx, input.sku);
  const created = await tx.productVariant.create({
    data: {
      productId: input.productId,
      sku,
      title: "Default",
      priceAmount: input.priceAmount,
      compareAtPriceAmount: input.compareAtPriceAmount || null,
      isActive: true,
      isDefault: true,
      sortOrder: 0,
    },
  });
  await setOnHandWithMovement(tx, {
    warehouseId: input.warehouseId,
    variantId: created.id,
    onHand: input.stock,
    actorId: input.actorId,
    reason: "Початковий залишок з картки товару",
  });
}

async function syncProductImages(
  tx: Prisma.TransactionClient,
  productId: string,
  imageUrls: string[],
  title: string,
) {
  const urls =
    imageUrls.length > 0
      ? imageUrls.slice(0, MAX_PRODUCT_IMAGES)
      : [`/api/placeholder?title=${encodeURIComponent(title)}&hue=320`];

  await tx.productImage.updateMany({
    where: { productId, deletedAt: null },
    data: { deletedAt: new Date(), isPrimary: false },
  });

  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i]!;
    const reusable = await tx.productImage.findFirst({
      where: { productId, url },
      orderBy: { createdAt: "desc" },
    });
    if (reusable) {
      await tx.productImage.update({
        where: { id: reusable.id },
        data: {
          deletedAt: null,
          alt: title,
          sortOrder: i,
          isPrimary: i === 0,
        },
      });
    } else {
      await tx.productImage.create({
        data: {
          productId,
          url,
          alt: title,
          sortOrder: i,
          isPrimary: i === 0,
        },
      });
    }
  }
}

export async function upsertAdminProduct(formData: FormData) {
  const staff = await assertPermission("products.write");
  const raw = {
    id: formData.get("id")?.toString() || undefined,
    title: formData.get("title")?.toString() ?? "",
    slug: formData.get("slug")?.toString() ?? "",
    shortDescription: formData.get("shortDescription")?.toString() || undefined,
    description: formData.get("description")?.toString() || undefined,
    status: formData.get("status")?.toString() ?? "DRAFT",
    primaryCategoryId: formData.get("primaryCategoryId")?.toString() || undefined,
    fandomId: formData.get("fandomId")?.toString() || undefined,
    brandId: formData.get("brandId")?.toString() || undefined,
    newCategoryName: formData.get("newCategoryName")?.toString() || undefined,
    newFandomName: formData.get("newFandomName")?.toString() || undefined,
    newBrandName: formData.get("newBrandName")?.toString() || undefined,
    priceAmount: formData.get("priceAmount")?.toString() ?? "0",
    compareAtPriceAmount: formData.get("compareAtPriceAmount")?.toString() || null,
    sku: formData.get("sku")?.toString() || "SKU",
    stock: formData.get("stock")?.toString() ?? "0",
    isFeatured: formData.get("isFeatured") === "on",
    isNew: formData.get("isNew") === "on",
    imageUrl: formData.get("imageUrl")?.toString() || undefined,
    imageUrls: parseImageUrls(
      formData.get("imagesJson")?.toString(),
      formData.get("imageUrl")?.toString() || undefined,
    ),
    sizeRows: parseSizeRows(formData.get("sizesJson")?.toString()),
    customSpecs: parseCustomSpecs(formData.get("customSpecsJson")?.toString()),
  };

  const parsed = upsertSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const data = parsed.data;
  const warehouse = await prisma.warehouse.findFirst({ where: { isDefault: true } });
  if (!warehouse) {
    return { ok: false as const, error: "Default warehouse missing" };
  }

  const searchText = toSearchText(data);
  const publishedAt = data.status === ProductStatus.PUBLISHED ? new Date() : null;

  try {
    if (data.id) {
      const existing = await prisma.product.findUnique({ where: { id: data.id } });
      if (!existing) return { ok: false as const, error: "Product not found" };

      await prisma.$transaction(async (tx) => {
        const primaryCategoryId = await resolveCategoryId(
          tx,
          data.primaryCategoryId,
          data.newCategoryName,
        );
        const fandomId = await resolveFandomId(tx, data.fandomId, data.newFandomName);
        const brandId = await resolveBrandId(tx, data.brandId, data.newBrandName);

        const category = primaryCategoryId
          ? await tx.category.findUnique({ where: { id: primaryCategoryId } })
          : null;
        const apparel = Boolean(category && isClothingCategory(category));

        if (apparel && (!data.sizeRows || data.sizeRows.length === 0)) {
          throw new Error("Для одягу оберіть хоча б один розмір");
        }

        await tx.product.update({
          where: { id: data.id },
          data: {
            title: data.title,
            slug: data.slug,
            shortDescription: data.shortDescription,
            description: data.description,
            status: data.status,
            primaryCategoryId,
            fandomId,
            brandId,
            priceAmount: data.priceAmount,
            compareAtPriceAmount: data.compareAtPriceAmount || null,
            isFeatured: data.isFeatured ?? false,
            isNew: data.isNew ?? false,
            customSpecs: data.customSpecs ?? [],
            searchText,
            publishedAt:
              data.status === ProductStatus.PUBLISHED
                ? (existing.publishedAt ?? publishedAt)
                : null,
            archivedAt: data.status === ProductStatus.ARCHIVED ? new Date() : null,
          },
        });

        if (primaryCategoryId) {
          await tx.productCategory.upsert({
            where: {
              productId_categoryId: { productId: data.id!, categoryId: primaryCategoryId },
            },
            update: {},
            create: { productId: data.id!, categoryId: primaryCategoryId },
          });
        }

        await syncProductImages(tx, data.id!, data.imageUrls ?? [], data.title);

        if (apparel && data.sizeRows) {
          await syncApparelSizeVariants(tx, {
            productId: data.id!,
            baseSku: data.sku,
            priceAmount: data.priceAmount,
            compareAtPriceAmount: data.compareAtPriceAmount,
            warehouseId: warehouse.id,
            sizeRows: data.sizeRows,
            actorId: staff.userId,
          });
        } else {
          await syncSingleVariant(tx, {
            productId: data.id!,
            sku: data.sku,
            priceAmount: data.priceAmount,
            compareAtPriceAmount: data.compareAtPriceAmount,
            warehouseId: warehouse.id,
            stock: data.stock,
            actorId: staff.userId,
          });
        }
      });

      await notifyBackInStockForProduct(data.id).catch((error) => {
        console.error("[catalog] back-in-stock notify", error);
      });

      revalidatePath("/admin/products");
      revalidatePath("/admin/inventory");
      revalidatePath(`/product/${data.slug}`);
      revalidatePath("/catalog");
      return { ok: true as const, id: data.id };
    }

    const created = await prisma.$transaction(async (tx) => {
      const primaryCategoryId = await resolveCategoryId(
        tx,
        data.primaryCategoryId,
        data.newCategoryName,
      );
      const fandomId = await resolveFandomId(tx, data.fandomId, data.newFandomName);
      const brandId = await resolveBrandId(tx, data.brandId, data.newBrandName);

      const category = primaryCategoryId
        ? await tx.category.findUnique({ where: { id: primaryCategoryId } })
        : null;
      const apparel = Boolean(category && isClothingCategory(category));

      if (apparel && (!data.sizeRows || data.sizeRows.length === 0)) {
        throw new Error("Для одягу оберіть хоча б один розмір");
      }

      const product = await tx.product.create({
        data: {
          title: data.title,
          slug: data.slug,
          shortDescription: data.shortDescription,
          description: data.description,
          status: data.status,
          primaryCategoryId,
          fandomId,
          brandId,
          priceAmount: data.priceAmount,
          compareAtPriceAmount: data.compareAtPriceAmount || null,
          isFeatured: data.isFeatured ?? false,
          isNew: data.isNew ?? false,
          customSpecs: data.customSpecs ?? [],
          searchText,
          publishedAt,
          categories: primaryCategoryId
            ? { create: [{ categoryId: primaryCategoryId }] }
            : undefined,
        },
      });

      await syncProductImages(tx, product.id, data.imageUrls ?? [], data.title);

      if (apparel && data.sizeRows) {
        await syncApparelSizeVariants(tx, {
          productId: product.id,
          baseSku: data.sku,
          priceAmount: data.priceAmount,
          compareAtPriceAmount: data.compareAtPriceAmount,
          warehouseId: warehouse.id,
          sizeRows: data.sizeRows,
          actorId: staff.userId,
        });
      } else {
        await syncSingleVariant(tx, {
          productId: product.id,
          sku: data.sku,
          priceAmount: data.priceAmount,
          compareAtPriceAmount: data.compareAtPriceAmount,
          warehouseId: warehouse.id,
          stock: data.stock,
          actorId: staff.userId,
        });
      }

      return product;
    });

    await notifyBackInStockForProduct(created.id).catch((error) => {
      console.error("[catalog] back-in-stock notify", error);
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/catalog");
    return { ok: true as const, id: created.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Не вдалося зберегти товар";
    return { ok: false as const, error: message };
  }
}
