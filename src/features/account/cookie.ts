import { cookies } from "next/headers";

export const CUSTOMER_COOKIE = "kawaiko_customer";

export async function getCustomerToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(CUSTOMER_COOKIE)?.value ?? null;
}

/** Only call from Server Actions / Route Handlers — mutates cookies. */
export async function ensureCustomerToken(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CUSTOMER_COOKIE)?.value;
  if (existing) return existing;

  const token = crypto.randomUUID();
  jar.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return token;
}
