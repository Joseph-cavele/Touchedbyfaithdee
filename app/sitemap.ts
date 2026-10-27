import type { MetadataRoute } from "next"
import { SALON_SITE_URL } from "@/lib/salon-contact"
import { featuredServices, serviceSlug } from "@/lib/salon-services"

/* The public pages, so Google finds them (and the logo) without waiting to
   stumble on a link. /services/[slug] lists the same pages
   generateStaticParams builds. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SALON_SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SALON_SITE_URL}/book`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SALON_SITE_URL}/services`, changeFrequency: "weekly", priority: 0.8 },
    ...featuredServices.map((service) => ({
      url: `${SALON_SITE_URL}/services/${serviceSlug(service.name)}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ]
}
