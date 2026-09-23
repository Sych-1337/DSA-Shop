import { NextResponse } from "next/server";

import { OrderStatus, PaymentStatus, StockMovementType } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/security/rate-limit";

/**
 * Expires inventory reservations + cancels stale unpaid prepaid orders.
 * Auth: Authorization: Bearer <CRON_SECRET>
 */
function authorize(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return false;
  }
  return true;
}

async function expireReservations() {
  const limited = rateLimit({ key: "cron:reservations", limit: 30, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const now = new Date();
  const expired = await prisma.inventoryReservation.findMany({
    where: {
      expiresAt: { lt: now },
      releasedAt: null,
      convertedAt: null,
    },
    take: 200,
  });

  let released = 0;
  for (const reservation of expired) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.inventoryReservation.findUnique({ where: { id: reservation.id } });
      if (!current || current.releasedAt || current.convertedAt) return;

      await tx.inventoryItem.update({
        where: { id: current.inventoryItemId },
        data: {
          reserved: { decrement: current.quantity },
          version: { increment: 1 },
        },
      });

      await tx.inventoryReservation.update({
        where: { id: current.id },
        data: { releasedAt: now },
      });

      await tx.stockMovement.create({
        data: {
          inventoryItemId: current.inventoryItemId,
          type: StockMovementType.RESERVATION_RELEASE,
          quantity: current.quantity,
          reason: "Reservation TTL expired",
          orderId: current.orderId,
        },
      });

      released += 1;
    });
  }

  const hours = Number(process.env.UNPAID_ORDER_CANCEL_HOURS || 48);
  const cutoff = new Date(Date.now() - Math.max(1, hours) * 60 * 60 * 1000);
  const unpaid = await prisma.order.findMany({
    where: {
      paymentStatus: PaymentStatus.PENDING,
      status: { in: [OrderStatus.NEW, OrderStatus.AWAITING_CONFIRMATION] },
      createdAt: { lt: cutoff },
    },
    take: 100,
    select: { id: true, orderNumber: true },
  });

  let cancelled = 0;
  for (const order of unpaid) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.CANCELLED,
          cancelledAt: now,
        },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          field: "status",
          oldValue: OrderStatus.NEW,
          newValue: OrderStatus.CANCELLED,
          reason: `Unpaid after ${hours}h`,
        },
      });

      const openReservations = await tx.inventoryReservation.findMany({
        where: { orderId: order.id, releasedAt: null, convertedAt: null },
      });
      for (const reservation of openReservations) {
        await tx.inventoryItem.update({
          where: { id: reservation.inventoryItemId },
          data: {
            reserved: { decrement: reservation.quantity },
            version: { increment: 1 },
          },
        });
        await tx.inventoryReservation.update({
          where: { id: reservation.id },
          data: { releasedAt: now },
        });
        await tx.stockMovement.create({
          data: {
            inventoryItemId: reservation.inventoryItemId,
            type: StockMovementType.RESERVATION_RELEASE,
            quantity: reservation.quantity,
            reason: "Unpaid order cancelled",
            orderId: order.id,
          },
        });
      }
    });
    cancelled += 1;
  }

  return NextResponse.json({
    ok: true,
    expiredFound: expired.length,
    released,
    unpaidCancelled: cancelled,
  });
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return expireReservations();
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return expireReservations();
}
