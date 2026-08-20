"use server";

import { revalidatePath } from "next/cache";

import { mergeGuestCustomerAfterAuth } from "@/features/account/merge";

export async function mergeGuestAfterAuthAction() {
  try {
    const result = await mergeGuestCustomerAfterAuth();
    revalidatePath("/account");
    revalidatePath("/wishlist");
    revalidatePath("/");
    return { ok: true as const, ...result };
  } catch {
    return { ok: false as const };
  }
}
