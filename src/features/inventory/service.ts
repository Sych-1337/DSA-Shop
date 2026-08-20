import { StockMovementType, type Prisma } from "@/generated/prisma";
import { maybeNotifyBackInStock } from "@/features/back-in-stock/service";
import { prisma } from "@/lib/db/prisma";

export type InventoryListParams = {
  q?: string;
  warehouseId?: string;
  lowStockOnly?: boolean;
  page?: number;
  pageSize?: number;
};

export type InventoryRow = {
  inventoryItemId: string;
  warehouseId: string;
  warehouseName: string;
  variantId: string;
  sku: string;
  variantTitle: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  onHand: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  version: number;
  priceAmount: number;
  costPriceAmount: number | null;
  marginPercent: number | null;
  isLowStock: boolean;
};

export function computeMarginPercent(
  priceAmount: number,
  costPriceAmount: number | null | undefined,
): number | null {
  if (costPriceAmount == null || priceAmount <= 0) return null;
  return Math.round(((priceAmount - costPriceAmount) / priceAmount) * 1000) / 10;
}

export async function getDefaultWarehouse() {
  const warehouse =
    (await prisma.warehouse.findFirst({ where: { isDefault: true } })) ??
    (await prisma.warehouse.findFirst());
  if (!warehouse) {
    throw new Error("Немає складу. Створіть склад у seed/налаштуваннях.");
  }
  return warehouse;
}

/** Ensure every active variant has an inventory row on the given warehouse. */
export async function ensureInventoryRows(warehouseId: string) {
  const missing = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      inventory: { none: { warehouseId } },
    },
    select: { id: true },
  });
  if (missing.length === 0) return;
  await prisma.inventoryItem.createMany({
    data: missing.map((v) => ({
      warehouseId,
      variantId: v.id,
      onHand: 0,
    })),
    skipDuplicates: true,
  });
}

export async function listWarehouses() {
  return prisma.warehouse.findMany({ orderBy: [{ isDefault: "desc" }, { name: "asc" }] });
}

export async function listInventoryRows(params: InventoryListParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 40));
  const warehouse =
    params.warehouseId != null
      ? await prisma.warehouse.findUnique({ where: { id: params.warehouseId } })
      : await getDefaultWarehouse();
  if (!warehouse) {
    return { rows: [] as InventoryRow[], total: 0, page, pageSize, warehouse: null };
  }

  await ensureInventoryRows(warehouse.id);

  const q = params.q?.trim();
  const where: Prisma.InventoryItemWhereInput = {
    warehouseId: warehouse.id,
    variant: {
      isActive: true,
      ...(q
        ? {
            OR: [
              { sku: { contains: q, mode: "insensitive" } },
              { title: { contains: q, mode: "insensitive" } },
              { product: { title: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
  };

  // Column vs column (onHand <= reorderPoint) isn't portable in Prisma — filter in memory when needed.
  if (params.lowStockOnly) {
    const all = await prisma.inventoryItem.findMany({
      where,
      include: {
        warehouse: true,
        variant: { include: { product: { select: { id: true, title: true, slug: true } } } },
      },
      orderBy: [{ updatedAt: "desc" }],
    });
    const filtered = all.filter((item) => item.onHand <= item.reorderPoint);
    const total = filtered.length;
    const slice = filtered.slice((page - 1) * pageSize, page * pageSize);
    return {
      rows: slice.map(toRow),
      total,
      page,
      pageSize,
      warehouse,
    };
  }

  const [total, items] = await Promise.all([
    prisma.inventoryItem.count({ where }),
    prisma.inventoryItem.findMany({
      where,
      include: {
        warehouse: true,
        variant: { include: { product: { select: { id: true, title: true, slug: true } } } },
      },
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    rows: items.map(toRow),
    total,
    page,
    pageSize,
    warehouse,
  };
}

function toRow(item: {
  id: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  reorderPoint: number;
  version: number;
  warehouse: { name: string };
  variant: {
    id: string;
    sku: string;
    title: string;
    priceAmount: number;
    costPriceAmount: number | null;
    product: { id: string; title: string; slug: string };
  };
}): InventoryRow {
  const available = item.onHand - item.reserved;
  return {
    inventoryItemId: item.id,
    warehouseId: item.warehouseId,
    warehouseName: item.warehouse.name,
    variantId: item.variant.id,
    sku: item.variant.sku,
    variantTitle: item.variant.title,
    productId: item.variant.product.id,
    productTitle: item.variant.product.title,
    productSlug: item.variant.product.slug,
    onHand: item.onHand,
    reserved: item.reserved,
    available,
    reorderPoint: item.reorderPoint,
    version: item.version,
    priceAmount: item.variant.priceAmount,
    costPriceAmount: item.variant.costPriceAmount,
    marginPercent: computeMarginPercent(item.variant.priceAmount, item.variant.costPriceAmount),
    isLowStock: item.onHand <= item.reorderPoint,
  };
}

export type AdjustStockInput = {
  inventoryItemId: string;
  type: "PURCHASE_RECEIPT" | "WRITE_OFF" | "MANUAL_ADJUSTMENT";
  /** Absolute for receipt/write-off; signed for manual (+/-). */
  quantity: number;
  reason?: string;
  actorId?: string;
  expectedVersion?: number;
};

export async function adjustStock(input: AdjustStockInput) {
  const qty = input.quantity;
  if (!Number.isInteger(qty) || qty === 0) {
    throw new Error("Кількість має бути ненульовим цілим числом");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({
      where: { id: input.inventoryItemId },
    });
    if (!item) throw new Error("Запис складу не знайдено");

    if (input.expectedVersion != null && item.version !== input.expectedVersion) {
      throw new Error("Запис змінено іншим користувачем. Оновіть сторінку.");
    }

    let delta = 0;
    let movementQty = qty;
    let type: StockMovementType;

    if (input.type === "PURCHASE_RECEIPT") {
      if (qty < 0) throw new Error("Прихід має бути додатним");
      delta = qty;
      type = StockMovementType.PURCHASE_RECEIPT;
    } else if (input.type === "WRITE_OFF") {
      if (qty < 0) throw new Error("Списання має бути додатним");
      delta = -qty;
      type = StockMovementType.WRITE_OFF;
    } else {
      delta = qty;
      type = StockMovementType.MANUAL_ADJUSTMENT;
      movementQty = qty; // signed
    }

    const nextOnHand = item.onHand + delta;
    if (nextOnHand < 0) {
      throw new Error("Недостатньо залишку на складі");
    }
    const nextAvailable = nextOnHand - item.reserved;
    if (nextAvailable < 0) {
      throw new Error(
        `Не можна зменшити нижче резерву (резерв: ${item.reserved}, доступно: ${item.onHand - item.reserved})`,
      );
    }

    const next = await tx.inventoryItem.update({
      where: { id: item.id },
      data: {
        onHand: nextOnHand,
        version: { increment: 1 },
      },
    });

    await tx.stockMovement.create({
      data: {
        inventoryItemId: item.id,
        type,
        quantity: movementQty,
        reason: input.reason?.trim() || null,
        actorId: input.actorId && input.actorId !== "bypass" ? input.actorId : null,
        metadata: { delta, previousOnHand: item.onHand, nextOnHand },
      },
    });

    return next;
  });

  if (updated) {
    await maybeNotifyBackInStock(updated.variantId).catch((error) => {
      console.error("[inventory] back-in-stock notify", error);
    });
  }

  return updated;
}

/** Set absolute onHand via a movement (for product form sync). */
export async function setOnHandWithMovement(
  tx: Prisma.TransactionClient,
  input: {
    warehouseId: string;
    variantId: string;
    onHand: number;
    actorId?: string;
    reason?: string;
  },
) {
  const target = Math.max(0, Math.floor(input.onHand));
  let item = await tx.inventoryItem.findUnique({
    where: {
      warehouseId_variantId: {
        warehouseId: input.warehouseId,
        variantId: input.variantId,
      },
    },
  });

  if (!item) {
    item = await tx.inventoryItem.create({
      data: {
        warehouseId: input.warehouseId,
        variantId: input.variantId,
        onHand: 0,
      },
    });
  }

  const delta = target - item.onHand;
  if (delta === 0) return item;

  const nextAvailable = target - item.reserved;
  if (nextAvailable < 0) {
    const floored = item.reserved;
    if (floored === item.onHand) return item;
    const adj = floored - item.onHand;
    await tx.inventoryItem.update({
      where: { id: item.id },
      data: { onHand: floored, version: { increment: 1 } },
    });
    await tx.stockMovement.create({
      data: {
        inventoryItemId: item.id,
        type: StockMovementType.MANUAL_ADJUSTMENT,
        quantity: adj,
        reason: input.reason ?? "Синхронізація з товаром (з урахуванням резерву)",
        actorId: input.actorId && input.actorId !== "bypass" ? input.actorId : null,
        metadata: { floored: true, requested: target },
      },
    });
    return tx.inventoryItem.findUniqueOrThrow({ where: { id: item.id } });
  }

  const type =
    delta > 0
      ? StockMovementType.PURCHASE_RECEIPT
      : target === 0
        ? StockMovementType.WRITE_OFF
        : StockMovementType.MANUAL_ADJUSTMENT;

  const movementQty =
    type === StockMovementType.MANUAL_ADJUSTMENT ? delta : Math.abs(delta);

  await tx.inventoryItem.update({
    where: { id: item.id },
    data: { onHand: target, version: { increment: 1 } },
  });

  await tx.stockMovement.create({
    data: {
      inventoryItemId: item.id,
      type,
      quantity: movementQty,
      reason: input.reason ?? "Синхронізація залишку з картки товару",
      actorId: input.actorId && input.actorId !== "bypass" ? input.actorId : null,
      metadata: { previousOnHand: item.onHand, nextOnHand: target, source: "product_form" },
    },
  });

  return tx.inventoryItem.findUniqueOrThrow({ where: { id: item.id } });
}

export async function updateInventoryMeta(input: {
  inventoryItemId: string;
  costPriceAmount?: number | null;
  reorderPoint?: number;
}) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: input.inventoryItemId },
    include: { variant: true },
  });
  if (!item) throw new Error("Запис складу не знайдено");

  if (input.reorderPoint != null) {
    if (!Number.isInteger(input.reorderPoint) || input.reorderPoint < 0) {
      throw new Error("Поріг reorder має бути ≥ 0");
    }
    await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { reorderPoint: input.reorderPoint },
    });
  }

  if (input.costPriceAmount !== undefined) {
    if (input.costPriceAmount != null) {
      if (!Number.isInteger(input.costPriceAmount) || input.costPriceAmount < 0) {
        throw new Error("Собівартість має бути ≥ 0");
      }
    }
    await prisma.productVariant.update({
      where: { id: item.variantId },
      data: { costPriceAmount: input.costPriceAmount },
    });
  }

  return prisma.inventoryItem.findUniqueOrThrow({
    where: { id: item.id },
    include: {
      warehouse: true,
      variant: { include: { product: { select: { id: true, title: true, slug: true } } } },
    },
  });
}

export async function listStockMovements(inventoryItemId: string, take = 30) {
  return prisma.stockMovement.findMany({
    where: { inventoryItemId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
