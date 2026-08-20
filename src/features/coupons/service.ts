import { CouponType, PaymentStatus, type Coupon } from "@/generated/prisma";
import {
  calculateCartTotals,
  getOrCreateCart,
  type CartRecord,
} from "@/features/cart/service";
import { prisma } from "@/lib/db/prisma";
import { toMinorUnits } from "@/lib/money";

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function cartSubtotal(cart: CartRecord) {
  return calculateCartTotals(cart).subtotalAmount;
}

export async function assertCouponApplicable(
  coupon: Coupon,
  subtotalAmount: number,
  customerEmail?: string | null,
) {
  if (!coupon.isActive) throw new Error("couponInactive");

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new Error("couponNotStarted");
  if (coupon.endsAt && coupon.endsAt < now) throw new Error("couponExpired");
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    throw new Error("couponUsageLimit");
  }
  if (coupon.minOrderAmount != null && subtotalAmount < coupon.minOrderAmount) {
    throw new Error("couponMinOrder");
  }

  if (coupon.type === CouponType.FIRST_ORDER) {
    const email = customerEmail?.trim().toLowerCase();
    if (!email) throw new Error("couponFirstOrderEmail");
    const prior = await prisma.order.count({
      where: {
        customerEmail: { equals: email, mode: "insensitive" },
        paymentStatus: PaymentStatus.PAID,
      },
    });
    if (prior > 0) throw new Error("couponFirstOrderOnly");
  }

  if (coupon.type === CouponType.PERCENTAGE && !coupon.percentOff) {
    throw new Error("couponInvalid");
  }
  if (
    (coupon.type === CouponType.FIXED_AMOUNT || coupon.type === CouponType.FIRST_ORDER) &&
    coupon.amountOff == null &&
    coupon.percentOff == null
  ) {
    throw new Error("couponInvalid");
  }
}

export async function applyCouponToCart(code: string, customerEmail?: string | null) {
  const normalized = normalizeCode(code);
  if (!normalized) throw new Error("couponEmpty");

  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  if (!coupon) throw new Error("couponNotFound");

  const cart = await getOrCreateCart();
  if (cart.items.length === 0) throw new Error("cartEmpty");

  await assertCouponApplicable(coupon, cartSubtotal(cart), customerEmail);

  await prisma.$transaction([
    prisma.cartCoupon.deleteMany({ where: { cartId: cart.id } }),
    prisma.cartCoupon.create({
      data: { cartId: cart.id, couponId: coupon.id },
    }),
  ]);

  return getOrCreateCart();
}

export async function removeCartCoupon() {
  const cart = await getOrCreateCart();
  await prisma.cartCoupon.deleteMany({ where: { cartId: cart.id } });
  return getOrCreateCart();
}

export async function incrementCouponUsage(code: string | null | undefined) {
  if (!code) return;
  const normalized = normalizeCode(code);
  await prisma.coupon.updateMany({
    where: { code: normalized },
    data: { usageCount: { increment: 1 } },
  });
}

export async function listCoupons() {
  return prisma.coupon.findMany({
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getCouponById(id: string) {
  return prisma.coupon.findUnique({ where: { id } });
}

export type CouponAdminInput = {
  code: string;
  type: CouponType;
  percentOff?: number | null;
  amountOffUah?: number | null;
  minOrderUah?: number | null;
  usageLimit?: number | null;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

export async function createCoupon(input: CouponAdminInput) {
  const code = normalizeCode(input.code);
  if (!code) throw new Error("couponEmpty");

  return prisma.coupon.create({
    data: {
      code,
      type: input.type,
      percentOff: input.percentOff ?? null,
      amountOff:
        input.amountOffUah != null && input.amountOffUah > 0
          ? toMinorUnits(input.amountOffUah)
          : null,
      minOrderAmount:
        input.minOrderUah != null && input.minOrderUah > 0
          ? toMinorUnits(input.minOrderUah)
          : null,
      usageLimit: input.usageLimit ?? null,
      isActive: input.isActive,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
    },
  });
}

export async function updateCoupon(id: string, input: CouponAdminInput) {
  const code = normalizeCode(input.code);
  if (!code) throw new Error("couponEmpty");

  return prisma.coupon.update({
    where: { id },
    data: {
      code,
      type: input.type,
      percentOff: input.percentOff ?? null,
      amountOff:
        input.amountOffUah != null && input.amountOffUah > 0
          ? toMinorUnits(input.amountOffUah)
          : null,
      minOrderAmount:
        input.minOrderUah != null && input.minOrderUah > 0
          ? toMinorUnits(input.minOrderUah)
          : null,
      usageLimit: input.usageLimit ?? null,
      isActive: input.isActive,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
    },
  });
}

export async function toggleCouponActive(id: string, isActive: boolean) {
  return prisma.coupon.update({
    where: { id },
    data: { isActive },
  });
}
