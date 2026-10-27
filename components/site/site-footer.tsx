import NextImage from "next/image"
import Link from "next/link"
import type { IconType } from "react-icons"
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6"
import { LogIn } from "lucide-react"

import { salonImages } from "@/lib/salon-assets"
import { SALON_EMAIL, SALON_NAME, SALON_SOCIALS } from "@/lib/salon-contact"

const footerLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Contact", href: `mailto:${SALON_EMAIL}` },
]

/* Brand marks come from react-icons: lucide v1 dropped its brand set, so
   Facebook resolves to undefined there. Keyed by the label in SALON_SOCIALS — a platform added there
   without an icon here is skipped rather than rendering an empty box. */
const socialIcons: Record<string, IconType> = {
  Facebook: FaFacebookF,
  Instagram: FaInstagram,
  TikTok: FaTiktok,
}

/* Every platform we have a mark for. Whether it links anywhere is decided
   per-item below, not here. */
const socials = SALON_SOCIALS.filter((s) => socialIcons[s.label])

const socialClass =
  "grid size-9 place-items-center rounded-full border transition-colors duration-300"

/* Surface grey against the black page, so the page has something to close
   against. Single skin — the header dropped its two-tone
   mechanism, and a footer that disagreed with it was the reason that existed. */
/* `#contact` moved to SiteContact once a real contact section existed — two
   elements cannot share the id, and the nav means the form. */
export function SiteFooter() {
  return (
    <footer className="dark mt-auto bg-brand-glass text-brand-text">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between px-5 py-16 md:flex-row md:px-16">
        <div className="mb-8 flex flex-col items-center leading-none md:mb-0 md:items-start">
          <NextImage
            src={salonImages.logo.src}
            alt={SALON_NAME}
            width={salonImages.logo.width}
            height={salonImages.logo.height}
            className="h-14 w-auto"
          />
          <span className="-mt-1 font-ui text-[10px] font-semibold tracking-[0.3em] text-brand-accent-ink uppercase md:self-end">
            Studio
          </span>

          {socials.length > 0 && (
            <ul className="mt-6 flex items-center gap-3">
              {socials.map(({ label, url }) => {
                const Icon = socialIcons[label]

                /* No URL yet: the mark still shows so the row reads as
                   finished, but as a span rather than an anchor. An <a> with
                   an empty href resolves to the current page, so clicking it
                   would silently reload the homepage — which looks like a
                   broken site rather than a profile that isn't live. */
                if (!url) {
                  return (
                    <li key={label}>
                      <span
                        role="img"
                        aria-label={`${label} — coming soon`}
                        title={`${label} — coming soon`}
                        className={`${socialClass} cursor-default border-brand-text/10 text-brand-text/30`}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                    </li>
                  )
                }

                return (
                  <li key={label}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${SALON_NAME} on ${label}`}
                      className={`${socialClass} border-brand-text/20 text-brand-text/70 hover:border-brand-accent hover:bg-brand-accent hover:text-brand-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent`}
                    >
                      <Icon className="size-4" aria-hidden />
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-8 md:mb-0">
          {footerLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="font-ui text-base leading-[1.6] text-brand-text/65 transition-colors hover:text-brand-accent-ink"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 text-center md:items-end md:text-right">
          {/* Into the dashboard — sign-in by emailed code, for allowed emails only. */}
          <Link
            href="/login"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-accent/60 px-5 py-2 font-ui text-sm font-semibold text-brand-accent-ink transition-colors duration-300 hover:bg-brand-accent hover:text-brand-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
          >
            <LogIn className="size-4" aria-hidden />
            Login
          </Link>
          <p className="font-ui text-base leading-[1.6] text-brand-text/65">
            &copy; {new Date().getFullYear()} {SALON_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
