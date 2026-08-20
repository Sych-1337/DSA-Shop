import {
  FulfillmentStatus,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingMethod,
  StockMovementType,
} from "@/generated/prisma";
import { FREE_SHIPPING_THRESHOLD, RESERVATION_TTL_MINUTES } from "@/features/cart/cookie";
import {
  calculateCartTotals,
  clearCart,
  getOrCreateCart,
  restoreCartFromOrder,
} from "@/features/cart/service";
import {
  sendOrderCreatedEmail,
  sendOrderPaidEmail,
  sendOrderPaymentFailedEmail,
} from "@/features/checkout/emails";
import { incrementCouponUsage } from "@/features/coupons/service";
import type { CheckoutInput } from "@/features/checkout/schema";
import { getPaymentProvider, getShippingProvider } from "@/lib/providers";
import { addMoney } from "@/lib/money";
import { prisma } from "@/lib/db/prisma";

function nextOrderNumber() {
  const stamp = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `KW-${stamp}-${rand}`;
}

export async function createCheckoutOrder(input: CheckoutInput) {
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { payments: true },
  });
  if (existing) {
    if (existing.paymentStatus === PaymentStatus.PAID) {
      return {
        order: existing,
        redirectUrl: `/checkout/success?order=${existing.orderNumber}`,
        reused: true as const,
      };
    }
    return {
      order: existing,
      redirectUrl:
        existing.payments[0]?.redirectUrl ??
        `/checkout/pay?order=${existing.orderNumber}`,
      reused: true as const,
    };
  }

  const cart = await getOrCreateCart();
  if (cart.items.length === 0) {
    throw new Error("cartEmpty");
  }

  const totals = calculateCartTotals(cart);
  const shipping = await getShippingProvider().quote({
    cityRef: input.city,
    weightGrams: Math.max(
      100,
      cart.items.reduce((sum, item) => sum + item.quantity * 250, 0),
    ),
    subtotalAmount: Math.max(0, totals.subtotalAmount - totals.discountAmount),
    method:
      input.shippingMethod === ShippingMethod.LOCKER
        ? "LOCKER"
        : input.shippingMethod === ShippingMethod.ADDRESS
          ? "ADDRESS"
          : "WAREHOUSE",
  });

  const shippingAmount =
    totals.couponCode && cart.coupons[0]?.coupon.type === "FREE_SHIPPING"
      ? 0
      : shipping.amount;
  const totalAmount = addMoney(
    Math.max(0, totals.subtotalAmount - totals.discountAmount),
    shippingAmount,
  );

  const warehouse = await prisma.warehouse.findFirst({ where: { isDefault: true } });
  if (!warehouse) throw new Error("warehouseMissing");

  const expiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);

  const order = await prisma.$transaction(async (tx) => {
    for (const item of cart.items) {
      const inventory = await tx.inventoryItem.findUnique({
        where: {
          warehouseId_variantId: {
            warehouseId: warehouse.id,
            variantId: item.variantId,
          },
        },
      });
      if (!inventory) throw new Error(`noStockForSku:${item.variant.sku}`);
      const available = inventory.onHand - inventory.reserved;
      if (available < item.quantity) {
        throw new Error(`insufficientStockFor:${item.variant.product.title}`);
      }
    }

    const created = await tx.order.create({
      data: {
        orderNumber: nextOrderNumber(),
        source: OrderSource.WEBSITE,
        status: OrderStatus.NEW,
        paymentStatus: PaymentStatus.PENDING,
        fulfillmentStatus: FulfillmentStatus.NOT_READY,
        customerEmail: input.email,
        customerPhone: input.phone,
        customerFirstName: input.firstName,
        customerLastName: input.lastName,
        currency: "UAH",
        subtotalAmount: totals.subtotalAmount,
        discountAmount: totals.discountAmount,
        shippingAmount,
        totalAmount,
        couponCode: totals.couponCode,
        paymentMethod: PaymentMethod.ONLINE,
        shippingMethod: input.shippingMethod,
        shippingCity: input.city,
        shippingWarehouseRef: input.warehouseRef,
        shippingAddressLine: input.addressLine,
        customerNote: input.customerNote,
        idempotencyKey: input.idempotencyKey,
        address: {
          create: {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            email: input.email,
            city: input.city,
            warehouseRef: input.warehouseRef,
            addressLine: input.addressLine,
            method: input.shippingMethod,
          },
        },
        items: {
          create: cart.items.map((item) => ({
            productId: item.variant.productId,
            variantId: item.variantId,
            productTitle: item.variant.product.title,
            variantTitle: item.variant.title,
            sku: item.variant.sku,
            unitPriceAmount: item.variant.priceAmount,
            compareAtPriceAmount: item.variant.compareAtPriceAmount,
            quantity: item.quantity,
            lineTotalAmount: item.variant.priceAmount * item.quantity,
            imageUrl: item.variant.product.images[0]?.url,
          })),
        },
        statusHistory: {
          create: [
            {
              field: "status",
              oldValue: null,
              newValue: OrderStatus.NEW,
              reason: "Checkout created",
            },
          ],
        },
      },
    });

    for (const item of cart.items) {
      const inventory = await tx.inventoryItem.findUniqueOrThrow({
        where: {
          warehouseId_variantId: {
            warehouseId: warehouse.id,
            variantId: item.variantId,
          },
        },
      });

      await tx.inventoryItem.update({
        where: { id: inventory.id },
        data: {
          reserved: { increment: item.quantity },
          version: { increment: 1 },
        },
      });

      await tx.inventoryReservation.create({
        data: {
          inventoryItemId: inventory.id,
          quantity: item.quantity,
          cartId: cart.id,
          orderId: created.id,
          expiresAt,
        },
      });

      await tx.stockMovement.create({
        data: {
          inventoryItemId: inventory.id,
          type: StockMovementType.RESERVATION,
          quantity: item.quantity,
          reason: "Checkout reservation",
          orderId: created.id,
        },
      });
    }

    return created;
  });

  await sendOrderCreatedEmail({
    to: input.email,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
  });

  const paymentProvider = getPaymentProvider();
  const payment = await paymentProvider.createPayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: order.totalAmount,
    currency: order.currency,
    description: `Замовлення ${order.orderNumber}`,
    returnUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/checkout/success?order=${order.orderNumber}`,
    callbackUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/webhooks/payments/mock`,
    customerEmail: input.email,
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "mock",
      externalPaymentId: payment.externalPaymentId,
      amount: order.totalAmount,
      currency: order.currency,
      status: PaymentStatus.PENDING,
      redirectUrl: payment.redirectUrl,
    },
  });

  // Cart cleared on order create; stock held by reservation until pay / expire.
  await clearCart(cart.id);

  return {
    order,
    redirectUrl: payment.redirectUrl,
    reused: false as const,
  };
}

export async function confirmMockPayment(input: {
  orderId: string;
  externalPaymentId: string;
  amount: number;
  eventId: string;
}) {
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: {
      provider_externalEventId: {
        provider: "mock",
        externalEventId: input.eventId,
      },
    },
  });
  if (existingEvent?.processedAt) {
    return { duplicate: true as const };
  }

  await prisma.webhookEvent.upsert({
    where: {
      provider_externalEventId: {
        provider: "mock",
        externalEventId: input.eventId,
      },
    },
    update: {},
    create: {
      provider: "mock",
      externalEventId: input.eventId,
      eventType: "payment.paid",
      payload: input,
    },
  });

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { externalPaymentId: input.externalPaymentId, provider: "mock" },
    });
    if (!payment) throw new Error("Payment not found");

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.PAID, paidAt: new Date() },
    });

    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        type: "paid",
        payload: input,
      },
    });

    const order = await tx.order.update({
      where: { id: input.orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.CONFIRMED,
        paidAt: new Date(),
        fulfillmentStatus: FulfillmentStatus.READY,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        field: "paymentStatus",
        oldValue: PaymentStatus.PENDING,
        newValue: PaymentStatus.PAID,
        reason: "Mock payment webhook",
      },
    });

    const reservations = await tx.inventoryReservation.findMany({
      where: { orderId: order.id, releasedAt: null, convertedAt: null },
    });

    for (const reservation of reservations) {
      await tx.inventoryItem.update({
        where: { id: reservation.inventoryItemId },
        data: {
          onHand: { decrement: reservation.quantity },
          reserved: { decrement: reservation.quantity },
          version: { increment: 1 },
        },
      });

      await tx.inventoryReservation.update({
        where: { id: reservation.id },
        data: { convertedAt: new Date() },
      });

      await tx.stockMovement.create({
        data: {
          inventoryItemId: reservation.inventoryItemId,
          type: StockMovementType.SALE,
          quantity: reservation.quantity,
          reason: "Payment confirmed",
          orderId: order.id,
        },
      });
    }

    await tx.webhookEvent.update({
      where: {
        provider_externalEventId: {
          provider: "mock",
          externalEventId: input.eventId,
        },
      },
      data: { processedAt: new Date() },
    });
  });

  const paidOrder = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { couponCode: true },
  });
  await incrementCouponUsage(paidOrder?.couponCode);

  const reservation = await prisma.inventoryReservation.findFirst({
    where: { orderId: input.orderId },
    select: { cartId: true },
  });
  if (reservation?.cartId) {
    await clearCart(reservation.cartId);
  }

  const paid = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      customerEmail: true,
      orderNumber: true,
      totalAmount: true,
      currency: true,
      items: {
        select: {
          productId: true,
          productTitle: true,
          unitPriceAmount: true,
          quantity: true,
        },
      },
    },
  });
  if (paid) {
    await sendOrderPaidEmail({
      to: paid.customerEmail,
      orderNumber: paid.orderNumber,
      totalAmount: paid.totalAmount,
    });

    const { recordPurchaseInterests } = await import("@/features/recommendations/service");
    await recordPurchaseInterests(
      paid.items.map((item) => item.productId).filter((id): id is string => Boolean(id)),
    );

    const { AnalyticsEvents } = await import("@/features/analytics/events");
    const { trackEvent } = await import("@/features/analytics/service");
    await trackEvent({
      name: AnalyticsEvents.PURCHASE,
      path: `/checkout/success`,
      properties: {
        transaction_id: paid.orderNumber,
        currency: paid.currency ?? "UAH",
        value: paid.totalAmount / 100,
        items: paid.items.map((item) => ({
          item_id: item.productId ?? item.productTitle,
          item_name: item.productTitle,
          price: item.unitPriceAmount / 100,
          quantity: item.quantity,
          currency: paid.currency ?? "UAH",
        })),
      },
    });
  }

  return { duplicate: false as const };
}

export type MockPaymentOutcome =
  | "paid"
  | "declined"
  | "insufficient_funds"
  | "cancelled"
  | "provider_error";

/** Soft errors stay on the pay page (no status change) — simulate network/timeout UX. */
export type MockPaymentSoftError = "network_error" | "timeout";

export async function failMockPayment(input: {
  orderId: string;
  externalPaymentId: string;
  reason: Exclude<MockPaymentOutcome, "paid">;
}) {
  const status =
    input.reason === "cancelled" ? PaymentStatus.CANCELLED : PaymentStatus.FAILED;

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { externalPaymentId: input.externalPaymentId, provider: "mock" },
    });
    if (!payment) throw new Error("Payment not found");
    if (payment.status === PaymentStatus.PAID) {
      throw new Error("Payment already paid");
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status,
        failedAt: new Date(),
      },
    });

    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        type: input.reason,
        payload: input,
      },
    });

    await tx.order.update({
      where: { id: input.orderId },
      data: { paymentStatus: status },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: input.orderId,
        field: "paymentStatus",
        oldValue: PaymentStatus.PENDING,
        newValue: status,
        reason: `Mock payment stub: ${input.reason}`,
      },
    });
  });

  // Checkout clears the cart when the order is created; put items back after unpaid fail.
  await restoreCartFromOrder(input.orderId);

  const failed = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { customerEmail: true, orderNumber: true },
  });
  if (failed) {
    await sendOrderPaymentFailedEmail({
      to: failed.customerEmail,
      orderNumber: failed.orderNumber,
      reason: input.reason,
    });
  }
}

/** Allow retry after a failed attempt — reset to PENDING and keep same external id. */
export async function resetMockPaymentForRetry(input: {
  orderId: string;
  externalPaymentId: string;
}) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { externalPaymentId: input.externalPaymentId, provider: "mock" },
    });
    if (!payment) throw new Error("Payment not found");
    if (payment.status === PaymentStatus.PAID) {
      throw new Error("Payment already paid");
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PENDING,
        failedAt: null,
      },
    });

    await tx.order.update({
      where: { id: input.orderId },
      data: { paymentStatus: PaymentStatus.PENDING },
    });
  });
}

export async function getOrderByNumber(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      address: true,
      payments: true,
      shipments: true,
      statusHistory: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  });
}

export async function trackOrderByNumberAndEmail(orderNumber: string, email: string) {
  const normalizedNumber = orderNumber.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedNumber || !normalizedEmail) return null;

  return prisma.order.findFirst({
    where: {
      orderNumber: { equals: normalizedNumber, mode: "insensitive" },
      customerEmail: { equals: normalizedEmail, mode: "insensitive" },
    },
    include: {
      items: true,
      address: true,
      payments: true,
      shipments: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "asc" }, take: 20 },
    },
  });
}

export function freeShippingProgress(subtotalAmount: number) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalAmount);
  return {
    threshold: FREE_SHIPPING_THRESHOLD,
    remaining,
    reached: remaining === 0,
    percent: Math.min(100, Math.round((subtotalAmount / FREE_SHIPPING_THRESHOLD) * 100)),
  };
}
