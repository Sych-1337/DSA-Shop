"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { ensureCustomerToken } from "@/features/account/cookie";
import { AnalyticsEvents } from "@/features/analytics/events";
import { trackEvent } from "@/features/analytics/service";
import { recordProductInterest } from "@/features/recommendations/service";
import {
  addWishlistToCart,
  createWishlist,
  deleteWishlist,
  removeWishlistItem,
  renameWishlist,
  setDefaultWishlist,
  setWishlistShare,
  toggleWishlistProduct,
} from "@/features/wishlist/service";
import { InterestSignal } from "@/generated/prisma";

function revalidateWishlistPaths() {
  revalidatePath("/wishlist");
  revalidatePath("/account");
  revalidatePath("/account/wishlist");
  revalidatePath("/catalog");
  revalidatePath("/cart");
  revalidatePath("/");
}

async function translateWishlistError(error: unknown) {
  const t = await getTranslations("wishlist");
  const code = error instanceof Error ? error.message : "UNKNOWN";
  switch (code) {
    case "LIST_NAME_INVALID":
      return t("errorName");
    case "LIST_LIMIT":
      return t("errorLimit");
    case "LIST_LAST":
      return t("errorLast");
    case "LIST_NOT_FOUND":
      return t("errorNotFound");
    case "PRODUCT_UNAVAILABLE":
      return t("errorProduct");
    case "ITEM_NOT_FOUND":
      return t("errorItem");
    case "IDENTITY_REQUIRED":
      return t("errorGeneric");
    default:
      console.error("[wishlist]", error);
      return t("errorGeneric");
  }
}

export async function createWishlistAction(formData: FormData) {
  const t = await getTranslations("wishlist");
  const name = formData.get("name")?.toString() ?? "";
  try {
    await ensureCustomerToken();
    const list = await createWishlist(name, t("defaultListName"));
    revalidateWishlistPaths();
    return { ok: true as const, listId: list.id };
  } catch (error) {
    return { ok: false as const, error: await translateWishlistError(error) };
  }
}

export async function renameWishlistAction(formData: FormData) {
  const listId = formData.get("listId")?.toString();
  const name = formData.get("name")?.toString() ?? "";
  if (!listId) {
    const t = await getTranslations("wishlist");
    return { ok: false as const, error: t("errorNotFound") };
  }
  try {
    await renameWishlist(listId, name);
    revalidateWishlistPaths();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: await translateWishlistError(error) };
  }
}

export async function deleteWishlistAction(formData: FormData) {
  const listId = formData.get("listId")?.toString();
  if (!listId) {
    const t = await getTranslations("wishlist");
    return { ok: false as const, error: t("errorNotFound") };
  }
  try {
    await deleteWishlist(listId);
    revalidateWishlistPaths();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: await translateWishlistError(error) };
  }
}

export async function setDefaultWishlistAction(formData: FormData) {
  const listId = formData.get("listId")?.toString();
  if (!listId) return { ok: false as const };
  try {
    await setDefaultWishlist(listId);
    revalidateWishlistPaths();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: await translateWishlistError(error) };
  }
}

export async function toggleWishlistProductAction(formData: FormData) {
  const t = await getTranslations("wishlist");
  const productId = formData.get("productId")?.toString();
  const listId = formData.get("listId")?.toString() || null;
  if (!productId) {
    return { ok: false as const, error: t("errorProduct") };
  }
  try {
    // Ensure guest cookie is writable before any DB work (Server Action only).
    await ensureCustomerToken();
    const result = await toggleWishlistProduct(productId, listId, t("defaultListName"));
    if (result.added) {
      await recordProductInterest(productId, InterestSignal.WISHLIST, { createGuest: true });
      await trackEvent({
        name: AnalyticsEvents.ADD_TO_WISHLIST,
        path: "/wishlist",
        properties: { item_id: productId },
      });
    }
    revalidateWishlistPaths();
    return { ok: true as const, ...result };
  } catch (error) {
    return { ok: false as const, error: await translateWishlistError(error) };
  }
}

export async function removeWishlistItemAction(formData: FormData) {
  const itemId = formData.get("itemId")?.toString();
  if (!itemId) return { ok: false as const };
  try {
    await removeWishlistItem(itemId);
    revalidateWishlistPaths();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: await translateWishlistError(error) };
  }
}

export async function setWishlistShareAction(formData: FormData) {
  const listId = formData.get("listId")?.toString();
  const enabled = formData.get("enabled")?.toString() === "true";
  if (!listId) {
    const t = await getTranslations("wishlist");
    return { ok: false as const, error: t("errorNotFound") };
  }
  try {
    const list = await setWishlistShare(listId, enabled);
    revalidateWishlistPaths();
    return {
      ok: true as const,
      isPublic: list.isPublic,
      shareToken: list.shareToken,
    };
  } catch (error) {
    return { ok: false as const, error: await translateWishlistError(error) };
  }
}

export async function addWishlistToCartAction(formData: FormData) {
  const t = await getTranslations("wishlist");
  const listId = formData.get("listId")?.toString() || null;
  try {
    await ensureCustomerToken();
    const result = await addWishlistToCart(listId);
    revalidateWishlistPaths();
    if (result.added === 0 && result.skipped > 0) {
      return { ok: false as const, error: t("buyAllNone"), ...result };
    }
    return {
      ok: true as const,
      ...result,
      message: t("buyAllResult", { added: result.added, skipped: result.skipped }),
    };
  } catch (error) {
    return { ok: false as const, error: await translateWishlistError(error) };
  }
}
