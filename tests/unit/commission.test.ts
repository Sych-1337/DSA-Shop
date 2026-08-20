import { describe, expect, it } from "vitest";

import {
  buildCommissionLine,
  computeCommissionAmount,
  computeEligibleBase,
  isOrderEligibleForCommission,
  resolveActiveRateBps,
} from "@/features/commission/calc";

describe("commission eligible base", () => {
  it("excludes shipping implicitly (shipping not in formula)", () => {
    expect(
      computeEligibleBase({ subtotalAmount: 100_000, discountAmount: 10_000, returnsAmount: 0 }),
    ).toBe(90_000);
  });

  it("reduces base by returns", () => {
    expect(
      computeEligibleBase({ subtotalAmount: 100_000, discountAmount: 0, returnsAmount: 25_000 }),
    ).toBe(75_000);
  });
});

describe("commission rates", () => {
  it("computes 7%", () => {
    expect(computeCommissionAmount(100_000, 700)).toBe(7000);
  });

  it("computes 4%", () => {
    expect(computeCommissionAmount(100_000, 400)).toBe(4000);
  });

  it("stays on year-one rate before anniversary and payoff", () => {
    const startsAt = new Date("2026-01-01T00:00:00.000Z");
    const at = new Date("2026-06-01T00:00:00.000Z");
    const result = resolveActiveRateBps({
      agreementStartsAt: startsAt,
      at,
      yearOneRateBps: 700,
      ongoingRateBps: 400,
      payoffTargetAmount: 1_000_000,
      cumulativePayoutAmount: 0,
    });
    expect(result).toEqual({ rateBps: 700, switchReason: "YEAR_ONE" });
  });

  it("switches after one year", () => {
    const startsAt = new Date("2025-01-01T00:00:00.000Z");
    const at = new Date("2026-01-02T00:00:00.000Z");
    const result = resolveActiveRateBps({
      agreementStartsAt: startsAt,
      at,
      yearOneRateBps: 700,
      ongoingRateBps: 400,
      payoffTargetAmount: 1_000_000,
      cumulativePayoutAmount: 0,
    });
    expect(result).toEqual({ rateBps: 400, switchReason: "YEAR_ELAPSED" });
  });

  it("switches when payoff target is reached", () => {
    const startsAt = new Date("2026-01-01T00:00:00.000Z");
    const at = new Date("2026-03-01T00:00:00.000Z");
    const result = resolveActiveRateBps({
      agreementStartsAt: startsAt,
      at,
      yearOneRateBps: 700,
      ongoingRateBps: 400,
      payoffTargetAmount: 50_000,
      cumulativePayoutAmount: 50_000,
    });
    expect(result).toEqual({ rateBps: 400, switchReason: "PAYOFF_REACHED" });
  });
});

describe("order eligibility", () => {
  const base = {
    paymentStatus: "PAID",
    status: "DELIVERED",
    source: "WEBSITE",
    cancelledAt: null as Date | null,
  };

  it("includes paid delivered website orders", () => {
    expect(isOrderEligibleForCommission(base, ["WEBSITE"])).toEqual({
      eligible: true,
      reason: "eligible_website_completed_sale",
    });
  });

  it("excludes unpaid", () => {
    expect(
      isOrderEligibleForCommission({ ...base, paymentStatus: "PENDING" }, ["WEBSITE"]).eligible,
    ).toBe(false);
  });

  it("excludes Instagram / phone by default", () => {
    expect(
      isOrderEligibleForCommission({ ...base, source: "INSTAGRAM" }, ["WEBSITE"]).eligible,
    ).toBe(false);
    expect(isOrderEligibleForCommission({ ...base, source: "PHONE" }, ["WEBSITE"]).eligible).toBe(
      false,
    );
  });

  it("excludes cancelled", () => {
    expect(
      isOrderEligibleForCommission(
        { ...base, status: "CANCELLED", cancelledAt: new Date() },
        ["WEBSITE"],
      ).eligible,
    ).toBe(false);
  });
});

describe("buildCommissionLine", () => {
  it("does not commission shipping", () => {
    const line = buildCommissionLine({
      rateBps: 700,
      inclusionReason: "eligible_website_completed_sale",
      order: {
        id: "1",
        orderNumber: "KW-1",
        source: "WEBSITE",
        status: "COMPLETED",
        paymentStatus: "PAID",
        cancelledAt: null,
        subtotalAmount: 200_000,
        discountAmount: 0,
        shippingAmount: 80_00,
        createdAt: new Date(),
      },
    });
    expect(line.shippingExcluded).toBe(8000);
    expect(line.baseAmount).toBe(200_000);
    expect(line.commissionAmount).toBe(14_000);
  });
});
