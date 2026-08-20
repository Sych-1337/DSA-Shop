"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { AnalyticsEvents } from "@/features/analytics/events";
import { trackEvent } from "@/features/analytics/service";
import { addToCart, removeCartItem, updateCartItem } from "@/features/cart/service";
import { checkoutSchema } from "@/features/checkout/schema";
import { createCheckoutOrder } from "@/features/checkout/service";
import { recordProductInterest } from "@/features/recommendations/service";
import { InterestSignal } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { translateStoreError } from "@/lib/i18n/store-errors";
import { rateLimit } from "@/lib/security/rate-limit";

export async function addToCartAction(formData: FormData) {
  const t = await getTranslations("errors");
  const variantId = formData.get("variantId")?.toString();
  const quantity = Number(formData.get("quantity") ?? "1");
  if (!variantId) return { ok: false as const, error: t("noVariant") };

  try {
    await addToCart(variantId, quantity);
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        productId: true,
        priceAmount: true,
        product: {
          select: {
            id: true,
            title: true,
            brand: { select: { name: true } },
            primaryCategory: { select: { name: true } },
            fandom: { select: { name: true } },
          },
        },
      },
    });
    if (variant?.productId) {
      await recordProductInterest(variant.productId, InterestSignal.CART, {
        createGuest: true,
      });
      await trackEvent({
        name: AnalyticsEvents.ADD_TO_CART,
        path: "/cart",
        properties: {
          currency: "UAH",
          value: (variant.priceAmount * quantity) / 100,
          items: [
            {
              item_id: variant.product.id,
              item_name: variant.product.title,
              item_brand: variant.product.brand?.name,
              item_category: variant.product.primaryCategory?.name,
              item_category2: variant.product.fandom?.name,
              price: variant.priceAmount / 100,
              quantity,
              currency: "UAH",
            },
          ],
        },
      });
    }
    revalidatePath("/cart");
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error
          ? translateStoreError(t, error.message)
          : t("addFailed"),
    };
  }
}

export async function updateCartItemAction(formData: FormData) {
  const itemId = formData.get("itemId")?.toString();
  const quantity = Number(formData.get("quantity") ?? "1");
  if (!itemId) return;

  try {
    await updateCartItem(itemId, quantity);
    revalidatePath("/cart");
  } catch {
    revalidatePath("/cart");
  }
}

export async function removeCartItemAction(formData: FormData) {
  const itemId = formData.get("itemId")?.toString();
  if (!itemId) return;

  try {
    await removeCartItem(itemId);
    revalidatePath("/cart");
  } catch {
    revalidatePath("/cart");
  }
}

export async function placeOrderAction(formData: FormData) {
  const t = await getTranslations("errors");
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limited = rateLimit({ key: `checkout:${ip}`, limit: 20, windowMs: 60_000 });
  if (!limited.ok) {
    return { ok: false as const, error: t("rateLimited") };
  }

  const parsed = checkoutSchema.safeParse({
    firstName: formData.get("firstName")?.toString(),
    lastName: formData.get("lastName")?.toString(),
    email: formData.get("email")?.toString(),
    phone: formData.get("phone")?.toString(),
    city: formData.get("city")?.toString(),
    shippingMethod: formData.get("shippingMethod")?.toString() ?? "WAREHOUSE",
    warehouseRef: formData.get("warehouseRef")?.toString() || undefined,
    addressLine: formData.get("addressLine")?.toString() || undefined,
    paymentMethod: "ONLINE",
    customerNote: formData.get("customerNote")?.toString() || undefined,
    idempotencyKey: formData.get("idempotencyKey")?.toString(),
    couponCode: formData.get("couponCode")?.toString() || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      error: t("formInvalid"),
    };
  }

  try {
    const result = await createCheckoutOrder(parsed.data);
    await trackEvent({
      name: AnalyticsEvents.BEGIN_CHECKOUT,
      path: "/checkout",
      properties: {
        currency: result.order.currency ?? "UAH",
        value: result.order.totalAmount / 100,
        transaction_id: result.order.orderNumber,
      },
    });
    revalidatePath("/cart");
    revalidatePath("/checkout");
    return {
      ok: true as const,
      redirectUrl: result.redirectUrl,
      orderNumber: result.order.orderNumber,
    };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error
          ? translateStoreError(t, error.message)
          : t("checkoutFailed"),
    };
  }
}
