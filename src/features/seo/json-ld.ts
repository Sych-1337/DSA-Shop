import { defaultLocale } from "@/i18n/config";

import { localizedSeoPath, resolveAppLocale } from "./locale-path";

export function absoluteUrl(path: string) {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function jsonLdScript(data: Record<string, unknown> | Record<string, unknown>[]) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}

export function organizationJsonLd(storeName: string, locale: string = defaultLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeName,
    url: absoluteUrl(localizedSeoPath(locale, "/")),
  };
}

export function websiteJsonLd(storeName: string, locale: string = defaultLocale) {
  const home = absoluteUrl(localizedSeoPath(locale, "/"));
  const searchPath = absoluteUrl(localizedSeoPath(locale, "/search"));
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: storeName,
    url: home,
    inLanguage: resolveAppLocale(locale),
    potentialAction: {
      "@type": "SearchAction",
      target: `${searchPath}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
  locale: string = defaultLocale,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(localizedSeoPath(locale, item.path)),
    })),
  };
}

export function productJsonLd(input: {
  name: string;
  description?: string | null;
  path: string;
  imageUrl?: string | null;
  priceAmount: number;
  currency?: string;
  availability: "InStock" | "OutOfStock" | "PreOrder";
  brandName?: string | null;
  locale?: string;
}) {
  const locale = input.locale ?? defaultLocale;
  const path = localizedSeoPath(locale, input.path);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description ?? undefined,
    image: input.imageUrl ?? undefined,
    brand: input.brandName ? { "@type": "Brand", name: input.brandName } : undefined,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(path),
      priceCurrency: input.currency ?? "UAH",
      price: (input.priceAmount / 100).toFixed(2),
      availability: `https://schema.org/${input.availability}`,
    },
  };
}

export function blogPostingJsonLd(input: {
  title: string;
  description?: string | null;
  path: string;
  publishedAt?: Date | null;
  authorName?: string | null;
  imageUrl?: string | null;
  locale?: string;
}) {
  const locale = input.locale ?? defaultLocale;
  const path = localizedSeoPath(locale, input.path);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description ?? undefined,
    url: absoluteUrl(path),
    inLanguage: locale,
    datePublished: input.publishedAt?.toISOString(),
    author: input.authorName
      ? { "@type": "Person", name: input.authorName }
      : undefined,
    image: input.imageUrl ?? undefined,
  };
}

export function collectionPageJsonLd(input: {
  name: string;
  description?: string | null;
  path: string;
  locale?: string;
}) {
  const locale = input.locale ?? defaultLocale;
  const path = localizedSeoPath(locale, input.path);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description ?? undefined,
    url: absoluteUrl(path),
    inLanguage: locale,
  };
}
