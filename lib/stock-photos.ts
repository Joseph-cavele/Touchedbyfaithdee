// Images used by the booking flow — the same slots as the marketing site
// (lib/salon-assets.ts), so only the salon's own photos. Kept as its own
// module so the booking wizard's imports did not change in the rebrand.
import { salonImages } from "./salon-assets"

export const stockPhotos = {
  hero: salonImages.hero.src,
  salonInterior: salonImages.salonInterior.src,
  /* No stock headshots: a stylist without an uploaded photo shows their
     initials (the Avatar's fallback) rather than someone else's face. */
  stylistHeadshots: [] as string[],
}

/** Last-resort thumbnail for a service with no photo: its category's photo
    (never the logo). */
export function serviceThumb(category?: string) {
  return ((category && salonImages.category[category]) || salonImages.category.Makeup).src
}
