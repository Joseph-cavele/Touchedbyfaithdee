import { SiteFooter } from "@/components/site/site-footer"
import { SiteGallery } from "@/components/site/site-gallery"
import { SiteHeader } from "@/components/site/site-header"
import { SiteHero } from "@/components/site/site-hero"
import { SiteAbout } from "@/components/site/site-about"
import { SiteContact } from "@/components/site/site-contact"
import { SiteServices } from "@/components/site/site-services"
import { SiteTestimonials } from "@/components/site/site-testimonials"
import { SiteWhyUs } from "@/components/site/site-why-us"
import { salonImages } from "@/lib/salon-assets"
import {
  SALON_EMAIL,
  SALON_HOURS,
  SALON_LOCALITY,
  SALON_NAME,
  SALON_PHONE,
  SALON_POSTAL_CODE,
  SALON_SITE_URL,
  SALON_SOCIALS,
  SALON_STREET_ADDRESS,
} from "@/lib/salon-contact"

/* What Google reads to show the salon's logo, hours and phone in search.
   Built only from the contact details in lib/salon-contact.ts. */
const salonJsonLd = {
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  name: SALON_NAME,
  url: SALON_SITE_URL,
  logo: `${SALON_SITE_URL}${salonImages.logo.src}`,
  image: `${SALON_SITE_URL}/opengraph-image.jpg`,
  telephone: SALON_PHONE,
  email: SALON_EMAIL,
  address: {
    "@type": "PostalAddress",
    streetAddress: SALON_STREET_ADDRESS,
    addressLocality: SALON_LOCALITY,
    postalCode: SALON_POSTAL_CODE,
    addressRegion: "North West",
    addressCountry: "ZA",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: SALON_HOURS.open,
    closes: SALON_HOURS.close,
  },
  sameAs: SALON_SOCIALS.map((s) => s.url).filter(Boolean),
}

/**
 * Section-by-section rebuild: navbar, hero, services, about, why us,
 * gallery, testimonials, contact. Combos are managed on /dashboard/combos
 * and bookable, but not shown on the home page (owner's request).
 * Testimonials only render once real client
 * quotes are added to lib/salon-testimonials.ts. Backgrounds
 * alternate between brand-bg and brand-surface so each section reads as its
 * own band without a divider.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-brand-bg text-brand-text selection:bg-brand-accent selection:text-brand-on-accent">
      <script
        type="application/ld+json"
        // `<` escaped so no value can close the script tag (Next's JSON-LD guide).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(salonJsonLd).replace(/</g, "\\u003c") }}
      />
      <SiteHeader active="Home" logoHref="/login" />

      <SiteHero />
      <SiteServices />
      <SiteAbout />
      <SiteWhyUs />
      <SiteGallery />
      <SiteTestimonials />
      <SiteContact />

      <SiteFooter />
    </div>
  )
}
