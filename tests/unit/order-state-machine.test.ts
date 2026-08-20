import { describe, expect, it } from "vitest";

import { canTransitionOrder } from "@/features/orders/state-machine";

describe("order state machine", () => {
  it("allows NEW → CONFIRMED", () => {
    expect(canTransitionOrder("NEW", "CONFIRMED")).toBe(true);
  });

  it("blocks NEW → SHIPPED", () => {
    expect(canTransitionOrder("NEW", "SHIPPED")).toBe(false);
  });

  it("allows READY_TO_SHIP → SHIPPED", () => {
    expect(canTransitionOrder("READY_TO_SHIP", "SHIPPED")).toBe(true);
  });

  it("blocks CANCELLED transitions", () => {
    expect(canTransitionOrder("CANCELLED", "NEW")).toBe(false);
  });
});
