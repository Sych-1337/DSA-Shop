import { percentOf } from "@/lib/money";

export type CommissionOrderSnapshot = {
  id: string;
  orderNumber: string;
  source: string;
  status: string;
  paymentStatus: string;
  cancelledAt: Date | null;
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  createdAt: Date;
};

export function parseEligibleSources(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [value];
    }
  }
  return ["WEBSITE"];
}

export function isPaidStatus(paymentStatus: string): boolean {
  return paymentStatus === "PAID" || paymentStatus === "COD_PAID";
}

export function isEligibleLifecycleStatus(status: string): boolean {
  return status === "DELIVERED" || status === "COMPLETED";
}

export function isOrderEligibleForCommission(
  order: Pick<
    CommissionOrderSnapshot,
    "status" | "paymentStatus" | "source" | "cancelledAt"
  >,
  eligibleSources: string[],
): { eligible: boolean; reason: string } {
  if (order.cancelledAt || order.status === "CANCELLED") {
    return { eligible: false, reason: "cancelled" };
  }
  if (order.status === "RETURNED" || order.status === "RETURN_IN_PROGRESS") {
    return { eligible: false, reason: "returned_or_in_progress" };
  }
  if (!isPaidStatus(order.paymentStatus)) {
    return { eligible: false, reason: "unpaid" };
  }
  if (!isEligibleLifecycleStatus(order.status)) {
    return { eligible: false, reason: "not_delivered_or_completed" };
  }
  if (!eligibleSources.includes(order.source)) {
    return { eligible: false, reason: `source_${order.source}_excluded` };
  }
  return { eligible: true, reason: "eligible_website_completed_sale" };
}

/** Product subtotal after discounts, excluding shipping; returns reduce the base. */
export function computeEligibleBase(input: {
  subtotalAmount: number;
  discountAmount: number;
  returnsAmount?: number;
}): number {
  const returnsAmount = input.returnsAmount ?? 0;
  return Math.max(0, input.subtotalAmount - input.discountAmount - returnsAmount);
}

export function computeCommissionAmount(baseAmount: number, rateBps: number): number {
  return percentOf(baseAmount, rateBps);
}

export function resolveActiveRateBps(input: {
  agreementStartsAt: Date;
  at: Date;
  yearOneRateBps: number;
  ongoingRateBps: number;
  payoffTargetAmount: number;
  cumulativePayoutAmount: number;
  /** Optional explicit periods; if empty, rule-based switch applies. */
  ratePeriods?: { rateBps: number; startsAt: Date; endsAt: Date | null }[];
}): { rateBps: number; switchReason: "YEAR_ELAPSED" | "PAYOFF_REACHED" | "YEAR_ONE" | "PERIOD" } {
  if (input.ratePeriods && input.ratePeriods.length > 0) {
    const active = [...input.ratePeriods]
      .filter((p) => p.startsAt <= input.at && (p.endsAt == null || p.endsAt > input.at))
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())[0];
    if (active) {
      return { rateBps: active.rateBps, switchReason: "PERIOD" };
    }
  }

  const yearMs = 365 * 24 * 60 * 60 * 1000;
  const yearElapsed = input.at.getTime() - input.agreementStartsAt.getTime() >= yearMs;
  const payoffReached = input.cumulativePayoutAmount >= input.payoffTargetAmount;

  if (yearElapsed) {
    return { rateBps: input.ongoingRateBps, switchReason: "YEAR_ELAPSED" };
  }
  if (payoffReached) {
    return { rateBps: input.ongoingRateBps, switchReason: "PAYOFF_REACHED" };
  }
  return { rateBps: input.yearOneRateBps, switchReason: "YEAR_ONE" };
}

export function settlementYearMonth(date: Date): { year: number; month: number } {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function buildCommissionLine(input: {
  order: CommissionOrderSnapshot;
  rateBps: number;
  returnsAmount?: number;
  adjustmentAmount?: number;
  inclusionReason: string;
}) {
  const returnsAmount = input.returnsAmount ?? 0;
  const adjustmentAmount = input.adjustmentAmount ?? 0;
  const eligibleSubtotal = computeEligibleBase({
    subtotalAmount: input.order.subtotalAmount,
    discountAmount: input.order.discountAmount,
    returnsAmount,
  });
  const baseAmount = Math.max(0, eligibleSubtotal + adjustmentAmount);
  const commissionAmount = computeCommissionAmount(baseAmount, input.rateBps);

  return {
    orderId: input.order.id,
    orderNumber: input.order.orderNumber,
    source: input.order.source,
    eligibleSubtotal,
    shippingExcluded: input.order.shippingAmount,
    returnsAmount,
    adjustmentAmount,
    baseAmount,
    rateBps: input.rateBps,
    commissionAmount,
    inclusionReason: input.inclusionReason,
  };
}
