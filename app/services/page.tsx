import type { Metadata } from "next"

import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { SiteServiceCards } from "@/components/site/site-service-cards"
import { SiteServicesCatalog } from "@/components/site/site-services-catalog"
import { SiteServicesHero } from "@/components/site/site-services-hero"

export const metadata: Metadata = {
  title: "Services & Prices | Touchedbyfaithdee Studio",
  description:
    "Makeup, bridal makeup and hair at Touchedbyfaithdee Studio in Tlhabane, North West — every service and its price.",
}

/**
 * Laid out to match the reference design: carousel hero, then the centred
 * "Our Services List" heading over a 3×2 grid of medallion cards, then the
 * footer.
 *
 * The full price list sits below that, read from lib/salon-services.ts.
 */
export default function ServicesPage() {
  return (
    <div className="flex flex-1 flex-col bg-brand-bg text-brand-text selection:bg-brand-accent selection:text-brand-on-accent">
      <SiteHeader active="Services" />

      <SiteServicesHero />
      <SiteServiceCards />

      <section className="pb-16 sm:pb-20">
        <SiteServicesCatalog />
      </section>

      <SiteFooter />
    </div>
  )
}
