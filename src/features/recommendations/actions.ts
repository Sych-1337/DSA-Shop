"use server";

import { ensureCustomerToken } from "@/features/account/cookie";
import { recordProductInterest } from "@/features/recommendations/service";
import { InterestSignal } from "@/generated/prisma";

export async function recordProductViewAction(productId: string) {
  if (!productId) return;
  try {
    await ensureCustomerToken();
    await recordProductInterest(productId, InterestSignal.VIEW, { createGuest: true });
  } catch {
    // non-blocking
  }
}
