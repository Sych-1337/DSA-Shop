import type { Prisma } from "@/generated/prisma";
import { ProductStatus } from "@/generated/prisma";
import { parseCatalogSearchParams, type CatalogQuery, type CatalogSort } from "@/features/catalog/schema";
import { prisma } from "@/lib/db/prisma";

export const productCardInclude = {
  images: {
    where: { deletedAt: null },
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
    take: 1,
  },
  primaryCategory: true,
  fandom: true,
  brand: true,
  variants: {
    where: { isActive: true },
    orderBy: [{ isDefault: "desc" as const }, { sortOrder: "asc" as const }],
    include: {
      inventory: true,
    },
  },
} satisfies Prisma.ProductInclude;

export type ProductCardRecord = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

function orderByForSort(sort: CatalogSort): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
    case "price_asc":
      return [{ priceAmount: "asc" }];
    case "price_desc":
      return [{ priceAmount: "desc" }];
    case "discount":
      return [{ compareAtPriceAmount: "desc" }, { priceAmount: "asc" }];
    case "rating":
      return [{ averageRating: "desc" }, { salesCount: "desc" }];
    case "popular":
    default:
      return [{ salesCount: "desc" }, { publishedAt: "desc" }];
  }
}

export function buildCatalogWhere(query: CatalogQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.PUBLISHED,
    archivedAt: null,
  };

  if (query.category) {
    where.OR = [
      { primaryCategory: { slug: query.category } },
      { categories: { some: { category: { slug: query.category } } } },
    ];
  }

  if (query.fandom) {
    where.fandom = { slug: query.fandom };
  }

  if (query.brand) {
    where.brand = { slug: query.brand };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.priceAmount = {};
    if (query.minPrice !== undefined) where.priceAmount.gte = query.minPrice;
    if (query.maxPrice !== undefined) where.priceAmount.lte = query.maxPrice;
  }

  if (query.onSale) {
    where.compareAtPriceAmount = { not: null };
  }

  if (query.inStock) {
    where.variants = {
      some: {
        isActive: true,
        inventory: { some: { onHand: { gt: 0 } } },
      },
    };
  }

  if (query.q) {
    const raw = query.q.trim();
    const tokens = raw
      .split(/[\s,.;:!?\u2014\-/]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
      .slice(0, 6);
    const terms = tokens.length > 0 ? tokens : raw ? [raw] : [];

    const tokenClauses: Prisma.ProductWhereInput[] = terms.map((term) => ({
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { searchText: { contains: term.toLowerCase(), mode: "insensitive" } },
        { shortDescription: { contains: term, mode: "insensitive" } },
        { variants: { some: { sku: { contains: term, mode: "insensitive" } } } },
        { fandom: { name: { contains: term, mode: "insensitive" } } },
        { brand: { name: { contains: term, mode: "insensitive" } } },
        { primaryCategory: { name: { contains: term, mode: "insensitive" } } },
        { character: { name: { contains: term, mode: "insensitive" } } },
      ],
    }));

    if (tokenClauses.length > 0) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        ...tokenClauses,
      ];
    }
  }

  return where;
}

export type SearchSuggestion = {
  id: string;
  slug: string;
  title: string;
  priceAmount: number;
  imageUrl: string | null;
  fandomName: string | null;
};

export async function listSearchSuggestions(q: string, limit = 6): Promise<SearchSuggestion[]> {
  const term = q.trim();
  if (term.length < 2) return [];

  const result = await listCatalogProducts(
    parseCatalogSearchParams({
      q: term,
      page: "1",
      pageSize: String(limit),
      sort: "popular",
    }),
  );

  return result.products.map((product) => ({
    id: product.id,
    slug: product.slug,
    title: product.title,
    priceAmount: product.priceAmount,
    imageUrl: product.images[0]?.url ?? null,
    fandomName: product.fandom?.name ?? null,
  }));
}

export async function listPopularSearchQueries(limit = 6) {
  const rows = await prisma.searchQueryLog.groupBy({
    by: ["query"],
    where: { hadResults: true, createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) } },
    _count: { _all: true },
    orderBy: { _count: { query: "desc" } },
    take: limit,
  });
  return rows.map((row) => row.query);
}

export async function listCatalogProducts(query: CatalogQuery) {
  const where = buildCatalogWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy: orderByForSort(query.sort),
      skip,
      take: query.pageSize,
    }),
  ]);

  let filtered = products;
  if (query.onSale) {
    filtered = products.filter(
      (p) => p.compareAtPriceAmount != null && p.compareAtPriceAmount > p.priceAmount,
    );
  }

  return {
    products: filtered,
    total: query.onSale ? filtered.length : total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil((query.onSale ? filtered.length : total) / query.pageSize)),
  };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: ProductStatus.PUBLISHED, archivedAt: null },
    include: {
      ...productCardInclude,
      images: {
        where: { deletedAt: null },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 7,
      },
      variants: {
        where: { isActive: true },
        orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
        include: {
          inventory: true,
          optionValues: {
            include: { optionValue: { include: { option: true } } },
          },
        },
      },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findFirst({ where: { slug, isActive: true } });
}

export async function getFandomBySlug(slug: string) {
  return prisma.fandom.findFirst({ where: { slug, isActive: true } });
}

export async function getCollectionBySlug(slug: string) {
  return prisma.collection.findFirst({
    where: { slug, isActive: true },
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        include: { product: { include: productCardInclude } },
      },
    },
  });
}

export async function listActiveCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listActiveFandoms() {
  return prisma.fandom.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listActiveBrands() {
  return prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function listFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { status: ProductStatus.PUBLISHED, isFeatured: true, archivedAt: null },
    include: productCardInclude,
    orderBy: [{ salesCount: "desc" }],
    take: limit,
  });
}

export async function listNewProducts(limit = 8) {
  return prisma.product.findMany({
    where: { status: ProductStatus.PUBLISHED, isNew: true, archivedAt: null },
    include: productCardInclude,
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
  });
}

export async function logSearchQuery(query: string, resultCount: number) {
  if (!query.trim()) return;
  await prisma.searchQueryLog.create({
    data: {
      query: query.trim().slice(0, 200),
      resultCount,
      hadResults: resultCount > 0,
    },
  });

  const { AnalyticsEvents } = await import("@/features/analytics/events");
  const { trackEvent } = await import("@/features/analytics/service");
  await trackEvent({
    name: AnalyticsEvents.SEARCH,
    path: "/search",
    properties: {
      search_term: query.trim().slice(0, 200),
      result_count: resultCount,
    },
  });
}

export async function listAdminProducts(params: {
  q?: string;
  status?: ProductStatus;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const where: Prisma.ProductWhereInput = {};
  if (params.status) where.status = params.status;
  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { slug: { contains: params.q, mode: "insensitive" } },
      { variants: { some: { sku: { contains: params.q, mode: "insensitive" } } } },
    ];
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { products, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getAdminProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      images: {
        where: { deletedAt: null },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 7,
      },
      variants: {
        orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
        include: { inventory: true },
      },
      primaryCategory: true,
      fandom: true,
      brand: true,
      categories: { include: { category: true } },
    },
  });
}

export function availableStock(product: ProductCardRecord) {
  return product.variants.reduce((sum, variant) => {
    const onHand = variant.inventory.reduce((s, row) => s + Math.max(0, row.onHand - row.reserved), 0);
    return sum + onHand;
  }, 0);
}
