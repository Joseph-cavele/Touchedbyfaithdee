/* ══════════════════════════════════════════════════════════════════════
   THE SALON'S CONTACT DETAILS — one copy, imported by every public page.

   Touchedbyfaithdee Studio. Name, numbers, email and address are as the
   owner supplied them (2026-10-26).
   They are printed on the site, dialled from a phone and used to reach the
   business, so do not substitute a placeholder into any of them.

   lib/models/Settings.ts holds the same details as editable defaults for
   the dashboard. Kept in step by hand — that model cannot import this file.
   ══════════════════════════════════════════════════════════════════════ */

export const SALON_NAME = "Touchedbyfaithdee Studio"

/** The live site's canonical address (the bare domain redirects here), for
    the sitemap, robots.txt and Google's business data. No trailing slash.
    TODO(client): still La-fe's domain — replace with the studio's own. */
export const SALON_SITE_URL = "https://www.lafebeauty.co.za"

/** The person customers deal with. */
export const SALON_CONTACT_PERSON = "Kegomoditse Faith Diale"

/** Dialable form, for `tel:` links. International so it works from abroad. */
export const SALON_PHONE = "+27739790375"

/** Same number, spaced for reading. Never put this in an href. */
export const SALON_PHONE_DISPLAY = "073 979 0375"

/** The studio's second line — calls only; WhatsApp is on the main number. */
export const SALON_PHONE_ALT = "+27730700375"
export const SALON_PHONE_ALT_DISPLAY = "073 070 0375"

/** wa.me wants the number with no "+", spaces or punctuation. */
export const SALON_WHATSAPP = "27739790375"

/** Mailbox the site links to. Not where the contact form delivers — that
    goes to OWNER_EMAIL, server-side. */
export const SALON_EMAIL = "faithdiale4@gmail.com"

/* The dashboard owner's sign-in email and name are NOT here: they come from
   OWNER_EMAIL / OWNER_NAME in .env (lib/owner-account.ts), so no personal
   address is committed to the repository. */

/** The address in parts, for Google's business data (app/page.tsx). */
export const SALON_STREET_ADDRESS = "2389 Rangaka Street"
export const SALON_LOCALITY = "Tlhabane"
export const SALON_POSTAL_CODE = "0309"

/** As printed on the site. */
export const SALON_ADDRESS = `${SALON_STREET_ADDRESS}, ${SALON_LOCALITY}, ${SALON_POSTAL_CODE}`

/** Where the map pin and "Get directions" point. A street address, not
    coordinates — swap in the studio's own Google Maps pin if the search
    lands on the wrong spot. */
export const SALON_MAP_ADDRESS = `${SALON_STREET_ADDRESS}, ${SALON_LOCALITY}, North West, South Africa`

/** Pre-encoded, because both the map embed and the directions link use it. */
export const SALON_MAP_QUERY = encodeURIComponent(SALON_MAP_ADDRESS)

/**
 * Opening hours. Also the booking window: the wizard offers start times from
 * OPEN until the last half-hour slot before CLOSE.
 */
export const SALON_HOURS = {
  days: "Monday – Sunday",
  open: "08:30",
  close: "18:00",
} as const

export const SALON_HOURS_DISPLAY = `${SALON_HOURS.days}, ${SALON_HOURS.open}–${SALON_HOURS.close}`

/**
 * The salon's social profiles.
 *
 * A URL here is a public claim in the same way the phone number is, and a
 * wrong one is worse than a missing one: a guessed handle sends customers to
 * a stranger's page. So it starts empty and gets the real URL from the
 * client. While blank, the footer shows the icon as an inert mark rather
 * than a link.
 */
export type SalonSocial = {
  /** Used as the accessible name: "Touchedbyfaithdee Studio on Facebook". */
  label: string
  /** Full profile URL. Empty means "not set up yet" — the link is not shown. */
  url: string
}

export const SALON_SOCIALS: SalonSocial[] = [
  // TODO(client): the studio's own profile URLs.
  { label: "Facebook", url: "" },
  { label: "Instagram", url: "" },
  { label: "TikTok", url: "" },
]

/**
 * Opening lines for the WhatsApp links, written from the customer's side —
 * `?text=` prefills the customer's compose box. Kept short and easy to type
 * over.
 */
export const WHATSAPP_MESSAGES = {
  /** Header and contact section — no context beyond being on the site. */
  general: "Hi Touchedbyfaithdee Studio! I'd like to ask about your services.",
  /** Someone part-way through the booking flow who needs a hand. */
  booking: "Hi Touchedbyfaithdee Studio! I need some help with my booking.",
} as const

/**
 * wa.me link with the compose box prefilled.
 *
 * Always go through this rather than writing the URL inline — the message
 * has to be percent-encoded, and apostrophes are encoded too because some
 * Android link handlers end the URL at the first raw one.
 */
export const whatsappLink = (message: string) =>
  `https://wa.me/${SALON_WHATSAPP}?text=${encodeURIComponent(message).replace(/'/g, "%27")}`
