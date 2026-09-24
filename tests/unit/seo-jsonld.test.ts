import { describe, expect, it } from "vitest";

import { breadcrumbJsonLd, productJsonLd, websiteJsonLd } from "@/features/seo/json-ld";
import {
  bareSeoPath,
  hreflangLanguages,
  localizedSeoPath,
} from "@/features/seo/locale-path";

describe("seo locale paths", () => {
  it("strips locale prefixes to bare paths", () => {
    expect(bareSeoPath("/uk")).toBe("/");
    expect(bareSeoPath("/en/product/figure")).toBe("/product/figure");
    expect(bareSeoPath("/product/figure")).toBe("/product/figure");
  });

  it("builds localized paths without double slashes", () => {
    expect(localizedSeoPath("uk", "/")).toBe("/uk");
    expect(localizedSeoPath("en", "/product/x")).toBe("/en/product/x");
    expect(localizedSeoPath("ru", "/uk/about")).toBe("/ru/about");
  });

  it("builds hreflang map with x-default", () => {
    const languages = hreflangLanguages("/product/figure");
    expect(languages.uk).toBe("/uk/product/figure");
    expect(languages.en).toBe("/en/product/figure");
    expect(languages.ru).toBe("/ru/product/figure");
    expect(languages["x-default"]).toBe("/uk/product/figure");
  });
});

describe("seo json-ld helpers", () => {
  it("builds breadcrumb list with localized absolute urls", () => {
    const data = breadcrumbJsonLd(
      [
        { name: "Home", path: "/" },
        { name: "Catalog", path: "/catalog" },
      ],
      "en",
    );
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toHaveLength(2);
    expect(data.itemListElement[0]).toMatchObject({ position: 1, name: "Home" });
    expect(String((data.itemListElement[1] as { item: string }).item)).toContain(
      "/en/catalog",
    );
  });

  it("builds product offer without fake ratings", () => {
    const data = productJsonLd({
      name: "Figure",
      path: "/product/figure",
      priceAmount: 199900,
      availability: "InStock",
      locale: "uk",
    });
    expect(data["@type"]).toBe("Product");
    expect(data.offers).toMatchObject({
      "@type": "Offer",
      price: "1999.00",
      priceCurrency: "UAH",
    });
    expect(String((data.offers as { url: string }).url)).toContain("/uk/product/figure");
    expect(data).not.toHaveProperty("aggregateRating");
  });

  it("points SearchAction at locale search", () => {
    const data = websiteJsonLd("D&A", "ru");
    expect(String((data.potentialAction as { target: string }).target)).toContain(
      "/ru/search?q=",
    );
  });
});
