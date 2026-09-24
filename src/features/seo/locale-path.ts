import {
  defaultLocale,
  isAppLocale,
  locales,
  type AppLocale,
} from "@/i18n/config";

/** Open Graph locale tags for storefront languages. */
export const ogLocaleByAppLocale: Record<AppLocale, string> = {
  uk: "uk_UA",
  en: "en_US",
  ru: "ru_RU",
};

/** Strip a leading /uk|/en|/ru prefix so paths are locale-agnostic. */
export function bareSeoPath(path: string): string {
  const raw = path.trim() || "/";
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  for (const locale of locales) {
    if (normalized === `/${locale}`) return "/";
    if (normalized.startsWith(`/${locale}/`)) {
      const rest = normalized.slice(locale.length + 1);
      return rest ? (rest.startsWith("/") ? rest : `/${rest}`) : "/";
    }
  }
  return normalized === "" ? "/" : normalized;
}

export function resolveAppLocale(value?: string | null): AppLocale {
  if (value && isAppLocale(value)) return value;
  return defaultLocale;
}

/** `/{locale}` or `/{locale}/product/slug` (never double-slash). */
export function localizedSeoPath(locale: string, path: string): string {
  const appLocale = resolveAppLocale(locale);
  const bare = bareSeoPath(path);
  if (bare === "/") return `/${appLocale}`;
  return `/${appLocale}${bare}`;
}

/**
 * hreflang map for Metadata.alternates.languages.
 * Values are pathnames (Next Metadata resolves against metadataBase).
 */
export function hreflangLanguages(path: string): Record<string, string> {
  const bare = bareSeoPath(path);
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = localizedSeoPath(locale, bare);
  }
  languages["x-default"] = localizedSeoPath(defaultLocale, bare);
  return languages;
}
