import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://hireable.work"

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/sign-up", "/sign-in"],
        disallow: ["/admin/", "/orders/", "/request/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
