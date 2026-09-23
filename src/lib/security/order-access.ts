import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function secret(): string {
  return (
    process.env.BETTER_AUTH_SECRET?.trim() ||
    process.env.ENCRYPTION_KEY?.trim() ||
    "dev-insecure-order-access-secret"
  );
}

function b64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64").toString(
    "utf8",
  );
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createOrderAccessToken(
  orderNumber: string,
  email: string,
  ttlMs = DEFAULT_TTL_MS,
): string {
  const payload = {
    o: orderNumber,
    e: normalizeEmail(email),
    exp: Date.now() + ttlMs,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", secret()).update(body).digest();
  return `${body}.${b64url(sig)}`;
}

export function verifyOrderAccessToken(
  token: string,
  orderNumber: string,
  email?: string,
): boolean {
  try {
    const [body, sigPart] = token.split(".");
    if (!body || !sigPart) return false;
    const expected = createHmac("sha256", secret()).update(body).digest();
    const got = Buffer.from(
      sigPart.replace(/-/g, "+").replace(/_/g, "/") +
        "=".repeat((4 - (sigPart.length % 4)) % 4),
      "base64",
    );
    if (expected.length !== got.length || !timingSafeEqual(expected, got)) {
      return false;
    }
    const payload = JSON.parse(fromB64url(body)) as {
      o?: string;
      e?: string;
      exp?: number;
    };
    if (!payload.o || !payload.e || !payload.exp) return false;
    if (payload.exp < Date.now()) return false;
    if (payload.o !== orderNumber) return false;
    if (email && normalizeEmail(email) !== payload.e) return false;
    return true;
  } catch {
    return false;
  }
}
