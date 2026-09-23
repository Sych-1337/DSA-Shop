import {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
  type Prisma,
} from "@/generated/prisma";
import {
  confirmMockPayment,
  resetMockPaymentForRetry,
} from "@/features/checkout/service";
import { accrueCommissionForOrder } from "@/features/commission/service";
import { canTransitionOrder } from "@/features/orders/state-machine";
import { getShippingProvider } from "@/lib/providers";
import { prisma } from "@/lib/db/prisma";

const orderListInclude = {
  items: true,
  payments: true,
  shipments: true,
} satisfies Prisma.OrderInclude;

export type AdminOrderListItem = Prisma.OrderGetPayload<{ include: typeof orderListInclude }>;

export async function listAdminOrders(params: {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;
  const where: Prisma.OrderWhereInput = {};

  if (params.status) where.status = params.status;
  if (params.paymentStatus) where.paymentStatus = params.paymentStatus;
  if (params.q) {
    where.OR = [
      { orderNumber: { contains: params.q, mode: "insensitive" } },
      { customerEmail: { contains: params.q, mode: "insensitive" } },
      { customerPhone: { contains: params.q, mode: "insensitive" } },
      { customerLastName: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderListInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    orders,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listOrdersForKanban() {
  return prisma.order.findMany({
    include: orderListInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getAdminOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      address: true,
      payments: { include: { events: true }, orderBy: { createdAt: "desc" } },
      shipments: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: { createdAt: "desc" } },
      reservations: true,
    },
  });
}

export async function transitionOrderStatus(input: {
  orderId: string;
  toStatus: OrderStatus;
  reason?: string;
  actorId?: string;
}) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: input.orderId } });
  if (!canTransitionOrder(order.status, input.toStatus)) {
    throw new Error(`Перехід ${order.status} → ${input.toStatus} заборонений`);
  }

  const fulfillmentPatch: Partial<{ fulfillmentStatus: FulfillmentStatus }> = {};
  if (input.toStatus === OrderStatus.READY_TO_SHIP) {
    fulfillmentPatch.fulfillmentStatus = FulfillmentStatus.READY;
  }
  if (input.toStatus === OrderStatus.SHIPPED) {
    fulfillmentPatch.fulfillmentStatus = FulfillmentStatus.IN_TRANSIT;
  }
  if (input.toStatus === OrderStatus.DELIVERED) {
    fulfillmentPatch.fulfillmentStatus = FulfillmentStatus.DELIVERED;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.order.update({
      where: { id: order.id },
      data: {
        status: input.toStatus,
        ...fulfillmentPatch,
        cancelledAt: input.toStatus === OrderStatus.CANCELLED ? new Date() : order.cancelledAt,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        field: "status",
        oldValue: order.status,
        newValue: input.toStatus,
        reason: input.reason ?? "Admin transition",
        actorId: input.actorId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actorId,
        action: "order.status_change",
        entityType: "Order",
        entityId: order.id,
        oldValues: { status: order.status },
        newValues: { status: input.toStatus },
        reason: input.reason,
      },
    });

    return row;
  });

  if (
    input.toStatus === OrderStatus.DELIVERED ||
    input.toStatus === OrderStatus.COMPLETED ||
    input.toStatus === OrderStatus.CANCELLED ||
    input.toStatus === OrderStatus.RETURNED ||
    input.toStatus === OrderStatus.RETURN_IN_PROGRESS
  ) {
    try {
      await accrueCommissionForOrder(updated.id);
    } catch {
      // Commission accrual must not block fulfillment ops.
    }
  }

  return updated;
}

export async function addOrderNote(input: {
  orderId: string;
  body: string;
  isInternal?: boolean;
  actorId?: string;
}) {
  return prisma.orderNote.create({
    data: {
      orderId: input.orderId,
      body: input.body.trim(),
      isInternal: input.isInternal ?? true,
      actorId: input.actorId,
    },
  });
}

/** Confirm FOP / manual prepaid — same inventory conversion as acquiring webhook. */
export async function markOrderPaidManually(input: {
  orderId: string;
  reason?: string;
  actorId?: string;
}) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: input.orderId },
    include: { payments: { orderBy: { createdAt: "desc" } } },
  });

  if (order.paymentStatus === PaymentStatus.PAID) {
    return { alreadyPaid: true as const };
  }

  let payment = order.payments[0] ?? null;
  const provider = payment?.provider ?? "bank_transfer";

  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider,
        externalPaymentId: `manual_${order.id}`,
        amount: order.totalAmount,
        currency: order.currency,
        status: PaymentStatus.PENDING,
      },
    });
  }

  const externalPaymentId =
    payment.externalPaymentId ?? `manual_${order.id}_${Date.now()}`;
  if (!payment.externalPaymentId) {
    payment = await prisma.payment.update({
      where: { id: payment.id },
      data: { externalPaymentId },
    });
  }

  if (
    payment.status === PaymentStatus.FAILED ||
    payment.status === PaymentStatus.CANCELLED
  ) {
    await resetMockPaymentForRetry({
      orderId: order.id,
      externalPaymentId,
    });
  }

  await confirmMockPayment({
    orderId: order.id,
    externalPaymentId,
    amount: payment.amount,
    eventId: `manual_paid_${order.id}_${Date.now()}`,
    provider,
    reason: input.reason?.trim() || "Admin confirmed prepaid payment",
  });

  await addOrderNote({
    orderId: order.id,
    body: input.reason?.trim() || "Підтверджено оплату (ФОП / вручну)",
    actorId: input.actorId,
  });

  const { writeAuditLog } = await import("@/lib/security/audit");
  await writeAuditLog({
    actorId: input.actorId,
    action: "payment.manual_mark",
    entityType: "Order",
    entityId: order.id,
    reason: input.reason,
  });

  return { alreadyPaid: false as const };
}

/** Save tracking number without mock label generation. */
export async function saveShipmentTracking(input: {
  orderId: string;
  trackingNumber: string;
  actorId?: string;
}) {
  const trackingNumber = input.trackingNumber.trim();
  if (trackingNumber.length < 3) {
    throw new Error("Вкажіть номер ТТН");
  }

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: input.orderId },
    include: { shipments: true },
  });

  const existing = order.shipments[0];
  if (existing) {
    await prisma.shipment.update({
      where: { id: existing.id },
      data: {
        trackingNumber,
        status: FulfillmentStatus.LABEL_CREATED,
      },
    });
  } else {
    await prisma.shipment.create({
      data: {
        orderId: order.id,
        provider: "manual",
        externalShipmentId: `ttn_${order.id}`,
        trackingNumber,
        status: FulfillmentStatus.LABEL_CREATED,
        method: order.shippingMethod,
      },
    });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { fulfillmentStatus: FulfillmentStatus.LABEL_CREATED },
  });

  await addOrderNote({
    orderId: order.id,
    body: `ТТН збережено: ${trackingNumber}`,
    actorId: input.actorId,
  });
}

export async function createShipmentForOrder(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { address: true, shipments: true },
  });

  if (order.status !== OrderStatus.READY_TO_SHIP && order.status !== OrderStatus.PICKING) {
    throw new Error("Спочатку переведіть замовлення у збірку / готове до відправки");
  }

  const shipping = getShippingProvider();
  const created = await shipping.createShipment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    recipientName: `${order.customerFirstName} ${order.customerLastName}`,
    phone: order.customerPhone,
    cityRef: order.shippingCity ?? order.address?.city ?? "Kyiv",
    warehouseRef: order.shippingWarehouseRef ?? order.address?.warehouseRef ?? undefined,
    addressLine: order.shippingAddressLine ?? order.address?.addressLine ?? undefined,
    weightGrams: 500,
  });

  const shipment = await prisma.$transaction(async (tx) => {
    const row = await tx.shipment.create({
      data: {
        orderId: order.id,
        provider: "mock",
        externalShipmentId: created.externalShipmentId,
        trackingNumber: created.trackingNumber,
        status: FulfillmentStatus.LABEL_CREATED,
        method: order.shippingMethod,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.SHIPPED,
        fulfillmentStatus: FulfillmentStatus.HANDED_TO_CARRIER,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        field: "status",
        oldValue: order.status,
        newValue: OrderStatus.SHIPPED,
        reason: `Shipment ${created.trackingNumber}`,
      },
    });

    return row;
  });

  return shipment;
}

export async function getDashboardMetrics() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const allInventory = await prisma.inventoryItem.findMany({
    select: { onHand: true, reorderPoint: true },
  });
  const lowStock = allInventory.filter((i) => i.onHand <= i.reorderPoint).length;

  const [
    ordersToday,
    paidToday,
    revenuePaid,
    newOrders,
    awaitingConfirmation,
    picking,
    readyToShip,
    failedPayments,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({
      where: { paidAt: { gte: startOfDay }, paymentStatus: PaymentStatus.PAID },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: PaymentStatus.PAID, paidAt: { gte: startOfDay } },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({ where: { status: OrderStatus.NEW } }),
    prisma.order.count({ where: { status: OrderStatus.AWAITING_CONFIRMATION } }),
    prisma.order.count({ where: { status: OrderStatus.PICKING } }),
    prisma.order.count({ where: { status: OrderStatus.READY_TO_SHIP } }),
    prisma.order.count({ where: { paymentStatus: PaymentStatus.FAILED } }),
  ]);

  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { items: true },
  });

  return {
    ordersToday,
    paidToday,
    revenuePaid: revenuePaid._sum.totalAmount ?? 0,
    queues: {
      newOrders,
      awaitingConfirmation,
      picking,
      readyToShip,
      failedPayments,
      lowStock,
    },
    recentOrders,
  };
}

export async function listPayments(page = 1, pageSize = 30) {
  const [total, payments] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.findMany({
      include: { order: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { payments, total, page, pageSize };
}

/** @deprecated Use listInventoryRows from `@/features/inventory/service` */
export async function listInventory(page = 1, pageSize = 40) {
  const { listInventoryRows } = await import("@/features/inventory/service");
  const result = await listInventoryRows({ page, pageSize });
  return {
    items: result.rows,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}
