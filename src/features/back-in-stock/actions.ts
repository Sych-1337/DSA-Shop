"use server";

import { getLocale, getTranslations } from "next-intl/server";

import { subscribeBackInStock } from "@/features/back-in-stock/service";

export async function subscribeBackInStockAction(formData: FormData) {
  const t = await getTranslations("product");
  const email = formData.get("email")?.toString() ?? "";
  const productId = formData.get("productId")?.toString() ?? "";
  const variantId = formData.get("variantId")?.toString() ?? "";
  const locale = (await getLocale()) as "uk" | "en" | "ru";

  try {
    await subscribeBackInStock({ email, productId, variantId, locale });
    return { ok: true as const, message: t("bisSubscribed") };
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    switch (code) {
      case "INVALID_EMAIL":
        return { ok: false as const, error: t("bisInvalidEmail") };
      case "ALREADY_IN_STOCK":
        return { ok: false as const, error: t("bisAlreadyInStock") };
      case "PRODUCT_UNAVAILABLE":
        return { ok: false as const, error: t("bisUnavailable") };
      default:
        console.error("[back-in-stock]", error);
        return { ok: false as const, error: t("bisFailed") };
    }
  }
}
