import { OrderStatus } from "@/generated/prisma";

/** Allowed order status transitions (admin-driven). */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["NEW", "CANCELLED"],
  NEW: ["AWAITING_CONFIRMATION", "CONFIRMED", "CANCELLED"],
  AWAITING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PICKING", "CANCELLED"],
  PICKING: ["READY_TO_SHIP", "CONFIRMED", "CANCELLED"],
  READY_TO_SHIP: ["SHIPPED", "PICKING"],
  SHIPPED: ["DELIVERED", "RETURN_IN_PROGRESS"],
  DELIVERED: ["COMPLETED", "RETURN_IN_PROGRESS"],
  COMPLETED: ["RETURN_IN_PROGRESS"],
  CANCELLED: [],
  RETURN_IN_PROGRESS: ["RETURNED", "COMPLETED", "DELIVERED"],
  RETURNED: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus) {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export const KANBAN_COLUMNS: { key: OrderStatus | "ISSUE"; label: string; statuses: OrderStatus[] }[] = [
  { key: "NEW", label: "Нові", statuses: ["NEW"] },
  { key: "AWAITING_CONFIRMATION", label: "На підтвердженні", statuses: ["AWAITING_CONFIRMATION"] },
  { key: "CONFIRMED", label: "Підтверджені", statuses: ["CONFIRMED"] },
  { key: "PICKING", label: "Збірка", statuses: ["PICKING"] },
  { key: "READY_TO_SHIP", label: "До відправки", statuses: ["READY_TO_SHIP"] },
  { key: "SHIPPED", label: "В дорозі", statuses: ["SHIPPED"] },
  { key: "DELIVERED", label: "Доставлено", statuses: ["DELIVERED"] },
  { key: "COMPLETED", label: "Завершено", statuses: ["COMPLETED"] },
  {
    key: "ISSUE",
    label: "Проблеми",
    statuses: ["CANCELLED", "RETURN_IN_PROGRESS", "RETURNED"],
  },
];

/** UX groups for Sales center — avoid a long horizontal column carousel. */
export const SALES_BOARD_GROUPS: {
  key: "WORK" | "SHIPPING" | "DONE";
  label: string;
  hint: string;
  columns: (typeof KANBAN_COLUMNS)[number]["key"][];
}[] = [
  {
    key: "WORK",
    label: "У роботі",
    hint: "Нові → до відправки",
    columns: ["NEW", "AWAITING_CONFIRMATION", "CONFIRMED", "PICKING", "READY_TO_SHIP"],
  },
  {
    key: "SHIPPING",
    label: "Доставка",
    hint: "В дорозі та отримані",
    columns: ["SHIPPED", "DELIVERED"],
  },
  {
    key: "DONE",
    label: "Архів",
    hint: "Завершені та проблеми",
    columns: ["COMPLETED", "ISSUE"],
  },
];

export function statusLabel(status: OrderStatus | "ISSUE"): string {
  if (status === "ISSUE") return "Проблеми";
  return KANBAN_COLUMNS.find((column) => column.key === status)?.label ?? status;
}
