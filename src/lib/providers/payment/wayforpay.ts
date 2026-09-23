import { createHmac, timingSafeEqual } from "node:crypto";

import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  PaymentStatusResult,
  RefundPaymentInput,
  RefundPaymentResult,
  VerifiedPaymentEvent,
  VerifyWebhookInput,
} from "./types";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function merchantSecret() {
  return requireEnv("WAYFORPAY_SECRET_KEY");
}

/** WayForPay signature: HMAC-MD5 over semicolon-joined fields. */
export function wayforpaySign(fields: Array<string | number>) {
  const payload = fields.map(String).join(";");
  return createHmac("md5", merchantSecret()).update(payload, "utf8").digest("hex");
}

export function verifyWayforpaySignature(
  fields: Array<string | number>,
  signature: string,
): boolean {
  const expected = wayforpaySign(fields);
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export class WayForPayPaymentProvider implements PaymentProvider {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const merchantAccount = requireEnv("WAYFORPAY_MERCHANT_ACCOUNT");
    const merchantDomainName =
      process.env.WAYFORPAY_MERCHANT_DOMAIN?.trim() ||
      new URL(process.env.APP_URL ?? "http://localhost:3000").hostname;
    const orderDate = Math.floor(Date.now() / 1000);
    const amount = (input.amount / 100).toFixed(2);
    const currency = input.currency || "UAH";
    const productName = [input.description];
    const productCount = ["1"];
    const productPrice = [amount];

    const signature = wayforpaySign([
      merchantAccount,
      merchantDomainName,
      input.orderNumber,
      orderDate,
      amount,
      currency,
      ...productName,
      ...productCount,
      ...productPrice,
    ]);

    const form = {
      merchantAccount,
      merchantDomainName,
      orderReference: input.orderNumber,
      orderDate,
      amount,
      currency,
      productName,
      productCount,
      productPrice,
      serviceUrl: input.callbackUrl,
      returnUrl: input.returnUrl,
      clientEmail: input.customerEmail,
      merchantSignature: signature,
    };

    // Hosted checkout via POST form — store redirect as data URL for server to render form page.
    const qs = encodeURIComponent(JSON.stringify(form));
    return {
      externalPaymentId: input.orderNumber,
      redirectUrl: `/checkout/pay/wayforpay?payload=${qs}`,
      status: "PENDING",
    };
  }

  async verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedPaymentEvent> {
    const body = JSON.parse(input.rawBody) as Record<string, unknown>;
    const orderReference = String(body.orderReference ?? "");
    const amount = Number(body.amount ?? 0);
    const currency = String(body.currency ?? "UAH");
    const status = String(body.transactionStatus ?? body.status ?? "");
    const signature = String(body.merchantSignature ?? "");
    const time = String(body.authCode ?? body.processingDate ?? body.reasonCode ?? "");

    const ok = verifyWayforpaySignature(
      [
        orderReference,
        String(body.status ?? status),
        time,
      ],
      signature,
    );
    // Fallback field set used by many WFP serviceUrl callbacks:
    if (!ok) {
      const altOk = verifyWayforpaySignature(
        [
          String(body.merchantAccount ?? ""),
          orderReference,
          String(amount),
          currency,
          String(body.authCode ?? ""),
          String(body.cardPan ?? ""),
          status,
          String(body.reasonCode ?? ""),
        ],
        signature,
      );
      if (!altOk) {
        throw new Error("Invalid WayForPay signature");
      }
    }

    const mapped: VerifiedPaymentEvent["status"] =
      status === "Approved" || status === "PAID"
        ? "PAID"
        : status === "Refunded"
          ? "REFUNDED"
          : status === "Declined" || status === "Expired"
            ? "FAILED"
            : "PENDING";

    return {
      externalEventId: `${orderReference}:${status}:${body.processingDate ?? body.authCode ?? Date.now()}`,
      externalPaymentId: orderReference,
      status: mapped,
      amount: Math.round(amount * 100),
      currency,
    };
  }

  async getPaymentStatus(externalPaymentId: string): Promise<PaymentStatusResult> {
    return {
      externalPaymentId,
      status: "PENDING",
      amount: 0,
      currency: "UAH",
    };
  }

  async refund(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    return {
      externalRefundId: `wfp_refund_${input.externalPaymentId}`,
      status: "PENDING",
      amount: input.amount,
    };
  }
}
