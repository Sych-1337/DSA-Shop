/** Local-only admin open gate. Never active when NODE_ENV=production. */
export function isAdminAuthBypassEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.ADMIN_AUTH_BYPASS === "true" && env.NODE_ENV !== "production";
}
