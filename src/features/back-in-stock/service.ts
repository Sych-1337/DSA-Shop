import { ProductStatus } from "@/generated/prisma";
import { sendBackInStockEmail } from "@/features/back-in-stock/emails";
import { backInStockSubscribeSchema } from "@/features/back-in-stock/schema";
import { prisma } from "@/lib/db/prisma";

function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function availableForVariant(inventory: { onHand: number; reserved: number }[]) {
  return inventory.reduce((sum, row) => sum + Math.max(0, row.onHand - row.reserved), 0);
}

export async function subscribeBackInStock(input: {
  email: string;
  productId: string;
  variantId: string;
  locale?: string;
}) {
  const parsed = backInStockSubscribeSchema.safeParse(input);
  if (!parsed.success) throw new Error("INVALID_EMAIL");

  const variant = await prisma.productVariant.findFirst({
    where: {
      id: parsed.data.variantId,
      productId: parsed.data.productId,
      isActive: true,
      product: { status: ProductStatus.PUBLISHED, archivedAt: null },
    },
    include: { inventory: true },
  });
  if (!variant) throw new Error("PRODUCT_UNAVAILABLE");

  if (availableForVariant(variant.inventory) > 0) {
    throw new Error("ALREADY_IN_STOCK");
  }

  await prisma.backInStockSubscription.upsert({
    where: {
      email_variantId: {
        email: parsed.data.email.toLowerCase(),
        variantId: parsed.data.variantId,
      },
    },
    create: {
      email: parsed.data.email.toLowerCase(),
      productId: parsed.data.productId,
      variantId: parsed.data.variantId,
      locale: parsed.data.locale,
      notifiedAt: null,
    },
    update: {
      locale: parsed.data.locale,
      notifiedAt: null,
    },
  });
}

/** Notify pending subscribers when the variant has available stock. */
export async function maybeNotifyBackInStock(variantId: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      inventory: true,
      product: { select: { title: true, slug: true, status: true, archivedAt: true } },
    },
  });
  if (!variant || !variant.product || variant.product.archivedAt) return 0;
  if (variant.product.status !== ProductStatus.PUBLISHED) return 0;
  if (availableForVariant(variant.inventory) <= 0) return 0;

  const pending = await prisma.backInStockSubscription.findMany({
    where: { variantId, notifiedAt: null },
    take: 200,
  });
  if (pending.length === 0) return 0;

  const productUrl = `${siteOrigin()}/uk/product/${variant.product.slug}`;
  let sent = 0;

  for (const sub of pending) {
    try {
      await sendBackInStockEmail({
        to: sub.email,
        productTitle: variant.product.title,
        variantTitle: variant.title,
        productUrl,
      });
      await prisma.backInStockSubscription.update({
        where: { id: sub.id },
        data: { notifiedAt: new Date() },
      });
      sent += 1;
    } catch (error) {
      console.error("[back-in-stock] notify failed", sub.id, error);
    }
  }

  return sent;
}

export async function notifyBackInStockForProduct(productId: string) {
  const variants = await prisma.productVariant.findMany({
    where: { productId, isActive: true },
    select: { id: true },
  });
  let total = 0;
  for (const variant of variants) {
    total += await maybeNotifyBackInStock(variant.id);
  }
  return total;
}

export async function listBackInStockSubscriptions(params?: {
  pendingOnly?: boolean;
  take?: number;
}) {
  return prisma.backInStockSubscription.findMany({
    where: params?.pendingOnly ? { notifiedAt: null } : undefined,
    orderBy: { createdAt: "desc" },
    take: Math.min(200, params?.take ?? 100),
    include: {
      product: { select: { id: true, title: true, slug: true } },
      variant: { select: { id: true, title: true, sku: true } },
    },
  });
}
