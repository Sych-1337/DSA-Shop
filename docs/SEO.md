# SEO

## Storefront

- Next.js Metadata API via `buildEntityMetadata`
- **Locale-prefixed canonicals** (`/uk/...`, `/en/...`, `/ru/...`)
- **hreflang** for all three locales + `x-default` → `uk`
- Dynamic sitemap + robots
- Breadcrumbs UI + BreadcrumbList JSON-LD (locale-aware URLs)
- Product + Offer (+ AggregateRating only when real)
- CollectionPage JSON-LD on catalog / category / collection / fandom
- Organization + WebSite SearchAction (locale search URL)
- Open Graph / Twitter cards with correct `og:locale`
- Redirects on slug change (DB `Redirect`, applied in `proxy.ts`)
- `noindex`: cart, checkout, account, wishlist, track-order, search, thin filter/pagination combos
- Never fake ratings in structured data

## Locales

Primary locale `uk` (x-default). Live alternate URLs for `en` and `ru` (`localePrefix: "always"`).

Admin `SeoMeta.canonicalPath` may be bare (`/product/slug`) or localized — both are normalized before output.

## Admin SEO tools

Per entity: slug, title, meta description, H1, canonical, index/noindex, OG image.

Global (current): redirects list/create/toggle.

Still planned: 404 report, missing metadata, duplicate slugs, broken links, images without alt, completeness indicator.

## Checklist before indexing

1. `APP_URL` = production HTTPS domain
2. Submit `https://{domain}/sitemap.xml` in Search Console
3. Spot-check canonical + hreflang on home, PDP, category
4. Confirm soft-launch pages (cart/checkout/account) stay noindex
