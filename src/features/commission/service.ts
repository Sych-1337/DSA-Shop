import {
  CommissionLineStatus,
  CommissionRateChangeReason,
  OrderSource,
  SettlementPeriodStatus,
  type Prisma,
} from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";

import {
  buildCommissionLine,
  isOrderEligibleForCommission,
  parseEligibleSources,
  resolveActiveRateBps,
  settlementYearMonth,
  type CommissionOrderSnapshot,
} from "./calc";

async function getActiveAgreement() {
  return prisma.commissionAgreement.findFirst({
    where: { isActive: true },
    include: { ratePeriods: { orderBy: { startsAt: "asc" } } },
    orderBy: { startsAt: "desc" },
  });
}

async function getCumulativePayout(agreementId: string) {
  const payments = await prisma.commissionPayment.findMany({
    where: { period: { agreementId } },
    select: { amount: true },
  });
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

export async function ensureRatePeriodSynced(at = new Date()) {
  const agreement = await getActiveAgreement();
  if (!agreement) return null;

  const cumulative = await getCumulativePayout(agreement.id);
  const resolved = resolveActiveRateBps({
    agreementStartsAt: agreement.startsAt,
    at,
    yearOneRateBps: agreement.yearOneRateBps,
    ongoingRateBps: agreement.ongoingRateBps,
    payoffTargetAmount: agreement.payoffTargetAmount,
    cumulativePayoutAmount: cumulative,
    ratePeriods: agreement.ratePeriods,
  });

  const open = agreement.ratePeriods.find((p) => p.endsAt == null);
  if (open && open.rateBps === resolved.rateBps) {
    return { agreement, rateBps: resolved.rateBps };
  }

  if (resolved.switchReason === "YEAR_ONE" && !open) {
    await prisma.commissionRatePeriod.create({
      data: {
        agreementId: agreement.id,
        rateBps: agreement.yearOneRateBps,
        startsAt: agreement.startsAt,
        reason: CommissionRateChangeReason.MANUAL,
        note: "Initial year-one rate",
      },
    });
    return { agreement, rateBps: agreement.yearOneRateBps };
  }

  if (
    (resolved.switchReason === "YEAR_ELAPSED" || resolved.switchReason === "PAYOFF_REACHED") &&
    (!open || open.rateBps !== resolved.rateBps)
  ) {
    await prisma.$transaction(async (tx) => {
      if (open) {
        await tx.commissionRatePeriod.update({
          where: { id: open.id },
          data: { endsAt: at },
        });
      }
      await tx.commissionRatePeriod.create({
        data: {
          agreementId: agreement.id,
          rateBps: resolved.rateBps,
          startsAt: at,
          reason:
            resolved.switchReason === "PAYOFF_REACHED"
              ? CommissionRateChangeReason.PAYOFF_REACHED
              : CommissionRateChangeReason.YEAR_ELAPSED,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "commission.rate_switch",
          entityType: "CommissionAgreement",
          entityId: agreement.id,
          newValues: {
            rateBps: resolved.rateBps,
            reason: resolved.switchReason,
          },
          reason: resolved.switchReason,
        },
      });
    });
  }

  return { agreement, rateBps: resolved.rateBps };
}

async function getOrCreateDraftPeriod(agreementId: string, at: Date) {
  const { year, month } = settlementYearMonth(at);
  return prisma.commissionSettlementPeriod.upsert({
    where: {
      agreementId_year_month: { agreementId, year, month },
    },
    create: {
      agreementId,
      year,
      month,
      status: SettlementPeriodStatus.DRAFT,
    },
    update: {},
  });
}

async function refreshPeriodTotals(periodId: string, tx: Prisma.TransactionClient = prisma) {
  const [lines, adjustments] = await Promise.all([
    tx.commissionLineItem.findMany({
      where: { periodId, status: { not: CommissionLineStatus.EXCLUDED } },
    }),
    tx.commissionAdjustment.findMany({ where: { periodId } }),
  ]);

  const totalEligibleBase = lines.reduce((s, l) => s + l.baseAmount, 0);
  const totalCommission = lines.reduce((s, l) => s + l.commissionAmount, 0);
  const totalAdjustments = adjustments.reduce((s, a) => s + a.amount, 0);

  return tx.commissionSettlementPeriod.update({
    where: { id: periodId },
    data: {
      totalEligibleBase,
      totalCommission: totalCommission + totalAdjustments,
      totalAdjustments,
    },
  });
}

export async function accrueCommissionForOrder(orderId: string) {
  const synced = await ensureRatePeriodSynced();
  if (!synced) return null;

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const snapshot: CommissionOrderSnapshot = {
    id: order.id,
    orderNumber: order.orderNumber,
    source: order.source,
    status: order.status,
    paymentStatus: order.paymentStatus,
    cancelledAt: order.cancelledAt,
    subtotalAmount: order.subtotalAmount,
    discountAmount: order.discountAmount,
    shippingAmount: order.shippingAmount,
    createdAt: order.createdAt,
  };

  const eligibleSources = parseEligibleSources(synced.agreement.eligibleSources);
  const eligibility = isOrderEligibleForCommission(snapshot, eligibleSources);

  const existing = await prisma.commissionLineItem.findUnique({ where: { orderId } });
  if (existing) {
    const period = await prisma.commissionSettlementPeriod.findUniqueOrThrow({
      where: { id: existing.periodId },
    });
    if (period.status === SettlementPeriodStatus.LOCKED) {
      return existing;
    }
    if (!eligibility.eligible) {
      await prisma.commissionLineItem.update({
        where: { id: existing.id },
        data: { status: CommissionLineStatus.EXCLUDED, inclusionReason: eligibility.reason },
      });
      await refreshPeriodTotals(existing.periodId);
      return existing;
    }
  }

  if (!eligibility.eligible) return null;

  const period = await getOrCreateDraftPeriod(synced.agreement.id, order.paidAt ?? order.createdAt);
  if (period.status === SettlementPeriodStatus.LOCKED) {
    // Late: create adjustment opportunity instead of mutating locked period
    return null;
  }

  const line = buildCommissionLine({
    order: snapshot,
    rateBps: synced.rateBps,
    inclusionReason: eligibility.reason,
  });

  const saved = await prisma.commissionLineItem.upsert({
    where: { orderId: order.id },
    create: {
      periodId: period.id,
      orderId: line.orderId,
      orderNumber: line.orderNumber,
      source: line.source as OrderSource,
      eligibleSubtotal: line.eligibleSubtotal,
      shippingExcluded: line.shippingExcluded,
      returnsAmount: line.returnsAmount,
      adjustmentAmount: line.adjustmentAmount,
      baseAmount: line.baseAmount,
      rateBps: line.rateBps,
      commissionAmount: line.commissionAmount,
      inclusionReason: line.inclusionReason,
      status: CommissionLineStatus.INCLUDED,
    },
    update: {
      periodId: period.id,
      eligibleSubtotal: line.eligibleSubtotal,
      shippingExcluded: line.shippingExcluded,
      baseAmount: line.baseAmount,
      rateBps: line.rateBps,
      commissionAmount: line.commissionAmount,
      inclusionReason: line.inclusionReason,
      status: CommissionLineStatus.INCLUDED,
    },
  });

  await refreshPeriodTotals(period.id);
  return saved;
}

export async function rebuildDraftPeriod(periodId: string) {
  const period = await prisma.commissionSettlementPeriod.findUniqueOrThrow({
    where: { id: periodId },
    include: { agreement: true },
  });
  if (period.status === SettlementPeriodStatus.LOCKED) {
    throw new Error("Locked period cannot be recalculated");
  }

  const synced = await ensureRatePeriodSynced();
  if (!synced) throw new Error("No active commission agreement");

  const start = new Date(Date.UTC(period.year, period.month - 1, 1));
  const end = new Date(Date.UTC(period.year, period.month, 1));

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { paidAt: { gte: start, lt: end } },
        { paidAt: null, createdAt: { gte: start, lt: end } },
      ],
      status: { in: ["DELIVERED", "COMPLETED"] },
    },
  });

  for (const order of orders) {
    await accrueCommissionForOrder(order.id);
  }

  return refreshPeriodTotals(periodId);
}

export async function lockSettlementPeriod(periodId: string, actorId?: string) {
  const period = await prisma.commissionSettlementPeriod.findUniqueOrThrow({
    where: { id: periodId },
  });
  if (period.status === SettlementPeriodStatus.LOCKED) {
    throw new Error("Period already locked");
  }

  await refreshPeriodTotals(periodId);

  const locked = await prisma.commissionSettlementPeriod.update({
    where: { id: periodId },
    data: {
      status: SettlementPeriodStatus.LOCKED,
      lockedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "commission.period_lock",
      entityType: "CommissionSettlementPeriod",
      entityId: periodId,
      newValues: {
        totalCommission: locked.totalCommission,
        totalEligibleBase: locked.totalEligibleBase,
      },
    },
  });

  return locked;
}

export async function addCommissionAdjustment(input: {
  periodId: string;
  amount: number;
  reason: string;
  orderId?: string;
}) {
  const period = await prisma.commissionSettlementPeriod.findUniqueOrThrow({
    where: { id: input.periodId },
  });
  if (period.status === SettlementPeriodStatus.LOCKED) {
    throw new Error("Cannot adjust locked period; use a later draft period");
  }

  const row = await prisma.commissionAdjustment.create({
    data: {
      periodId: input.periodId,
      amount: input.amount,
      reason: input.reason,
      orderId: input.orderId,
    },
  });
  await refreshPeriodTotals(input.periodId);
  return row;
}

export async function recordCommissionPayment(input: {
  periodId: string;
  amount: number;
  paidAt?: Date;
  method?: string;
  note?: string;
}) {
  const period = await prisma.commissionSettlementPeriod.findUniqueOrThrow({
    where: { id: input.periodId },
  });
  if (period.status !== SettlementPeriodStatus.LOCKED) {
    throw new Error("Payments require a locked period");
  }

  const payment = await prisma.commissionPayment.create({
    data: {
      periodId: input.periodId,
      amount: input.amount,
      paidAt: input.paidAt ?? new Date(),
      method: input.method,
      note: input.note,
    },
  });

  await ensureRatePeriodSynced();
  return payment;
}

export async function getCommissionDashboard() {
  const agreement = await getActiveAgreement();
  if (!agreement) {
    return { agreement: null, periods: [], cumulativePayout: 0, currentRateBps: null };
  }

  const [periods, cumulativePayout] = await Promise.all([
    prisma.commissionSettlementPeriod.findMany({
      where: { agreementId: agreement.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 24,
      include: {
        _count: { select: { lineItems: true, adjustments: true, payments: true } },
      },
    }),
    getCumulativePayout(agreement.id),
  ]);

  const synced = await ensureRatePeriodSynced();

  return {
    agreement,
    periods,
    cumulativePayout,
    currentRateBps: synced?.rateBps ?? agreement.yearOneRateBps,
  };
}

export async function getSettlementPeriodDetail(periodId: string) {
  return prisma.commissionSettlementPeriod.findUnique({
    where: { id: periodId },
    include: {
      agreement: true,
      lineItems: { orderBy: { createdAt: "desc" } },
      adjustments: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
}

export async function ensureCurrentDraftPeriod() {
  const synced = await ensureRatePeriodSynced();
  if (!synced) return null;
  return getOrCreateDraftPeriod(synced.agreement.id, new Date());
}
