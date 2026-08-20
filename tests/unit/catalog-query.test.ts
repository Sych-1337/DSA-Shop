import { describe, expect, it } from "vitest";

import { parseCatalogSearchParams } from "@/features/catalog/schema";

describe("catalog query parsing", () => {
  it("applies defaults", () => {
    const query = parseCatalogSearchParams({});
    expect(query.page).toBe(1);
    expect(query.pageSize).toBe(12);
    expect(query.sort).toBe("popular");
    expect(query.inStock).toBe(false);
  });

  it("parses filters", () => {
    const query = parseCatalogSearchParams({
      q: "neko",
      category: "figures",
      inStock: "1",
      onSale: "true",
      sort: "price_asc",
      page: "2",
    });
    expect(query.q).toBe("neko");
    expect(query.category).toBe("figures");
    expect(query.inStock).toBe(true);
    expect(query.onSale).toBe(true);
    expect(query.sort).toBe("price_asc");
    expect(query.page).toBe(2);
  });
});
