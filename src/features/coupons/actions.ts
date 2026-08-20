"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { applyCouponToCart, removeCartCoupon } from "@/features/coupons/service";
import { translateStoreError } from "@/lib/i18n/store-errors";

function revalidateCartPaths() {
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export async function applyCouponAction(formData: FormData) {
  const t = await getTranslations("errors");
  const code = formData.get("code")?.toString() ?? "";
  const email = formData.get("email")?.toString() || undefined;

  try {
    await applyCouponToCart(code, email);
    revalidateCartPaths();
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error
          ? translateStoreError(t, error.message)
          : t("couponFailed"),
    };
  }
}

export async function removeCouponAction() {
  try {
    await removeCartCoupon();
    revalidateCartPaths();
    return { ok: true as const };
  } catch {
    revalidateCartPaths();
    return { ok: false as const };
  }
}
