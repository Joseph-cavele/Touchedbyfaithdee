import type { MetadataRoute } from "next"
import { SALON_SITE_URL } from "@/lib/salon-contact"

/* Public pages are open to search engines; the owner's and stylists' areas,
   sign-in and the API are not worth crawling. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/stylist", "/login", "/api/"],
    },
    sitemap: `${SALON_SITE_URL}/sitemap.xml`,
  }
}
