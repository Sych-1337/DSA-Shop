"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import {
  confirmMockPayment,
  failMockPayment,
  getOrderByNumber,
  resetMockPaymentForRetry,
  type MockPaymentOutcome,
  type MockPaymentSoftError,
} from "@/features/checkout/service";
import { PaymentStatus } from "@/generated/prisma";
import { CUSTOMER_REPORTED_PAID_MARKER } from "@/lib/commerce/fop";
import { isMockPaymentAllowed } from "@/lib/security/mock-payments";
import { verifyOrderAccessToken } from "@/lib/security/order-access";

const HARD_OUTCOMES: MockPaymentOutcome[] = [
  "paid",
  "declined",
  "insufficient_funds",
  "cancelled",
  "provider_error",
];

const SOFT_ERRORS: MockPaymentSoftError[] = ["network_error", "timeout"];

export async function settleMockPaymentAction(formData: FormData) {
  const t = await getTranslations("checkout");

  if (!isMockPaymentAllowed()) {
    return { ok: false as const, error: t("payInvalid") };
  }

  const orderNumber = formData.get("orderNumber")?.toString();
  const outcome = formData.get("outcome")?.toString();
  const token = formData.get("token")?.toString();
  if (!orderNumber || !outcome || !token) {
    return { ok: false as const, error: t("payInvalid") };
  }

  const order = await getOrderByNumber(orderNumber);
  if (!order || !verifyOrderAccessToken(token, order.orderNumber, order.customerEmail)) {
    return { ok: false as const, error: t("payOrderMissing") };
  }

  const payment =
    order.payments.find((row) => row.provider === "mock") ?? order.payments[0];
  if (!payment?.externalPaymentId) {
    return { ok: false as const, error: t("payOrderMissing") };
  }

  if (order.paymentStatus === PaymentStatus.PAID || payment.status === PaymentStatus.PAID) {
    return {
      ok: true as const,
      redirectUrl: `/checkout/success?order=${order.orderNumber}&token=${token}`,
    };
  }

  if (SOFT_ERRORS.includes(outcome as MockPaymentSoftError)) {
    return {
      ok: false as const,
      soft: true as const,
      error:
        outcome === "timeout" ? t("payErrorTimeout") : t("payErrorNetwork"),
    };
  }

  if (!HARD_OUTCOMES.includes(outcome as MockPaymentOutcome)) {
    return { ok: false as const, error: t("payInvalid") };
  }

  try {
    if (
      payment.status === PaymentStatus.FAILED ||
      payment.status === PaymentStatus.CANCELLED
    ) {
      await resetMockPaymentForRetry({
        orderId: order.id,
        externalPaymentId: payment.externalPaymentId,
      });
    }

    if (outcome === "paid") {
      await confirmMockPayment({
        orderId: order.id,
        externalPaymentId: payment.externalPaymentId,
        amount: payment.amount,
        eventId: `mock_evt_${order.id}_${Date.now()}`,
        provider: "mock",
      });
      revalidatePath("/checkout/pay");
      revalidatePath("/checkout/success");
      revalidatePath("/admin/orders");
      revalidatePath("/admin/sales");
      return {
        ok: true as const,
        redirectUrl: `/checkout/success?order=${order.orderNumber}&token=${token}`,
      };
    }

    const failReason = outcome as Exclude<MockPaymentOutcome, "paid">;
    await failMockPayment({
      orderId: order.id,
      externalPaymentId: payment.externalPaymentId,
      reason: failReason,
    });
    revalidatePath("/checkout/pay");
    revalidatePath("/checkout/payment-failed");
    revalidatePath("/cart");
    return {
      ok: true as const,
      redirectUrl: `/checkout/payment-failed?order=${order.orderNumber}&token=${token}&reason=${failReason}`,
    };
  } catch {
    return { ok: false as const, error: t("paySettleFailed") };
  }
}

export async function reportBankTransferPaidAction(formData: FormData) {
  const t = await getTranslations("checkout");
  const { headers } = await import("next/headers");
  const { rateLimit } = await import("@/lib/security/rate-limit");
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = rateLimit({ key: `pay-report:${ip}`, limit: 10, windowMs: 60_000 });
  if (!limited.ok) {
    return { ok: false as const, error: t("payInvalid") };
  }

  const orderNumber = formData.get("orderNumber")?.toString();
  const token = formData.get("token")?.toString();
  if (!orderNumber || !token) {
    return { ok: false as const, error: t("payInvalid") };
  }

  const order = await getOrderByNumber(orderNumber);
  if (!order || !verifyOrderAccessToken(token, order.orderNumber, order.customerEmail)) {
    return { ok: false as const, error: t("payOrderMissing") };
  }

  if (order.paymentStatus === PaymentStatus.PAID) {
    return { ok: true as const, already: true as const };
  }

  const { reportCustomerBankTransferPaid } = await import("@/features/checkout/service");
  await reportCustomerBankTransferPaid({
    orderId: order.id,
    marker: CUSTOMER_REPORTED_PAID_MARKER,
  });

  revalidatePath("/checkout/pay");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/sales");
  revalidatePath(`/admin/orders/${order.id}`);
  return { ok: true as const, already: false as const };
}
