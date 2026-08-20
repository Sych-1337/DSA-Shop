import { cookies } from "next/headers";

export const CART_COOKIE = "kawaiko_cart";
export const RESERVATION_TTL_MINUTES = 15;
export const FREE_SHIPPING_THRESHOLD = 150_000; // 1500 UAH

export async function getCartToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(CART_COOKIE)?.value ?? null;
}

/** Only call from Server Actions / Route Handlers — mutates cookies. */
export async function ensureCartToken(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CART_COOKIE)?.value;
  if (existing) return existing;

  const token = crypto.randomUUID();
  jar.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}
