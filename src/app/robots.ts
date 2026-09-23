import type { MetadataRoute } from "next";
import { isProductionApp } from "@/lib/app-env";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  if (!isProductionApp()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/owner/",
        "/today",
        "/tomorrow",
        "/help",
        "/login",
        "/signup",
        "/legal/",
        "/api/",
        "/auth/",
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
