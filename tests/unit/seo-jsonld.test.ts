import { describe, expect, it } from "vitest";

import { breadcrumbJsonLd, productJsonLd } from "@/features/seo/json-ld";

describe("seo json-ld helpers", () => {
  it("builds breadcrumb list with positions", () => {
    const data = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Catalog", path: "/catalog" },
    ]);
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toHaveLength(2);
    expect(data.itemListElement[0]).toMatchObject({ position: 1, name: "Home" });
  });

  it("builds product offer without fake ratings", () => {
    const data = productJsonLd({
      name: "Figure",
      path: "/product/figure",
      priceAmount: 199900,
      availability: "InStock",
    });
    expect(data["@type"]).toBe("Product");
    expect(data.offers).toMatchObject({
      "@type": "Offer",
      price: "1999.00",
      priceCurrency: "UAH",
    });
    expect(data).not.toHaveProperty("aggregateRating");
  });
});
