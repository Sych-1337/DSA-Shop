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

export function organizationJsonLd(storeName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeName,
    url: absoluteUrl("/"),
  };
}

export function websiteJsonLd(storeName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: storeName,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description ?? undefined,
    image: input.imageUrl ?? undefined,
    brand: input.brandName ? { "@type": "Brand", name: input.brandName } : undefined,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(input.path),
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description ?? undefined,
    url: absoluteUrl(input.path),
    datePublished: input.publishedAt?.toISOString(),
    author: input.authorName
      ? { "@type": "Person", name: input.authorName }
      : undefined,
    image: input.imageUrl ?? undefined,
  };
}
