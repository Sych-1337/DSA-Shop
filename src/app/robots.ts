import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/features/seo/service";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/cart", "/checkout", "/api"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
