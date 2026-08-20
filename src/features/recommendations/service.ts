import { getCustomerToken } from "@/features/account/cookie";
import { resolveCustomerIdentity } from "@/features/account/service";
import { getCartToken } from "@/features/cart/cookie";
import { getCartIfExists } from "@/features/cart/service";
import {
  availableStock,
  productCardInclude,
  type ProductCardRecord,
} from "@/features/catalog/service";
import { InterestSignal, ProductStatus } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";

const SIGNAL_WEIGHT: Record<InterestSignal, number> = {
  VIEW: 1,
  CART: 5,
  WISHLIST: 6,
  PURCHASE: 10,
};

const MAX_CANDIDATES = 72;
const HALF_LIFE_DAYS = 12;

/** Safe in RSC when createGuest=false (never sets cookies). */
export async function resolveShopperKey(createGuest = false): Promise<string | null> {
  const identity = await resolveCustomerIdentity(createGuest);
  if (identity) {
    return identity.kind === "user"
      ? `user:${identity.userId}`
      : `guest:${identity.anonymousToken}`;
  }

  const [customerToken, cartToken] = await Promise.all([getCustomerToken(), getCartToken()]);
  if (customerToken) return `guest:${customerToken}`;
  if (cartToken) return `cart:${cartToken}`;
  return null;
}

export async function recordProductInterest(
  productId: string,
  signal: InterestSignal,
  options?: { createGuest?: boolean },
) {
  const shopperKey = await resolveShopperKey(options?.createGuest ?? false);
  if (!shopperKey) return;

  const bump = SIGNAL_WEIGHT[signal] ?? 1;
  await prisma.productInterest.upsert({
    where: {
      shopperKey_productId_signal: { shopperKey, productId, signal },
    },
    create: {
      shopperKey,
      productId,
      signal,
      weight: bump,
    },
    update: {
      weight: { increment: bump },
    },
  });
}

export async function recordPurchaseInterests(productIds: string[]) {
  const unique = [...new Set(productIds.filter(Boolean))];
  await Promise.all(
    unique.map((productId) =>
      recordProductInterest(productId, InterestSignal.PURCHASE, { createGuest: true }),
    ),
  );
}

function shopperSeed(shopperKey: string) {
  const bucket = Math.floor(Date.now() / (1000 * 60 * 60 * 2));
  const raw = `${shopperKey}:${bucket}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

function seededUnit(seed: number, salt: string) {
  let hash = seed;
  for (let i = 0; i < salt.length; i += 1) {
    hash = Math.imul(hash ^ salt.charCodeAt(i), 16777619);
  }
  return ((hash >>> 0) % 10_000) / 10_000;
}

function decayFactor(updatedAt: Date) {
  const days = Math.max(0, (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
  return Math.pow(0.5, days / HALF_LIFE_DAYS);
}

type AffinityMaps = {
  fandomScores: Map<string, number>;
  categoryScores: Map<string, number>;
  brandScores: Map<string, number>;
  priceSamples: number[];
  interactedIds: Set<string>;
  strongIds: Set<string>;
};

async function loadAffinity(shopperKey: string | null): Promise<AffinityMaps> {
  const empty: AffinityMaps = {
    fandomScores: new Map(),
    categoryScores: new Map(),
    brandScores: new Map(),
    priceSamples: [],
    interactedIds: new Set(),
    strongIds: new Set(),
  };
  if (!shopperKey) return empty;

  const interests = await prisma.productInterest.findMany({
    where: { shopperKey },
    orderBy: { updatedAt: "desc" },
    take: 60,
    include: {
      product: {
        select: {
          id: true,
          fandomId: true,
          primaryCategoryId: true,
          brandId: true,
          priceAmount: true,
        },
      },
    },
  });

  for (const row of interests) {
    empty.interactedIds.add(row.productId);
    if (row.signal === InterestSignal.CART || row.signal === InterestSignal.WISHLIST || row.signal === InterestSignal.PURCHASE) {
      empty.strongIds.add(row.productId);
    }
    const score = row.weight * decayFactor(row.updatedAt);
    if (row.product.fandomId) {
      empty.fandomScores.set(
        row.product.fandomId,
        (empty.fandomScores.get(row.product.fandomId) ?? 0) + score,
      );
    }
    if (row.product.primaryCategoryId) {
      empty.categoryScores.set(
        row.product.primaryCategoryId,
        (empty.categoryScores.get(row.product.primaryCategoryId) ?? 0) + score,
      );
    }
    if (row.product.brandId) {
      empty.brandScores.set(
        row.product.brandId,
        (empty.brandScores.get(row.product.brandId) ?? 0) + score,
      );
    }
    empty.priceSamples.push(row.product.priceAmount);
  }

  return empty;
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

function scoreProduct(
  product: ProductCardRecord,
  affinity: AffinityMaps,
  seed: number,
  opts?: { excludeInteractedSoft?: boolean },
) {
  let score = 0;
  score += Math.min(product.salesCount, 50) * 0.9;
  if (product.isFeatured) score += 14;
  if (product.isNew) score += 10;
  if (product.averageRating != null) {
    score += Number(product.averageRating) * 5 + Math.min(product.reviewCount, 20) * 0.4;
  }

  const stock = availableStock(product);
  if (stock <= 0) score -= 40;
  else if (stock <= 3) score += 6;
  else score += 3;

  if (product.fandomId) score += (affinity.fandomScores.get(product.fandomId) ?? 0) * 3.4;
  if (product.primaryCategoryId) {
    score += (affinity.categoryScores.get(product.primaryCategoryId) ?? 0) * 2.4;
  }
  if (product.brandId) score += (affinity.brandScores.get(product.brandId) ?? 0) * 1.6;

  const priceCenter = median(affinity.priceSamples);
  if (priceCenter != null && priceCenter > 0) {
    const ratio = product.priceAmount / priceCenter;
    if (ratio >= 0.55 && ratio <= 1.7) score += 10;
    else if (ratio >= 0.35 && ratio <= 2.4) score += 4;
    else score -= 6;
  }

  if (affinity.strongIds.has(product.id)) score -= 45;
  else if (affinity.interactedIds.has(product.id) && opts?.excludeInteractedSoft !== false) {
    score -= 22;
  }

  score += seededUnit(seed, product.id) * 20;
  return score;
}

function pickDiverse(
  scored: Array<{ product: ProductCardRecord; score: number }>,
  limit: number,
) {
  const picked: ProductCardRecord[] = [];
  const fandomCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const row of scored) {
    if (picked.length >= limit) break;
    const fandomId = row.product.fandomId ?? `f:${row.product.id}`;
    const categoryId = row.product.primaryCategoryId ?? `c:${row.product.id}`;
    if ((fandomCounts.get(fandomId) ?? 0) >= 2) continue;
    if ((categoryCounts.get(categoryId) ?? 0) >= 2) continue;
    picked.push(row.product);
    fandomCounts.set(fandomId, (fandomCounts.get(fandomId) ?? 0) + 1);
    categoryCounts.set(categoryId, (categoryCounts.get(categoryId) ?? 0) + 1);
  }

  if (picked.length < limit) {
    for (const row of scored) {
      if (picked.length >= limit) break;
      if (picked.some((p) => p.id === row.product.id)) continue;
      picked.push(row.product);
    }
  }

  return picked;
}

export async function listPersonalizedProducts(limit = 8): Promise<{
  products: ProductCardRecord[];
  personalized: boolean;
  listId: string;
}> {
  const shopperKey = await resolveShopperKey(false);
  const seed = shopperSeed(shopperKey ?? "anon");
  const affinity = await loadAffinity(shopperKey);

  const cart = await getCartIfExists();
  const cartProductIds = [
    ...new Set(
      (cart?.items ?? [])
        .map((item) => item.variant.productId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const excludeIds = [...new Set([...cartProductIds, ...affinity.strongIds])];

  const preferredFandoms = [...affinity.fandomScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id]) => id);
  const preferredCategories = [...affinity.categoryScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id]) => id);

  const whereBase = {
    status: ProductStatus.PUBLISHED,
    archivedAt: null,
    ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
  } as const;

  const [affinityPool, popularPool, freshPool] = await Promise.all([
    preferredFandoms.length || preferredCategories.length
      ? prisma.product.findMany({
          where: {
            ...whereBase,
            OR: [
              ...(preferredFandoms.length
                ? [{ fandomId: { in: preferredFandoms } }]
                : []),
              ...(preferredCategories.length
                ? [{ primaryCategoryId: { in: preferredCategories } }]
                : []),
            ],
          },
          include: productCardInclude,
          take: 36,
        })
      : Promise.resolve([] as ProductCardRecord[]),
    prisma.product.findMany({
      where: whereBase,
      include: productCardInclude,
      orderBy: [{ salesCount: "desc" }, { publishedAt: "desc" }],
      take: MAX_CANDIDATES,
    }),
    prisma.product.findMany({
      where: { ...whereBase, isNew: true },
      include: productCardInclude,
      orderBy: [{ publishedAt: "desc" }],
      take: 16,
    }),
  ]);

  const byId = new Map<string, ProductCardRecord>();
  for (const product of [...affinityPool, ...popularPool, ...freshPool]) {
    byId.set(product.id, product);
  }

  const scored = [...byId.values()]
    .map((product) => ({
      product,
      score: scoreProduct(product, affinity, seed),
    }))
    .sort((a, b) => b.score - a.score);

  // Exploration slot: inject one fresh item into top selection when personalized
  let picked = pickDiverse(scored, limit);
  if (affinity.interactedIds.size > 0 && freshPool.length > 0 && picked.length >= 2) {
    const explorer =
      freshPool.find((p) => !picked.some((x) => x.id === p.id) && !excludeIds.includes(p.id)) ??
      null;
    if (explorer) {
      picked = [...picked.slice(0, limit - 1), explorer];
    }
  }

  return {
    products: picked.slice(0, limit),
    personalized: affinity.interactedIds.size > 0,
    listId: "for_you",
  };
}

/** Recently viewed rail — ProductInterest VIEW signals for current shopper. */
export async function listRecentlyViewed(limit = 8): Promise<ProductCardRecord[]> {
  const shopperKey = await resolveShopperKey(false);
  if (!shopperKey) return [];

  const views = await prisma.productInterest.findMany({
    where: { shopperKey, signal: InterestSignal.VIEW },
    orderBy: { updatedAt: "desc" },
    take: limit * 2,
    select: { productId: true },
  });
  if (views.length === 0) return [];

  const ids = [...new Set(views.map((row) => row.productId))];
  const products = await prisma.product.findMany({
    where: {
      id: { in: ids },
      status: ProductStatus.PUBLISHED,
      archivedAt: null,
    },
    include: productCardInclude,
  });

  const byId = new Map(products.map((product) => [product.id, product]));
  return ids.map((id) => byId.get(id)).filter((row): row is ProductCardRecord => Boolean(row)).slice(0, limit);
}

/** PDP / cart companions — same affinity engine anchored to a seed product. */
export async function listRelatedRecommendations(
  productId: string,
  limit = 4,
): Promise<ProductCardRecord[]> {
  const seedProduct = await prisma.product.findFirst({
    where: { id: productId, status: ProductStatus.PUBLISHED, archivedAt: null },
    select: {
      id: true,
      fandomId: true,
      primaryCategoryId: true,
      brandId: true,
      priceAmount: true,
    },
  });
  if (!seedProduct) return [];

  const shopperKey = await resolveShopperKey(false);
  const affinity = await loadAffinity(shopperKey);
  if (seedProduct.fandomId) {
    affinity.fandomScores.set(
      seedProduct.fandomId,
      (affinity.fandomScores.get(seedProduct.fandomId) ?? 0) + 12,
    );
  }
  if (seedProduct.primaryCategoryId) {
    affinity.categoryScores.set(
      seedProduct.primaryCategoryId,
      (affinity.categoryScores.get(seedProduct.primaryCategoryId) ?? 0) + 10,
    );
  }
  if (seedProduct.brandId) {
    affinity.brandScores.set(
      seedProduct.brandId,
      (affinity.brandScores.get(seedProduct.brandId) ?? 0) + 6,
    );
  }
  affinity.priceSamples.push(seedProduct.priceAmount);
  affinity.interactedIds.add(seedProduct.id);
  affinity.strongIds.add(seedProduct.id);

  const orFilters: Array<{
    fandomId?: string;
    primaryCategoryId?: string;
    brandId?: string;
  }> = [];
  if (seedProduct.fandomId) orFilters.push({ fandomId: seedProduct.fandomId });
  if (seedProduct.primaryCategoryId) {
    orFilters.push({ primaryCategoryId: seedProduct.primaryCategoryId });
  }
  if (seedProduct.brandId) orFilters.push({ brandId: seedProduct.brandId });

  const candidates = await prisma.product.findMany({
    where: {
      status: ProductStatus.PUBLISHED,
      archivedAt: null,
      id: { not: seedProduct.id },
      ...(orFilters.length > 0 ? { OR: orFilters } : {}),
    },
    include: productCardInclude,
    orderBy: [{ salesCount: "desc" }],
    take: 40,
  });

  const seed = shopperSeed(`${shopperKey ?? "anon"}:related:${productId}`);
  const scored = candidates
    .map((product) => ({
      product,
      score: scoreProduct(product, affinity, seed, { excludeInteractedSoft: true }),
    }))
    .sort((a, b) => b.score - a.score);

  return pickDiverse(scored, limit);
}
