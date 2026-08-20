import { describe, expect, it } from "vitest";

import { addMoney, formatMoney, percentOf, toMinorUnits } from "@/lib/money";

describe("money helpers", () => {
  it("adds integer amounts", () => {
    expect(addMoney(100, 250, 50)).toBe(400);
  });

  it("rejects float amounts", () => {
    expect(() => addMoney(10.5)).toThrow();
  });

  it("calculates percent via basis points", () => {
    expect(percentOf(10_000, 700)).toBe(700); // 7% of 100.00
  });

  it("formats UAH", () => {
    const formatted = formatMoney(15_000);
    expect(formatted).toContain("150");
  });

  it("converts major to minor", () => {
    expect(toMinorUnits(12.5)).toBe(1250);
  });
});
