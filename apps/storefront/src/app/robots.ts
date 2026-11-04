import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing private or per-visitor belongs in an index.
      disallow: ["/account", "/account/", "/cart", "/checkout", "/api/", "/auth/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
