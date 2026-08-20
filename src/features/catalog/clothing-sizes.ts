export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL"] as const;

export type ClothingSize = (typeof CLOTHING_SIZES)[number];

export function isClothingCategory(input: {
  slug?: string | null;
  name?: string | null;
}) {
  const slug = input.slug?.toLowerCase().trim() ?? "";
  const name = input.name?.toLowerCase().trim() ?? "";
  return slug === "apparel" || name === "одяг";
}

export function isClothingSize(value: string): value is ClothingSize {
  return (CLOTHING_SIZES as readonly string[]).includes(value);
}

/** Strip trailing `-XS` / `-S` … from SKU to get the product base SKU. */
export function baseSkuFromVariantSku(sku: string) {
  const match = sku.match(/^(.*?)-(XS|S|M|L|XL)$/i);
  return match?.[1] || sku;
}
