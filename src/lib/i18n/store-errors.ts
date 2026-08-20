type ErrorTranslator = {
  (key: string, values?: Record<string, string | number>): string;
  has?: (key: string) => boolean;
};

/** Map service error codes / legacy UA messages to locale strings. */
export function translateStoreError(t: ErrorTranslator, message: string): string {
  const map: Record<string, string> = {
    productUnavailable: "productUnavailable",
    insufficientStock: "insufficientStock",
    itemNotFound: "itemNotFound",
    cartEmpty: "cartEmpty",
    warehouseMissing: "warehouseMissing",
    couponEmpty: "couponEmpty",
    couponNotFound: "couponNotFound",
    couponInactive: "couponInactive",
    couponExpired: "couponExpired",
    couponNotStarted: "couponNotStarted",
    couponUsageLimit: "couponUsageLimit",
    couponMinOrder: "couponMinOrder",
    couponFirstOrderOnly: "couponFirstOrderOnly",
    couponFirstOrderEmail: "couponFirstOrderEmail",
    couponInvalid: "couponInvalid",
    "Товар недоступний": "productUnavailable",
    "Недостатньо на складі": "insufficientStock",
    "Позицію не знайдено": "itemNotFound",
    "Кошик порожній": "cartEmpty",
    "Склад не налаштовано": "warehouseMissing",
  };

  if (message.startsWith("noStockForSku:")) {
    return t("noStockForSku", { sku: message.slice("noStockForSku:".length) });
  }
  if (message.startsWith("insufficientStockFor:")) {
    return t("insufficientStockFor", {
      title: message.slice("insufficientStockFor:".length),
    });
  }
  if (message.startsWith("Немає залишку для ")) {
    return t("noStockForSku", { sku: message.slice("Немає залишку для ".length) });
  }
  if (message.startsWith("Недостатньо на складі: ")) {
    return t("insufficientStockFor", {
      title: message.slice("Недостатньо на складі: ".length),
    });
  }

  const key = map[message];
  if (key) return t(key);
  if (t.has?.(message)) return t(message);
  return t("checkoutFailed");
}
