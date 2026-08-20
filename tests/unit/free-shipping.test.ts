import { describe, expect, it } from "vitest";

import { FREE_SHIPPING_THRESHOLD } from "@/features/cart/cookie";

function freeShippingProgress(subtotalAmount: number) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalAmount);
  return {
    threshold: FREE_SHIPPING_THRESHOLD,
    remaining,
    reached: remaining === 0,
    percent: Math.min(100, Math.round((subtotalAmount / FREE_SHIPPING_THRESHOLD) * 100)),
  };
}

describe("free shipping progress", () => {
  it("tracks remaining amount", () => {
    const progress = freeShippingProgress(100_000);
    expect(progress.reached).toBe(false);
    expect(progress.remaining).toBe(50_000);
  });

  it("marks threshold reached", () => {
    const progress = freeShippingProgress(FREE_SHIPPING_THRESHOLD);
    expect(progress.reached).toBe(true);
    expect(progress.percent).toBe(100);
  });
});
