import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import { bumpRedirectHit, findActiveRedirect } from "@/features/seo/service";
import { routing } from "@/i18n/routing";
import { locales } from "@/i18n/config";

const handleI18n = createMiddleware(routing);

function stripLocalePrefix(pathname: string) {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || "/";
    }
  }
  return pathname;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Soft-launch: never serve the store over plain HTTP in production.
  const proto = request.headers.get("x-forwarded-proto");
  if (
    process.env.NODE_ENV === "production" &&
    proto === "http" &&
    !pathname.startsWith("/api/health")
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 308);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/webhooks") ||
    pathname.startsWith("/admin") ||
    pathname.includes(".")
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // SEO redirects match unprefixed paths and rewrite to current locale
  const barePath = stripLocalePrefix(pathname);
  try {
    const redirectRule = await findActiveRedirect(barePath);
    if (redirectRule) {
      void bumpRedirectHit(redirectRule.id);
      const locale =
        locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)) ??
        routing.defaultLocale;
      const to =
        redirectRule.toPath === "/"
          ? `/${locale}`
          : `/${locale}${redirectRule.toPath.startsWith("/") ? redirectRule.toPath : `/${redirectRule.toPath}`}`;
      return NextResponse.redirect(new URL(to, request.url), redirectRule.statusCode);
    }
  } catch {
    // fail open into i18n
  }

  return handleI18n(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
