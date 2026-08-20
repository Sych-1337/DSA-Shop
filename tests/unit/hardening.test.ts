import { beforeEach, describe, expect, it } from "vitest";

import { isAdminAuthBypassEnabled } from "@/lib/auth/bypass";
import { rateLimit, resetRateLimitBuckets } from "@/lib/security/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimitBuckets();
  });

  it("allows up to limit then blocks", () => {
    expect(rateLimit({ key: "t", limit: 2, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit({ key: "t", limit: 2, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit({ key: "t", limit: 2, windowMs: 60_000 }).ok).toBe(false);
  });
});

describe("admin auth bypass", () => {
  it("never enables in production even if env set", () => {
    expect(
      isAdminAuthBypassEnabled({
        NODE_ENV: "production",
        ADMIN_AUTH_BYPASS: "true",
      } as NodeJS.ProcessEnv),
    ).toBe(false);
  });

  it("enables in development when flagged", () => {
    expect(
      isAdminAuthBypassEnabled({
        NODE_ENV: "development",
        ADMIN_AUTH_BYPASS: "true",
      } as NodeJS.ProcessEnv),
    ).toBe(true);
  });
});
