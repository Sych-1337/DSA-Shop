import { NextResponse } from "next/server";

import { StockMovementType } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/security/rate-limit";

/**
 * Expires inventory reservations past expiresAt and releases reserved quantity.
 * Auth: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({ ok: true, expiredFound: expired.length, released });
}
