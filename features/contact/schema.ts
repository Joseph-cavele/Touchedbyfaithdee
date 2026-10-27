import { z } from "zod"

/* Dial codes offered by the phone field. South Africa leads because that is
   where the salon is; the rest are the countries a client plausibly calls
   from. Add entries rather than replacing them — a stored number is the dial
   code and the national number joined, so retiring a code makes the older
   records it prefixes harder to read back. */
export const DIAL_CODES = [
  { iso: "ZA", code: "+27", label: "South Africa" },
  { iso: "BW", code: "+267", label: "Botswana" },
  { iso: "LS", code: "+266", label: "Lesotho" },
  { iso: "MZ", code: "+258", label: "Mozambique" },
  { iso: "NA", code: "+264", label: "Namibia" },
  { iso: "SZ", code: "+268", label: "Eswatini" },
  { iso: "ZW", code: "+263", label: "Zimbabwe" },
  { iso: "GB", code: "+44", label: "United Kingdom" },
  { iso: "US", code: "+1", label: "United States" },
] as const

export const DEFAULT_DIAL_CODE = DIAL_CODES[0].code

const dialCodes = DIAL_CODES.map((entry) => entry.code) as [string, ...string[]]

/* Note the `.trim().pipe(z.email())` order on the email: Zod runs checks in
   the order they are chained, so the trim has to come first — `z.email().trim()`
   rejects " you@example.com " before the spaces are ever removed. */
export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please tell us your name")
    .max(80, "That name is longer than we can store"),
  email: z
    .string()
    .trim()
    .max(160, "That email address is too long")
    .pipe(z.email("Enter a valid email address")),
  /* The form's selector always sends this, so it is optional only to keep
     other callers (and the phone field being left blank) from being rejected
     over a code that would go unused anyway — the route falls back to
     DEFAULT_DIAL_CODE. Optional on both sides of the parse rather than
     `.default()`: a default makes the input and output types diverge, and
     react-hook-form is typed off the output. */
  dialCode: z.enum(dialCodes).optional(),
  /* Optional, so "" has to pass. Digits, spaces, brackets and dashes — the
     national number only, since the dial code is its own control. A leading
     "+" is tolerated for the visitor who pastes a full international number
     anyway; the route detects it and skips its own prefix rather than storing
     "+27 +27 82 …". Anything else is either a typo or someone trying their
     luck. */
  phone: z
    .string()
    .trim()
    .max(24, "That phone number is too long")
    .refine(
      (value) => value === "" || /^\+?[\d\s()-]{6,}$/.test(value),
      "Enter a valid phone number"
    ),
  message: z
    .string()
    .trim()
    .min(10, "A sentence or two is plenty")
    .max(2000, "Please keep it under 2000 characters"),
  /* No `consent` field here on purpose. The reference design gates submission
     on a required "I accept the privacy policy" tick, but this site has no
     privacy policy page — the only link points at "#". Gating on consent to a
     document that doesn't exist is worse than not asking, so the tick is
     absent from the form and from this schema together. Reinstate both when
     that page ships; see the matching note in site-contact.tsx. */
  marketingOptIn: z.boolean(),
  /**
   * Honeypot. Hidden from people, irresistible to naive bots. Named `website`
   * rather than anything spam-shaped so it reads as a real field to a scraper
   * filling in every input it finds. The route short-circuits on it before
   * this schema runs; the `max(0)` here is the second line of the same
   * defence, for any caller that skips that check.
   */
  website: z.string().max(0, "Rejected").optional(),
})

export type ContactMessageValues = z.infer<typeof contactMessageSchema>
