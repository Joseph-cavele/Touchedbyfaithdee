"use client"

import { useEffect, useState } from "react"
import NextImage from "next/image"
import Link from "next/link"
import { Menu, MessageCircle, Phone } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SALON_NAME, SALON_PHONE, WHATSAPP_MESSAGES, whatsappLink } from "@/lib/salon-contact"
import { salonImages } from "@/lib/salon-assets"

/* IMAGE SLOT — the logo wordmark, from lib/salon-assets.ts. Set to "" and a
   dashed gold pill holds the space so the bar keeps its shape. */
const LOGO_MARK = salonImages.logo.src

/* Contact details come from lib/salon-contact.ts. They used to be a second
   hardcoded copy here, which is how the header kept a placeholder number
   after the real one was set. Import, never re-declare. */
const PHONE = SALON_PHONE
const WHATSAPP_HREF = whatsappLink(WHATSAPP_MESSAGES.general)

/* Ordered to match the original design reference. Every link now resolves to a real
   section — `#contact` is the contact form, hours and map (SiteContact), which
   took the anchor over from the footer.

   Services points at the full catalogue page rather than the homepage teaser
   section: the teaser shows six of the services, /services shows all of them
   with prices. The homepage section keeps its `#services` id for the teaser's
   own "view all" link and any existing inbound anchors. */
const links = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/#about" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Contact", href: "/#contact" },
]

export function SiteHeader({
  active,
  logoHref = "/",
}: {
  active?: string
  logoHref?: string
}) {
  const reduce = useReducedMotion()
  const [scrolled, setScrolled] = useState(false)

  // The bar is always solid; only its shadow deepens, so the nav never sits
  // unreadably over whatever the page happens to start with.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      initial={reduce ? { y: 0, opacity: 1 } : { y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={reduce ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="sticky inset-x-0 top-0 z-50 md:px-6"
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between rounded-b-[24px] bg-brand-surface px-5 py-3.5 transition-shadow duration-500 md:mt-3 md:rounded-[24px] md:px-7 xl:px-9 ${
          scrolled
            ? "shadow-[0_10px_40px_-12px_rgba(0,0,0,0.18)]"
            : "shadow-[0_2px_18px_-10px_rgba(0,0,0,0.15)]"
        }`}
      >
        <Link
          href={logoHref}
          aria-label={`${SALON_NAME} — admin login`}
          className="flex flex-col items-end leading-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
        >
          {LOGO_MARK ? (
            <NextImage
              src={LOGO_MARK}
              alt=""
              width={452}
              height={150}
              priority
              className="h-9 w-auto sm:h-11"
            />
          ) : (
            <span
              aria-hidden
              className="grid h-9 w-28 place-items-center rounded-full border border-dashed border-brand-accent/50 text-[8px] font-semibold tracking-[0.1em] text-brand-accent-ink uppercase"
            >
              Logo
            </span>
          )}

          <span className="-mt-1 font-ui text-[7px] font-semibold tracking-[0.26em] text-brand-accent-ink uppercase sm:text-[9px]">
            Studio
          </span>
        </Link>

        {/* Five links plus two icon buttons and the CTA is tight at the lg
            breakpoint, so the gap opens up only once there's room for it. */}
        <nav className="hidden items-center gap-5 lg:flex xl:gap-8">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`group relative font-ui text-sm font-medium transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent ${
                active === link.label
                  ? "text-brand-accent-ink"
                  : "text-brand-text/75 hover:text-brand-accent-ink"
              }`}
            >
              {link.label}
              {/* Scaled rather than widened, so it never touches layout. */}
              <span
                aria-hidden
                className={`absolute inset-x-0 -bottom-1.5 h-px origin-left bg-brand-accent transition-transform duration-300 ease-out ${
                  active === link.label
                    ? "scale-x-100"
                    : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"
                }`}
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={`tel:${PHONE}`}
            aria-label="Call the salon"
            className="hidden size-9 place-items-center rounded-full text-brand-accent-ink transition-colors duration-300 hover:bg-brand-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent sm:grid"
          >
            <Phone className="size-4" />
          </a>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Message the salon on WhatsApp"
            className="hidden size-9 place-items-center rounded-full bg-brand-line text-brand-accent-ink transition-colors duration-300 hover:bg-brand-accent hover:text-brand-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent sm:grid"
          >
            <MessageCircle className="size-4" />
          </a>

          <Link
            href="/book"
            className="hidden items-center rounded-full bg-brand-accent px-6 py-2.5 font-ui text-sm font-semibold text-brand-on-accent transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-10px_color-mix(in_srgb,var(--lz-gold)_85%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent active:translate-y-0 sm:inline-flex"
          >
            Book Now
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open menu"
              className="inline-flex size-10 items-center justify-center text-brand-text lg:hidden"
            >
              <Menu className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {links.map((link) => (
                <DropdownMenuItem key={link.label} render={<a href={link.href} />}>
                  {link.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem render={<a href="/book" />}>Book Now</DropdownMenuItem>
              <DropdownMenuItem render={<a href={`tel:${PHONE}`} />}>Call us</DropdownMenuItem>
              <DropdownMenuItem
                render={<a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" />}
              >
                WhatsApp
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  )
}
