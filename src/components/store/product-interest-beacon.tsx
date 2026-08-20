"use client";

import { useEffect } from "react";

import { recordProductViewAction } from "@/features/recommendations/actions";

/** Fire-and-forget VIEW signal so guest affinity works without mutating cookies in RSC. */
export function ProductInterestBeacon({ productId }: { productId: string }) {
  useEffect(() => {
    void recordProductViewAction(productId);
  }, [productId]);

  return null;
}
