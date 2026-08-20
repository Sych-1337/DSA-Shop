import type { FulfillmentStatus, OrderStatus, PaymentStatus } from "@/generated/prisma";

export type TimelineStepId =
  | "created"
  | "paid"
  | "packing"
  | "shipped"
  | "delivered";

export type TimelineStep = {
  id: TimelineStepId;
  done: boolean;
  current: boolean;
};

const ORDER_RANK: Record<string, number> = {
  DRAFT: 0,
  NEW: 1,
  AWAITING_CONFIRMATION: 1,
  CONFIRMED: 2,
  PICKING: 3,
  READY_TO_SHIP: 3,
  SHIPPED: 4,
  DELIVERED: 5,
  COMPLETED: 5,
  CANCELLED: -1,
  RETURN_IN_PROGRESS: 4,
  RETURNED: 4,
};

export function buildOrderTimeline(input: {
  status: OrderStatus | string;
  paymentStatus: PaymentStatus | string;
  fulfillmentStatus: FulfillmentStatus | string;
}): TimelineStep[] {
  if (input.status === "CANCELLED") {
    return [
      { id: "created", done: true, current: false },
      { id: "paid", done: false, current: false },
      { id: "packing", done: false, current: false },
      { id: "shipped", done: false, current: false },
      { id: "delivered", done: false, current: false },
    ];
  }

  const paid =
    input.paymentStatus === "PAID" ||
    input.paymentStatus === "PARTIALLY_REFUNDED" ||
    input.paymentStatus === "REFUNDED";

  const fulfillment = input.fulfillmentStatus;
  const orderRank = ORDER_RANK[input.status] ?? 1;

  let activeIndex = 0;
  if (!paid) {
    activeIndex = input.paymentStatus === "FAILED" ? 1 : 0;
  } else if (
    fulfillment === "DELIVERED" ||
    input.status === "DELIVERED" ||
    input.status === "COMPLETED"
  ) {
    activeIndex = 4;
  } else if (
    fulfillment === "IN_TRANSIT" ||
    fulfillment === "HANDED_TO_CARRIER" ||
    fulfillment === "ARRIVED" ||
    input.status === "SHIPPED"
  ) {
    activeIndex = 3;
  } else if (orderRank >= 3 || fulfillment === "READY" || fulfillment === "LABEL_CREATED") {
    activeIndex = 2;
  } else {
    activeIndex = 1;
  }

  const ids: TimelineStepId[] = ["created", "paid", "packing", "shipped", "delivered"];

  return ids.map((id, index) => ({
    id,
    done: index < activeIndex || (index === activeIndex && activeIndex === 4),
    current: index === activeIndex && activeIndex < 4,
  }));
}
