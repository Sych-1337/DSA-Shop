export type CreatePaymentInput = {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  callbackUrl: string;
  customerEmail?: string;
};

export type CreatePaymentResult = {
  externalPaymentId: string;
  redirectUrl: string;
  status: "PENDING" | "AUTHORIZED" | "PAID" | "FAILED";
};

export type VerifyWebhookInput = {
  headers: Record<string, string | string[] | undefined>;
  rawBody: string;
};

export type VerifiedPaymentEvent = {
  externalEventId: string;
  externalPaymentId: string;
  status: "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED";
  amount: number;
  currency: string;
};

export type PaymentStatusResult = {
  externalPaymentId: string;
  status: VerifiedPaymentEvent["status"];
  amount: number;
  currency: string;
};

export type RefundPaymentInput = {
  externalPaymentId: string;
  amount: number;
  reason?: string;
};

export type RefundPaymentResult = {
  externalRefundId: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  amount: number;
};

export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedPaymentEvent>;
  getPaymentStatus(externalPaymentId: string): Promise<PaymentStatusResult>;
  refund(input: RefundPaymentInput): Promise<RefundPaymentResult>;
}
