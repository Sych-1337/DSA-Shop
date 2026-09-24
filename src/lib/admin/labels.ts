import type { OrderStatus, PaymentStatus, ProductStatus } from "@/generated/prisma";
import { statusLabel as orderStatusLabel } from "@/features/orders/state-machine";

export function paymentStatusLabel(status: PaymentStatus | string): string {
  const map: Record<string, string> = {
    PENDING: "Очікує",
    AUTHORIZED: "Авторизовано",
    PAID: "Оплачено",
    FAILED: "Помилка",
    CANCELLED: "Скасовано",
    REFUNDED: "Повернено",
    PARTIALLY_REFUNDED: "Частково",
    COD_PENDING: "Накладний (очікує)",
    COD_PAID: "Накладний (оплачено)",
  };
  return map[status] ?? status;
}

export function productStatusLabel(status: ProductStatus | string): string {
  const map: Record<string, string> = {
    DRAFT: "Чернетка",
    PUBLISHED: "Опубліковано",
    ARCHIVED: "Архів",
  };
  return map[status] ?? status;
}

export { orderStatusLabel };

export function orderStatusTone(
  status: OrderStatus | string,
): "neutral" | "info" | "warning" | "success" | "danger" {
  switch (status) {
    case "NEW":
    case "AWAITING_CONFIRMATION":
      return "warning";
    case "CONFIRMED":
    case "PICKING":
    case "READY_TO_SHIP":
      return "info";
    case "SHIPPED":
    case "DELIVERED":
    case "COMPLETED":
      return "success";
    case "CANCELLED":
    case "RETURN_IN_PROGRESS":
    case "RETURNED":
      return "danger";
    default:
      return "neutral";
  }
}

export function paymentStatusTone(
  status: PaymentStatus | string,
): "neutral" | "info" | "warning" | "success" | "danger" {
  switch (status) {
    case "PAID":
    case "COD_PAID":
      return "success";
    case "PENDING":
    case "AUTHORIZED":
    case "COD_PENDING":
      return "warning";
    case "FAILED":
    case "CANCELLED":
      return "danger";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "info";
    default:
      return "neutral";
  }
}

export function productStatusTone(
  status: ProductStatus | string,
): "neutral" | "info" | "warning" | "success" | "danger" {
  switch (status) {
    case "PUBLISHED":
      return "success";
    case "DRAFT":
      return "warning";
    case "ARCHIVED":
      return "neutral";
    default:
      return "neutral";
  }
}
