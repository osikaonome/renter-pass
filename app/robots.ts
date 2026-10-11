import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Profiles, requests and documents must never be indexed. Pages also send
      // noindex, since robots.txt alone doesn't stop indexing of linked URLs.
      disallow: ["/p/", "/r/", "/v/", "/api/", "/dashboard", "/profile", "/documents", "/household", "/links", "/requests", "/settings"],
    },
  };
}
