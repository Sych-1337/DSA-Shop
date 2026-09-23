import { NextRequest, NextResponse } from "next/server";

import { confirmMockPayment } from "@/features/checkout/service";
import { prisma } from "@/lib/db/prisma";
import { getPaymentProvider } from "@/lib/providers";
import { rateLimit } from "@/lib/security/rate-limit";
import { writeAuditLog } from "@/lib/security/audit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = rateLimit({ key: `webhook:wfp:${ip}`, limit: 120, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const rawBody = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  try {
    const provider = getPaymentProvider();
    const event = await provider.verifyWebhook({ headers, rawBody });
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { externalPaymentId: event.externalPaymentId, provider: "wayforpay" },
          { order: { orderNumber: event.externalPaymentId } },
        ],
      },
      include: { order: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (event.status === "PAID") {
      await confirmMockPayment({
        orderId: payment.orderId,
        externalPaymentId: payment.externalPaymentId ?? event.externalPaymentId,
        amount: event.amount || payment.amount,
        eventId: event.externalEventId,
        provider: "wayforpay",
        reason: "WayForPay webhook",
      });
      await writeAuditLog({
        action: "payment.wayforpay.paid",
        entityType: "Order",
        entityId: payment.orderId,
        ip,
        newValues: { orderNumber: payment.order.orderNumber },
      });
    }

    // WayForPay expects accept response
    return NextResponse.json({
      orderReference: event.externalPaymentId,
      status: "accept",
      time: Math.floor(Date.now() / 1000),
    });
  } catch (error) {
    console.error("[wayforpay webhook]", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
