import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Shared seasons and leagues are public but endless; nothing to index.
      disallow: ["/r/", "/l/", "/api/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
