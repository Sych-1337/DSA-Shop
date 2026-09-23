export function safeAdminNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/admin") || next.startsWith("//") || next.includes("://")) {
    return "/admin";
  }
  return next;
}
