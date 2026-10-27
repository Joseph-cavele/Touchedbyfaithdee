import type { CSSProperties } from "react"
import { Great_Vibes } from "next/font/google"

/* La-fe brand pieces shared by the hero and the services section, scoped to
   those sections until the site-wide theme moves to the La-fe palette. */

/* Script face for the one flourish word per section, as on the La-fe posters. */
export const laFeScript = Great_Vibes({ subsets: ["latin"], weight: "400", display: "swap" })

/* La-fe palette. The two "-ink" values are the gold and rose darkened with
   espresso: the pure tones are ≈2.8:1 on ivory and fail as text, so they only
   ever paint fills, hairlines and ornaments. Gold-ink ≈4.9:1, rose-ink ≈3.4:1
   (display size only). Cream is ivory lifted toward white — the services
   ground, a shade apart from the hero so the two read as separate bands. */
/* The --lf-* names point at the one definition of each colour in
   app/globals.css (:root), so a change there reaches these sections too.
   The --lz-* values used here are the same inside `.dark` islands. */
export const laFePalette = {
  "--lf-gold": "var(--lz-gold)",
  "--lf-ivory": "var(--lz-ivory)",
  "--lf-rose": "var(--lz-rose)",
  "--lf-ink": "var(--lz-espresso)",
  "--lf-white": "#FFFFFF",
  "--lf-cream": "color-mix(in srgb, var(--lf-ivory) 55%, var(--lf-white))",
  "--lf-gold-ink": "color-mix(in srgb, var(--lf-gold) 65%, var(--lf-ink))",
  "--lf-rose-ink": "color-mix(in srgb, var(--lf-rose) 80%, var(--lf-ink))",
  "--lf-muted": "color-mix(in srgb, var(--lf-ink) 72%, var(--lf-ivory))",
} as CSSProperties

/** Small lotus, after the ornament under the logo's wordmark. */
export function Lotus() {
  return (
    <svg viewBox="0 0 24 16" aria-hidden className="h-3.5 w-5 shrink-0" fill="none" stroke="var(--lf-gold)" strokeWidth="1.1" strokeLinejoin="round">
      <path d="M12 2 C9 6 9 11 12 14 C15 11 15 6 12 2Z" />
      <path d="M12 14 C8 13 5 10 4.5 6 C8 6.5 10.5 9 12 14Z" />
      <path d="M12 14 C16 13 19 10 19.5 6 C16 6.5 13.5 9 12 14Z" />
      <path d="M12 14 C7 14.5 3 13.5 1 11 C5 10 9 11.5 12 14Z" />
      <path d="M12 14 C17 14.5 21 13.5 23 11 C19 10 15 11.5 12 14Z" />
    </svg>
  )
}

/** Four-point glint, scattered like the logo's glitter. */
export function Glint({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={`absolute ${className}`} fill="currentColor">
      <path d="M8 0 C8.6 5 11 7.4 16 8 C11 8.6 8.6 11 8 16 C7.4 11 5 8.6 0 8 C5 7.4 7.4 5 8 0Z" />
    </svg>
  )
}
