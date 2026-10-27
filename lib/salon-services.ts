// Touchedbyfaithdee Studio's service list — the ONE copy.
//
// Both halves of the app read from here: the marketing pages (/, /services)
// render it directly, and `npm run seed` upserts it into the `Service`
// collection that drives booking. So a name, price or category changes in
// one place and the price list and the booking flow can never disagree.
//
// PRICES are the studio's own (owner, 2026-10-27). `price: null` renders as
// "Price on request" — never R0. Set it here (and re-run the seed) or in the
// dashboard once the studio confirms it.
//
// DURATION: every appointment is booked as 2 hours (confirmed by the salon,
// 2026-10-18), except Bridal Full Day, which takes the whole day. It drives
// the booking calendar.

import { formatPrice } from "./currency"
import { salonImages, serviceImage } from "./salon-assets"
import { SALON_HOURS } from "./salon-contact"

/** Must match SERVICE_CATEGORIES in features/services/schema.ts. */
export type SalonServiceCategory = "Makeup" | "Hair" | "Combos"

export type SalonService = {
  name: string
  category: SalonServiceCategory
  /** Rand. `null` = not confirmed yet, shown as "Price on request". */
  price: number | null
  /** Minutes — see the note at the top. */
  duration: number
  description: string
  /** Combos only: the checklist of what's included. */
  includes?: string[]
}

/** Minutes. Every service is a 2-hour appointment, except a full day. */
const TWO_HOURS = 120

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}
/** Minutes. Opening to closing, so it only fits a booking at opening time
    and holds the whole day on the calendar. */
const FULL_DAY = toMinutes(SALON_HOURS.close) - toMinutes(SALON_HOURS.open)

const MAKEUP = "Flawless finish with high-quality premium products."

/* Touchedbyfaithdee Studio's services, one photo each in
   public/Touched-by-services (lib/salon-assets.ts). */
export const salonServices: SalonService[] = [
  // ── Makeup ──────────────────────────────────────────────────────────
  { name: "Occasional makeup", category: "Makeup", price: 750, duration: TWO_HOURS, description: `Makeup for parties, events and any occasion worth dressing up for. ${MAKEUP}` },
  { name: "Matric dance makeup", category: "Makeup", price: 750, duration: TWO_HOURS, description: `A glam look made to last all night for your matric dance. ${MAKEUP}` },

  // ── Bridal makeup ───────────────────────────────────────────────────
  { name: "Bridal Makeup and Go", category: "Makeup", price: 1700, duration: TWO_HOURS, description: `Bridal makeup for your big day — done, then you're on your way. ${MAKEUP}` },
  { name: "Bridal Full Day", category: "Makeup", price: 3700, duration: FULL_DAY, description: `Bridal makeup with your artist on hand for the whole day. Books the full day. ${MAKEUP}` },

  // ── Hair ────────────────────────────────────────────────────────────
  { name: "Basic hair installation", category: "Hair", price: 300, duration: TWO_HOURS, description: "A basic hair installation, neatly finished." },
  { name: "Frontal ponytail (own fibre)", category: "Hair", price: 600, duration: TWO_HOURS, description: "A sleek frontal ponytail, installed with fibre you bring yourself." },
  { name: "Messy updo bun", category: "Hair", price: 850, duration: TWO_HOURS, description: "A soft, messy updo bun with laid edges and loose curled tendrils." },
]

/** URL segment for a service — also half of the seed's upsert key. */
export const serviceSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

/* ── Marketing views ──────────────────────────────────────────────────── */

export type ServiceItem = {
  name: string
  /** Display string: Rand, or "Price on request". */
  price: string
}

export type ServiceCategory = {
  title: string
  items: ServiceItem[]
}

const CATEGORY_ORDER: SalonServiceCategory[] = ["Makeup", "Hair", "Combos"]

/* Categories with no services yet (Combos, until the owner adds one) are
   left out rather than shown as an empty heading. */
export const serviceCategories: ServiceCategory[] = CATEGORY_ORDER.map((category) => ({
  title: category,
  items: salonServices
    .filter((s) => s.category === category)
    .map((s) => ({ name: s.name, price: formatPrice(s.price) })),
})).filter((c) => c.items.length > 0)

export type FeaturedService = {
  name: string
  from: string
  description: string
  image: string
  alt: string
  /**
   * Aggregate score out of 5, and how many reviews it came from. Left unset:
   * the card shows a rating row only when both exist, and there are no real
   * reviews yet. Never fill these with invented numbers.
   */
  rating?: number
  reviewCount?: number
}

/** The services that lead the home page and get a detail page. */
// Six cards (two rows of three). Bridal Full Day is on /services and in
// the price list.
const FEATURED = ["Occasional makeup", "Matric dance makeup", "Bridal Makeup and Go", "Basic hair installation", "Frontal ponytail (own fibre)", "Messy updo bun"]

export const featuredServices: FeaturedService[] = FEATURED.map((name) => {
  const s = salonServices.find((x) => x.name === name)
  if (!s) throw new Error(`salon-services: featured service "${name}" is not in the list`)
  const img = serviceImage(s.name, s.category)
  return { name: s.name, from: formatPrice(s.price), description: s.description, image: img.src, alt: img.alt }
})

export type CatalogItem = ServiceItem & {
  description?: string
  image?: string
  alt?: string
}

export type CatalogCategory = {
  title: string
  items: CatalogItem[]
}

export const serviceCatalog: CatalogCategory[] = CATEGORY_ORDER.map((category) => {
  return {
    title: category,
    items: salonServices
      .filter((s) => s.category === category)
      .map((s) => {
        const img = serviceImage(s.name, s.category)
        return {
          name: s.name,
          price: formatPrice(s.price),
          description: s.description,
          image: img.src,
          alt: img.alt,
        }
      }),
  }
}).filter((c) => c.items.length > 0)

/** Service name → its photo, for the booking wizard (which reads services from the DB). */
export const serviceImageByName: Record<string, { image: string; alt: string }> =
  Object.fromEntries(
    salonServices.map((s) => {
      const img = serviceImage(s.name, s.category)
      return [s.name, { image: img.src, alt: img.alt }]
    })
  )

/** "Recent work" gallery tiles — see lib/salon-assets.ts to fill them. */
export const galleryItems = salonImages.gallery
