import { randomBytes } from "crypto";

import { ProductStatus } from "@/generated/prisma";
import { resolveCustomerIdentity, type CustomerIdentity } from "@/features/account/service";
import { addToCart } from "@/features/cart/service";
import { productCardInclude, type ProductCardRecord } from "@/features/catalog/service";
import { MAX_WISHLISTS, wishlistNameSchema } from "@/features/wishlist/schema";
import { prisma } from "@/lib/db/prisma";

function ownerWhere(identity: CustomerIdentity) {
  return identity.kind === "user"
    ? { userId: identity.userId }
    : { anonymousToken: identity.anonymousToken };
}

async function requireIdentity() {
  const identity = await resolveCustomerIdentity(true);
  if (!identity) throw new Error("IDENTITY_REQUIRED");
  return identity;
}

export type WishlistListSummary = {
  id: string;
  name: string;
  isDefault: boolean;
  itemCount: number;
  isPublic: boolean;
  shareToken: string | null;
};

function variantAvailable(inventory: { onHand: number; reserved: number }[]) {
  return inventory.reduce((sum, row) => sum + Math.max(0, row.onHand - row.reserved), 0);
}

function pickInStockVariant(product: ProductCardRecord) {
  const active = product.variants.filter((v) => v.isActive);
  const withStock = active.find((v) => variantAvailable(v.inventory) > 0);
  return withStock ?? null;
}

export async function listWishlists(): Promise<WishlistListSummary[]> {
  const identity = await resolveCustomerIdentity(false);
  if (!identity) return [];

  const lists = await prisma.wishlistList.findMany({
    where: ownerWhere(identity),
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { items: true } } },
  });

  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    isDefault: list.isDefault,
    itemCount: list._count.items,
    isPublic: list.isPublic,
    shareToken: list.shareToken,
  }));
}

export async function ensureDefaultWishlist(
  identity?: CustomerIdentity,
  defaultName = "Обране",
) {
  const owner = identity ?? (await requireIdentity());
  const existing = await prisma.wishlistList.findFirst({
    where: { ...ownerWhere(owner), isDefault: true },
  });
  if (existing) return existing;

  const anyList = await prisma.wishlistList.findFirst({
    where: ownerWhere(owner),
    orderBy: { createdAt: "asc" },
  });
  if (anyList) {
    return prisma.wishlistList.update({
      where: { id: anyList.id },
      data: { isDefault: true },
    });
  }

  return prisma.wishlistList.create({
    data: {
      ...ownerWhere(owner),
      name: defaultName,
      isDefault: true,
      sortOrder: 0,
    },
  });
}

export async function createWishlist(name: string, defaultName = "Обране") {
  const parsed = wishlistNameSchema.safeParse(name);
  if (!parsed.success) throw new Error("LIST_NAME_INVALID");

  const identity = await requireIdentity();
  await ensureDefaultWishlist(identity, defaultName);

  const count = await prisma.wishlistList.count({ where: ownerWhere(identity) });
  if (count >= MAX_WISHLISTS) throw new Error("LIST_LIMIT");

  return prisma.wishlistList.create({
    data: {
      ...ownerWhere(identity),
      name: parsed.data,
      isDefault: false,
      sortOrder: count,
    },
  });
}

export async function renameWishlist(listId: string, name: string) {
  const parsed = wishlistNameSchema.safeParse(name);
  if (!parsed.success) throw new Error("LIST_NAME_INVALID");

  const identity = await requireIdentity();
  const list = await prisma.wishlistList.findFirst({
    where: { id: listId, ...ownerWhere(identity) },
  });
  if (!list) throw new Error("LIST_NOT_FOUND");

  return prisma.wishlistList.update({
    where: { id: list.id },
    data: { name: parsed.data },
  });
}

export async function deleteWishlist(listId: string) {
  const identity = await requireIdentity();
  const list = await prisma.wishlistList.findFirst({
    where: { id: listId, ...ownerWhere(identity) },
  });
  if (!list) throw new Error("LIST_NOT_FOUND");

  const count = await prisma.wishlistList.count({ where: ownerWhere(identity) });
  if (count <= 1) throw new Error("LIST_LAST");

  await prisma.wishlistList.delete({ where: { id: list.id } });

  if (list.isDefault) {
    const next = await prisma.wishlistList.findFirst({
      where: ownerWhere(identity),
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.wishlistList.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }
}

export async function setDefaultWishlist(listId: string) {
  const identity = await requireIdentity();
  const list = await prisma.wishlistList.findFirst({
    where: { id: listId, ...ownerWhere(identity) },
  });
  if (!list) throw new Error("LIST_NOT_FOUND");

  await prisma.$transaction([
    prisma.wishlistList.updateMany({
      where: ownerWhere(identity),
      data: { isDefault: false },
    }),
    prisma.wishlistList.update({
      where: { id: list.id },
      data: { isDefault: true },
    }),
  ]);
}

async function getOwnedList(listId: string, identity: CustomerIdentity) {
  return prisma.wishlistList.findFirst({
    where: { id: listId, ...ownerWhere(identity) },
  });
}

export async function toggleWishlistProduct(
  productId: string,
  listId?: string | null,
  defaultName = "Обране",
) {
  const identity = await requireIdentity();
  const product = await prisma.product.findFirst({
    where: { id: productId, status: ProductStatus.PUBLISHED, archivedAt: null },
    select: { id: true },
  });
  if (!product) throw new Error("PRODUCT_UNAVAILABLE");

  const list = listId
    ? await getOwnedList(listId, identity)
    : await ensureDefaultWishlist(identity, defaultName);

  if (!list) throw new Error("LIST_NOT_FOUND");

  const existing = await prisma.wishlistItem.findUnique({
    where: { listId_productId: { listId: list.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return { added: false as const, listId: list.id };
  }

  await prisma.wishlistItem.create({
    data: { listId: list.id, productId },
  });
  return { added: true as const, listId: list.id };
}

export async function removeWishlistItem(itemId: string) {
  const identity = await requireIdentity();
  const item = await prisma.wishlistItem.findFirst({
    where: {
      id: itemId,
      list: ownerWhere(identity),
    },
  });
  if (!item) throw new Error("ITEM_NOT_FOUND");
  await prisma.wishlistItem.delete({ where: { id: item.id } });
}

export async function getWishlistView(listId?: string | null): Promise<{
  lists: WishlistListSummary[];
  activeList: WishlistListSummary | null;
  products: Array<ProductCardRecord & { wishlistItemId: string }>;
}> {
  const lists = await listWishlists();
  if (lists.length === 0) {
    return { lists: [], activeList: null, products: [] };
  }

  const active =
    (listId ? lists.find((list) => list.id === listId) : null) ??
    lists.find((list) => list.isDefault) ??
    lists[0]!;

  const items = await prisma.wishlistItem.findMany({
    where: { listId: active.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: { include: productCardInclude },
    },
  });

  const products = items
    .filter((item) => item.product.status === ProductStatus.PUBLISHED && !item.product.archivedAt)
    .map((item) => ({ ...item.product, wishlistItemId: item.id }));

  return { lists, activeList: active, products };
}

export async function productInDefaultWishlist(productId: string): Promise<boolean> {
  const identity = await resolveCustomerIdentity(false);
  if (!identity) return false;

  const defaultList = await prisma.wishlistList.findFirst({
    where: { ...ownerWhere(identity), isDefault: true },
    select: { id: true },
  });
  if (!defaultList) return false;

  const item = await prisma.wishlistItem.findUnique({
    where: {
      listId_productId: { listId: defaultList.id, productId },
    },
    select: { id: true },
  });
  return Boolean(item);
}

export async function productWishlistMembership(productId: string) {
  const identity = await resolveCustomerIdentity(false);
  if (!identity) return [] as string[];

  const items = await prisma.wishlistItem.findMany({
    where: {
      productId,
      list: ownerWhere(identity),
    },
    select: { listId: true },
  });
  return items.map((item) => item.listId);
}

export async function setWishlistShare(listId: string, enabled: boolean) {
  const identity = await requireIdentity();
  const list = await getOwnedList(listId, identity);
  if (!list) throw new Error("LIST_NOT_FOUND");

  if (!enabled) {
    return prisma.wishlistList.update({
      where: { id: list.id },
      data: { isPublic: false },
    });
  }

  const shareToken = list.shareToken ?? randomBytes(12).toString("hex");
  return prisma.wishlistList.update({
    where: { id: list.id },
    data: { isPublic: true, shareToken },
  });
}

export async function getPublicWishlist(token: string): Promise<{
  name: string;
  products: ProductCardRecord[];
} | null> {
  const normalized = token.trim();
  if (!normalized) return null;

  const list = await prisma.wishlistList.findFirst({
    where: { shareToken: normalized, isPublic: true },
    select: { id: true, name: true },
  });
  if (!list) return null;

  const items = await prisma.wishlistItem.findMany({
    where: { listId: list.id },
    orderBy: { createdAt: "desc" },
    include: { product: { include: productCardInclude } },
  });

  const products = items
    .filter((item) => item.product.status === ProductStatus.PUBLISHED && !item.product.archivedAt)
    .map((item) => item.product);

  return { name: list.name, products };
}

export async function addWishlistToCart(listId?: string | null): Promise<{
  added: number;
  skipped: number;
}> {
  const view = await getWishlistView(listId);
  if (!view.activeList) throw new Error("LIST_NOT_FOUND");
  if (view.products.length === 0) return { added: 0, skipped: 0 };

  let added = 0;
  let skipped = 0;

  for (const product of view.products) {
    const variant = pickInStockVariant(product);
    if (!variant) {
      skipped += 1;
      continue;
    }
    try {
      await addToCart(variant.id, 1);
      added += 1;
    } catch {
      skipped += 1;
    }
  }

  return { added, skipped };
}
