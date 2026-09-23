import { describe, expect, it } from "vitest";

import {
  createOrderAccessToken,
  normalizeEmail,
  verifyOrderAccessToken,
} from "@/lib/security/order-access";
import { safeAdminNext } from "@/lib/security/admin-next";

describe("order access token", () => {
  it("round-trips order + email", () => {
    const token = createOrderAccessToken("KW-1", "A@B.com");
    expect(verifyOrderAccessToken(token, "KW-1", "a@b.com")).toBe(true);
    expect(verifyOrderAccessToken(token, "KW-2", "a@b.com")).toBe(false);
    expect(normalizeEmail(" A@B.com ")).toBe("a@b.com");
  });
});

describe("safeAdminNext", () => {
  it("rejects open redirects", () => {
    expect(safeAdminNext("/admin/orders")).toBe("/admin/orders");
    expect(safeAdminNext("https://evil.test")).toBe("/admin");
    expect(safeAdminNext("//evil.test")).toBe("/admin");
    expect(safeAdminNext("/store")).toBe("/admin");
  });
});
