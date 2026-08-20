import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { ensureCartToken, getCartToken } from "@/features/cart/cookie";
import { addMoney } from "@/lib/money";

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: {
                where: { deletedAt: null },
                orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
                take: 1,
              },
            },
          },
          inventory: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  coupons: { include: { coupon: true } },
} satisfies Prisma.CartInclude;

export type CartRecord = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

function availableForVariant(inventory: { onHand: number; reserved: number }[]) {
  return inventory.reduce((sum, row) => sum + Math.max(0, row.onHand - row.reserved), 0);
}

async function findCartByToken(token: string) {
  return prisma.cart.findUnique({
    where: { anonymousToken: token },
    include: cartInclude,
  });
}

/** Safe for Server Components — does not set cookies. */
export async function getCartIfExists() {
  const token = await getCartToken();
  if (!token) return null;
  return findCartByToken(token);
}

/** Call only from Server Actions / mutations. */
export async function getOrCreateCart() {
  const token = await ensureCartToken();
  let cart = await findCartByToken(token);

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        anonymousToken: token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
      include: cartInclude,
    });
  }

  return cart;
}

export async function getCartSummary() {
  const cart = await getCartIfExists();
  if (!cart) {
    return { itemCount: 0, subtotalAmount: 0, cart: null };
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalAmount = cart.items.reduce(
    (sum, item) => addMoney(sum, item.variant.priceAmount * item.quantity),
    0,
  );

  return { itemCount, subtotalAmount, cart };
}

export async function addToCart(variantId: string, quantity = 1) {
  if (quantity < 1) throw new Error("Quantity must be at least 1");

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, isActive: true, product: { status: "PUBLISHED", archivedAt: null } },
    include: { inventory: true },
  });
  if (!variant) throw new Error("productUnavailable");

  const available = availableForVariant(variant.inventory);
  if (available < quantity) throw new Error("insufficientStock");

  const cart = await getOrCreateCart();
  const existing = cart.items.find((item) => item.variantId === variantId);
  const nextQty = (existing?.quantity ?? 0) + quantity;
  if (nextQty > available) throw new Error("insufficientStock");

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQty },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, variantId, quantity },
    });
  }

  return getOrCreateCart();
}

export async function updateCartItem(itemId: string, quantity: number) {
  const cart = await getOrCreateCart();
  const item = cart.items.find((row) => row.id === itemId);
  if (!item) throw new Error("itemNotFound");

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return getOrCreateCart();
  }

  const available = availableForVariant(item.variant.inventory);
  if (quantity > available) throw new Error("insufficientStock");

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  return getOrCreateCart();
}

export async function removeCartItem(itemId: string) {
  const cart = await getOrCreateCart();
  const item = cart.items.find((row) => row.id === itemId);
  if (!item) throw new Error("itemNotFound");
  await prisma.cartItem.delete({ where: { id: itemId } });
  return getOrCreateCart();
}

export async function clearCart(cartId: string) {
  await prisma.cartItem.deleteMany({ where: { cartId } });
  await prisma.cartCoupon.deleteMany({ where: { cartId } });
}

/** Put order lines back into the guest cart (e.g. after unpaid cancel / decline). */
export async function restoreCartFromOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order?.items.length) return null;

  const cart = await getOrCreateCart();
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  for (const item of order.items) {
    if (!item.variantId) continue;
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: item.variantId,
        quantity: item.quantity,
      },
    });
  }

  return getOrCreateCart();
}

export function calculateCartTotals(cart: CartRecord) {
  const subtotalAmount = cart.items.reduce(
    (sum, item) => addMoney(sum, item.variant.priceAmount * item.quantity),
    0,
  );

  let discountAmount = 0;
  const coupon = cart.coupons[0]?.coupon;
  if (coupon?.isActive) {
    if (
      (coupon.type === "PERCENTAGE" || coupon.type === "FIRST_ORDER") &&
      coupon.percentOff != null
    ) {
      discountAmount = Math.round((subtotalAmount * coupon.percentOff) / 100);
    } else if (
      (coupon.type === "FIXED_AMOUNT" || coupon.type === "FIRST_ORDER") &&
      coupon.amountOff != null
    ) {
      discountAmount = Math.min(subtotalAmount, coupon.amountOff);
    }
    // FREE_SHIPPING: goods discount stays 0 — applied at checkout shipping amount
  }

  return {
    subtotalAmount,
    discountAmount,
    couponCode: coupon?.code ?? null,
    couponType: coupon?.type ?? null,
  };
}
