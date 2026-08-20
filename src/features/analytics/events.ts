/** Canonical ecommerce / engagement event names (GA4 + Firebase Analytics compatible). */
export const AnalyticsEvents = {
  PAGE_VIEW: "page_view",
  VIEW_ITEM: "view_item",
  VIEW_ITEM_LIST: "view_item_list",
  SELECT_ITEM: "select_item",
  ADD_TO_CART: "add_to_cart",
  REMOVE_FROM_CART: "remove_from_cart",
  ADD_TO_WISHLIST: "add_to_wishlist",
  BEGIN_CHECKOUT: "begin_checkout",
  ADD_SHIPPING_INFO: "add_shipping_info",
  ADD_PAYMENT_INFO: "add_payment_info",
  PURCHASE: "purchase",
  SEARCH: "search",
  VIEW_PROMOTION: "view_promotion",
  LOGIN: "login",
  SIGN_UP: "sign_up",
  REC_IMPRESSION: "recommend_impression",
  REC_CLICK: "recommend_click",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  price?: number;
  quantity?: number;
  currency?: string;
  index?: number;
  item_list_id?: string;
  item_list_name?: string;
};

export type TrackPayload = {
  name: AnalyticsEventName | string;
  properties?: Record<string, unknown>;
  path?: string;
  sessionId?: string;
  /** Do not write to Postgres (client-only fan-out). */
  ephemeral?: boolean;
};

export function moneyToMajor(amountKopiyky: number) {
  return Math.round(amountKopiyky) / 100;
}

export function productToAnalyticsItem(input: {
  id: string;
  title: string;
  priceAmount: number;
  brandName?: string | null;
  categoryName?: string | null;
  fandomName?: string | null;
  quantity?: number;
  index?: number;
  listId?: string;
  listName?: string;
}): AnalyticsItem {
  return {
    item_id: input.id,
    item_name: input.title,
    item_brand: input.brandName ?? undefined,
    item_category: input.categoryName ?? undefined,
    item_category2: input.fandomName ?? undefined,
    price: moneyToMajor(input.priceAmount),
    quantity: input.quantity ?? 1,
    currency: "UAH",
    index: input.index,
    item_list_id: input.listId,
    item_list_name: input.listName,
  };
}
