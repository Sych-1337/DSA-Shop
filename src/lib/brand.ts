/** Canonical storefront brand — display only; never invent a second name in UI. */
export const STORE_BRAND = {
  name: "D&A",
  /** Spoken expansion of D & A */
  expansion: "Dreams & Anime",
  /** Default metadata / SEO title fragment */
  titleSuffix: "Dreams & Anime Shop",
  /** Short line under the wordmark in chrome */
  tagline: "Dreams & Anime",
} as const;

export function storeDisplayName(setting?: string | null): string {
  return setting?.trim() || STORE_BRAND.name;
}

export function storeTagline(setting?: string | null): string {
  return setting?.trim() || STORE_BRAND.tagline;
}
