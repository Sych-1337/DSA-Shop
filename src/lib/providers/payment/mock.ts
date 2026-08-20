import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  PaymentStatusResult,
  RefundPaymentInput,
  RefundPaymentResult,
  VerifyWebhookInput,
  VerifiedPaymentEvent,
} from "./types";

const payments = new Map<string, PaymentStatusResult>();

export class MockPaymentProvider implements PaymentProvider {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const externalPaymentId = `mock_pay_${input.orderId}`;
    payments.set(externalPaymentId, {
      externalPaymentId,
      status: "PENDING",
      amount: input.amount,
      currency: input.currency,
    });

    // Stub acquiring page (locale prefix added by i18n router on the storefront).
    const redirectUrl = `/checkout/pay?order=${encodeURIComponent(input.orderNumber)}&payment=${encodeURIComponent(externalPaymentId)}`;

    return {
      externalPaymentId,
      redirectUrl,
      status: "PENDING",
    };
  }

  async verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedPaymentEvent> {
    const payload = JSON.parse(input.rawBody) as {
      eventId: string;
      paymentId: string;
      status: VerifiedPaymentEvent["status"];
      amount: number;
      currency: string;
    };

    payments.set(payload.paymentId, {
      externalPaymentId: payload.paymentId,
      status: payload.status,
      amount: payload.amount,
      currency: payload.currency,
    });

    return {
      externalEventId: payload.eventId,
      externalPaymentId: payload.paymentId,
      status: payload.status,
      amount: payload.amount,
      currency: payload.currency,
    };
  }

  async getPaymentStatus(externalPaymentId: string): Promise<PaymentStatusResult> {
    const existing = payments.get(externalPaymentId);
    if (!existing) {
      throw new Error(`Unknown mock payment: ${externalPaymentId}`);
    }
    return existing;
  }

  async refund(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    return {
      externalRefundId: `mock_ref_${input.externalPaymentId}`,
      status: "SUCCEEDED",
      amount: input.amount,
    };
  }
}
