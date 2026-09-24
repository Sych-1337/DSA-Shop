import { z } from "zod";

export const catalogSortSchema = z.enum([
  "popular",
  "newest",
  "price_asc",
  "price_desc",
  "discount",
  "rating",
]);

export type CatalogSort = z.infer<typeof catalogSortSchema>;

export const catalogQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  fandom: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  inStock: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional()
    .transform((v) => v === "1" || v === "true"),
  onSale: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional()
    .transform((v) => v === "1" || v === "true"),
  sort: catalogSortSchema.default("popular"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

/** Faceted / paginated catalog URLs are thin duplicates — keep out of the index. */
export function isThinCatalogQuery(
  query: CatalogQuery,
  options?: { ignoreCategory?: boolean; ignoreFandom?: boolean },
) {
  if (query.page > 1) return true;
  if (query.q?.trim()) return true;
  if (query.brand) return true;
  if (query.minPrice != null || query.maxPrice != null) return true;
  if (query.inStock) return true;
  if (query.onSale) return true;
  if (query.sort !== "popular") return true;
  if (query.category && !options?.ignoreCategory) return true;
  if (query.fandom && !options?.ignoreFandom) return true;
  return false;
}

export function parseCatalogSearchParams(
  params: Record<string, string | string[] | undefined>,
): CatalogQuery {
  const normalized: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(params)) {
    normalized[key] = Array.isArray(value) ? value[0] : value;
  }
  return catalogQuerySchema.parse(normalized);
}
