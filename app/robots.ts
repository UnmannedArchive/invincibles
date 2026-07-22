import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Shared seasons are public but endless; there is nothing to index.
      disallow: ["/r/", "/api/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
