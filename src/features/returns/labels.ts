import type { ReturnReason, ReturnRequestStatus } from "@/generated/prisma";

/** Client-safe labels — do not import prisma/db here. */

export function returnReasonLabel(reason: ReturnReason, locale: "uk" | "en" | "ru" = "uk") {
  const map = {
    uk: {
      NOT_SUITABLE: "Не підійшов / не сподобався",
      WRONG_ITEM: "Прислали не той товар",
      DEFECT: "Брак / пошкодження",
      OTHER: "Інше",
    },
    en: {
      NOT_SUITABLE: "Didn’t suit / didn’t like",
      WRONG_ITEM: "Wrong item sent",
      DEFECT: "Defect / damage",
      OTHER: "Other",
    },
    ru: {
      NOT_SUITABLE: "Не подошёл / не понравился",
      WRONG_ITEM: "Прислали не тот товар",
      DEFECT: "Брак / повреждение",
      OTHER: "Другое",
    },
  } as const;
  return map[locale][reason];
}

export function returnStatusLabel(status: ReturnRequestStatus) {
  const map: Record<ReturnRequestStatus, string> = {
    REQUESTED: "Нова заявка",
    APPROVED: "Схвалено",
    RECEIVED: "Товар отримано",
    REJECTED: "Відхилено",
    REFUNDED: "Кошти повернуто",
    CANCELLED: "Скасовано",
  };
  return map[status];
}
