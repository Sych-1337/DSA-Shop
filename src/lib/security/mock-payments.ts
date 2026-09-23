/** Mock checkout is allowed only outside production with PAYMENT_PROVIDER=mock. */
export function isMockPaymentAllowed(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.PAYMENT_PROVIDER === "mock" && env.NODE_ENV !== "production";
}
