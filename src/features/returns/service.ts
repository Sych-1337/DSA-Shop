import {
  OrderStatus,
  PaymentStatus,
  ReturnItemResolution,
  ReturnRequestStatus,
  StockMovementType,
} from "@/generated/prisma";
import { canTransitionOrder } from "@/features/orders/state-machine";
import type { ReturnRequestInput } from "@/features/returns/schema";
import { getDefaultWarehouse } from "@/features/inventory/service";
import { prisma } from "@/lib/db/prisma";

const RETURNABLE_STATUSES: OrderStatus[] = [
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
  OrderStatus.SHIPPED,
];

const OPEN_RETURN_STATUSES: ReturnRequestStatus[] = [
  ReturnRequestStatus.REQUESTED,
  ReturnRequestStatus.APPROVED,
  ReturnRequestStatus.RECEIVED,
];

export async function lookupReturnableOrder(orderNumber: string, email: string) {
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: { equals: orderNumber.trim(), mode: "insensitive" },
      customerEmail: { equals: email.trim(), mode: "insensitive" },
    },
    include: {
      items: true,
      returnRequests: {
        where: { status: { in: OPEN_RETURN_STATUSES } },
        select: { id: true, status: true },
      },
    },
  });
  return order;
}

export async function createCustomerReturnRequest(input: ReturnRequestInput) {
  const order = await lookupReturnableOrder(input.orderNumber, input.email);
  if (!order) {
    throw new Error("Замовлення не знайдено. Перевірте номер і email.");
  }
  if (!RETURNABLE_STATUSES.includes(order.status)) {
    throw new Error(
      "Повернення доступне після відправлення / отримання замовлення. Поточний статус не дозволяє заявку.",
    );
  }
  if (order.paymentStatus !== PaymentStatus.PAID && order.paymentStatus !== PaymentStatus.COD_PAID) {
    throw new Error("Повернення можливе лише для оплачених замовлень.");
  }
  if (order.returnRequests.length > 0) {
    throw new Error("Для цього замовлення вже є активна заявка на повернення.");
  }

  const selected = order.items.filter((item) => input.itemIds.includes(item.id));
  if (selected.length === 0) {
    throw new Error("Оберіть хоча б один товар для повернення.");
  }

  const refundAmount = selected.reduce((sum, item) => sum + item.lineTotalAmount, 0);

  const created = await prisma.$transaction(async (tx) => {
    const request = await tx.returnRequest.create({
      data: {
        orderId: order.id,
        status: ReturnRequestStatus.REQUESTED,
        reason: input.reason,
        customerNote: input.customerNote?.trim() || null,
        refundAmount,
        items: {
          create: selected.map((item) => ({
            orderItemId: item.id,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: { include: { orderItem: true } }, order: true },
    });

    if (canTransitionOrder(order.status, OrderStatus.RETURN_IN_PROGRESS)) {
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.RETURN_IN_PROGRESS },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          field: "status",
          oldValue: order.status,
          newValue: OrderStatus.RETURN_IN_PROGRESS,
          reason: "Заявка на повернення від покупця",
        },
      });
    }

    await tx.orderNote.create({
      data: {
        orderId: order.id,
        body: `Заявка на повернення: ${input.reason}${input.customerNote ? ` — ${input.customerNote}` : ""}`,
        isInternal: false,
      },
    });

    return request;
  });

  return created;
}

export async function listAdminReturnRequests(params?: {
  status?: ReturnRequestStatus;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params?.pageSize ?? 30));
  const where = params?.status ? { status: params.status } : {};

  const [total, items] = await Promise.all([
    prisma.returnRequest.count({ where }),
    prisma.returnRequest.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerFirstName: true,
            customerLastName: true,
            customerEmail: true,
            customerPhone: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
          },
        },
        items: { include: { orderItem: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getAdminReturnRequest(id: string) {
  return prisma.returnRequest.findUnique({
    where: { id },
    include: {
      order: { include: { items: true, payments: true } },
      items: { include: { orderItem: true } },
    },
  });
}

export async function transitionReturnRequest(input: {
  id: string;
  toStatus: ReturnRequestStatus;
  adminNote?: string;
  actorId?: string;
  restock?: boolean;
}) {
  const request = await prisma.returnRequest.findUnique({
    where: { id: input.id },
    include: {
      items: { include: { orderItem: true } },
      order: true,
    },
  });
  if (!request) throw new Error("Заявку не знайдено");

  const allowed: Record<ReturnRequestStatus, ReturnRequestStatus[]> = {
    REQUESTED: ["APPROVED", "REJECTED", "CANCELLED"],
    APPROVED: ["RECEIVED", "REJECTED", "CANCELLED"],
    RECEIVED: ["REFUNDED", "REJECTED"],
    REJECTED: [],
    REFUNDED: [],
    CANCELLED: [],
  };
  if (!allowed[request.status].includes(input.toStatus)) {
    throw new Error(`Перехід ${request.status} → ${input.toStatus} заборонений`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.returnRequest.update({
      where: { id: request.id },
      data: {
        status: input.toStatus,
        adminNote: input.adminNote?.trim() || request.adminNote,
        actorId: input.actorId && input.actorId !== "bypass" ? input.actorId : request.actorId,
      },
      include: {
        items: { include: { orderItem: true } },
        order: true,
      },
    });

    if (input.toStatus === ReturnRequestStatus.REJECTED || input.toStatus === ReturnRequestStatus.CANCELLED) {
      // Leave order status as-is if still RETURN_IN_PROGRESS — admin can move manually
      await tx.orderNote.create({
        data: {
          orderId: request.orderId,
          body: `Повернення ${input.toStatus === "REJECTED" ? "відхилено" : "скасовано"}${input.adminNote ? `: ${input.adminNote}` : ""}`,
          isInternal: true,
          actorId: input.actorId && input.actorId !== "bypass" ? input.actorId : null,
        },
      });
    }

    if (input.toStatus === ReturnRequestStatus.REFUNDED) {
      const warehouse = await getDefaultWarehouse();
      const shouldRestock = input.restock !== false;

      if (shouldRestock) {
        for (const line of request.items) {
          if (!line.orderItem.variantId) continue;
          const inventory = await tx.inventoryItem.upsert({
            where: {
              warehouseId_variantId: {
                warehouseId: warehouse.id,
                variantId: line.orderItem.variantId,
              },
            },
            update: {},
            create: {
              warehouseId: warehouse.id,
              variantId: line.orderItem.variantId,
              onHand: 0,
            },
          });
          await tx.inventoryItem.update({
            where: { id: inventory.id },
            data: {
              onHand: { increment: line.quantity },
              version: { increment: 1 },
            },
          });
          await tx.stockMovement.create({
            data: {
              inventoryItemId: inventory.id,
              type: StockMovementType.RETURN,
              quantity: line.quantity,
              reason: `Повернення замовлення ${request.order.orderNumber}`,
              orderId: request.orderId,
              actorId: input.actorId && input.actorId !== "bypass" ? input.actorId : null,
            },
          });
          await tx.returnItem.update({
            where: { id: line.id },
            data: { resolution: ReturnItemResolution.RESTOCK },
          });
        }
      } else {
        await tx.returnItem.updateMany({
          where: { returnRequestId: request.id },
          data: { resolution: ReturnItemResolution.WRITE_OFF },
        });
      }

      if (canTransitionOrder(request.order.status, OrderStatus.RETURNED)) {
        await tx.order.update({
          where: { id: request.orderId },
          data: {
            status: OrderStatus.RETURNED,
            paymentStatus:
              request.order.paymentStatus === PaymentStatus.PAID
                ? PaymentStatus.REFUNDED
                : request.order.paymentStatus,
          },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: request.orderId,
            field: "status",
            oldValue: request.order.status,
            newValue: OrderStatus.RETURNED,
            reason: "Повернення підтверджено, кошти повернено",
            actorId: input.actorId && input.actorId !== "bypass" ? input.actorId : null,
          },
        });
      }

      await tx.orderNote.create({
        data: {
          orderId: request.orderId,
          body: `Повернення завершено. Сума до повернення: ${((request.refundAmount ?? 0) / 100).toFixed(2)} ₴. ${
            shouldRestock ? "Товар повернено на склад." : "Товар списано без повернення на склад."
          }`,
          isInternal: true,
          actorId: input.actorId && input.actorId !== "bypass" ? input.actorId : null,
        },
      });
    }

    return updated;
  });
}
