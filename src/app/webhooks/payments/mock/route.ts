import { NextRequest, NextResponse } from "next/server";

import { confirmMockPayment } from "@/features/checkout/service";
import { prisma } from "@/lib/db/prisma";
import { isMockPaymentAllowed } from "@/lib/security/mock-payments";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  if (!isMockPaymentAllowed()) {
    return NextResponse.json({ error: "Gone" }, { status: 410 });
  }

  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  const headerSecret =
    request.headers.get("x-webhook-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || headerSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = rateLimit({ key: `webhook:mock:${ip}`, limit: 60, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const rawBody = await request.text();
  let payload: {
    eventId: string;
    paymentId: string;
    status: string;
    amount: number;
    currency: string;
    orderId?: string;
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.eventId || !payload.paymentId) {
    return NextResponse.json({ error: "Missing eventId/paymentId" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { externalPaymentId: payload.paymentId, provider: "mock" },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payload.status === "PAID") {
    const result = await confirmMockPayment({
      orderId: payment.orderId,
      externalPaymentId: payload.paymentId,
      amount: payload.amount,
      eventId: payload.eventId,
      provider: "mock",
    });
    return NextResponse.json({ ok: true, ...result });
  }

  return NextResponse.json({ ok: true, ignored: true });
}
