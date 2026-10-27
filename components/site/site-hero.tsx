"use client"

import NextImage from "next/image"
import Link from "next/link"
import { Brush, Clock, Gem, MapPin, Phone, Scissors, Sparkles } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { Glint, laFePalette as palette, laFeScript as script, Lotus } from "@/components/site/la-fe-brand"
import { BackgroundPaths } from "@/components/ui/modern-background-paths"
import { fadeUp, lineReveal, springUp, stagger } from "@/lib/motion"
import { SALON_HOURS, SALON_LOCALITY, SALON_PHONE_DISPLAY } from "@/lib/salon-contact"
import { salonImages } from "@/lib/salon-assets"
import { formatCurrency } from "@/lib/currency"
import { salonServices, type SalonService } from "@/lib/salon-services"

/* IMAGE SLOTS — the collage, all the studio's own photos (lib/salon-assets):
   a wide top frame (tablets and up), the glam portrait 4:5 (every size — on
   phones it fills the frame alone), a second portrait 4:5 (tablets and up). */
const collage = {
  interior: salonImages.heroCollage.interior,
  portrait: salonImages.heroMobile,
  second: salonImages.heroCollage.nails,
}

/* The organic outline of the collage: a big sweep top-left and bottom-left,
   tight corners on the right. Percentages so it holds at every width. */
const BLOB = "42% 18% 22% 46% / 30% 12% 14% 34%"

/* Every price on the hero is read from lib/salon-services.ts — the one copy
   the price list and booking use — so a price change there shows here too. */
const isBridal = (s: SalonService) => s.name.startsWith("Bridal")

/** "from R 150" — the lowest confirmed price among the matching services. */
function fromPrice(match: (s: SalonService) => boolean) {
  const prices = salonServices
    .filter((s) => match(s) && s.price)
    .map((s) => s.price as number)
  return prices.length ? `from ${formatCurrency(Math.min(...prices))}` : "on request"
}

/* The three things the studio leads with. Bridal has its own tile so its
   packages don't set the "from" price for everyday makeup. */
const highlights = [
  { icon: Brush, label: "Makeup", price: fromPrice((s) => s.category === "Makeup" && !isBridal(s)) },
  { icon: Gem, label: "Bridal", price: fromPrice(isBridal) },
  { icon: Scissors, label: "Hair", price: fromPrice((s) => s.category === "Hair") },
]

/* Facts only — no ratings or client counts until the salon has real ones. */
const stats = [
  { icon: Clock, value: `${SALON_HOURS.open}–${SALON_HOURS.close}`, label: SALON_HOURS.days },
  { icon: MapPin, value: SALON_LOCALITY, label: "North West" },
  { icon: Phone, value: SALON_PHONE_DISPLAY, label: "Call or WhatsApp" },
]

export function SiteHero() {
  const reduce = !!useReducedMotion()

  return (
    <section
      style={palette}
      className="relative isolate w-full overflow-hidden bg-(--lf-ivory) text-(--lf-ink)"
    >
      {/* ── Ground ─────────────────────────────────────────────────────
          Ivory lit by a white bloom top-left, a rose glow behind the
          collage and a gold one low left. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_10%_10%,var(--lf-white),transparent_70%),radial-gradient(60%_70%_at_78%_40%,color-mix(in_srgb,var(--lf-rose)_24%,transparent),transparent_70%),radial-gradient(45%_55%_at_8%_90%,color-mix(in_srgb,var(--lf-gold)_16%,transparent),transparent_70%)]"
      />
      <BackgroundPaths patterns={["flow", "spiral"]} className="pointer-events-none -z-10 text-(--lf-rose)" />

      <div className="mx-auto grid min-h-[88svh] w-full max-w-7xl items-center gap-14 px-4 pt-12 pb-32 sm:px-5 sm:pb-40 md:px-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:pt-10">
        {/* ── Copy ───────────────────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger(0.15, 0.1)}
          className="flex flex-col items-center text-center lg:items-start lg:text-left"
        >
          {/* Logo lockup, after the poster's top-left wordmark. */}
          <motion.div variants={fadeUp(reduce, 0, 14)} className="flex flex-col items-end leading-none">
            <NextImage
              src={salonImages.logo.src}
              alt={salonImages.logo.alt}
              width={salonImages.logo.width}
              height={salonImages.logo.height}
              className="h-16 w-auto sm:h-20"
            />
            <span className="-mt-1 font-ui text-[9px] font-semibold tracking-[0.28em] text-[var(--lf-gold-ink)] uppercase">
              Studio
            </span>
          </motion.div>

          <motion.h1 variants={stagger(0.25, 0.14)} className="mt-8">
            <span className="block overflow-hidden pb-[0.06em]">
              <motion.span
                variants={lineReveal(reduce)}
                className="block font-display text-[clamp(2.6rem,6vw,4.75rem)] leading-[1.05] font-medium tracking-[-0.015em]"
              >
                Enhance Your
              </motion.span>
            </span>
            {/* Taller clip box: the script's swash capital and descenders
                overrun the line box and would be cut by overflow-hidden. */}
            <span className="-mt-[0.12em] block overflow-hidden py-[0.12em] pr-2">
              <motion.span
                variants={lineReveal(reduce)}
                className={`${script.className} block text-[clamp(3.6rem,9vw,7rem)] leading-[0.95] text-[var(--lf-rose-ink)]`}
              >
                Beauty
              </motion.span>
            </span>
          </motion.h1>

          {/* Divider: gold hairlines either side of the logo's lotus. */}
          <motion.div variants={fadeUp(reduce, 0, 12)} aria-hidden className="mt-4 flex items-center gap-3">
            <span className="h-px w-12 bg-[var(--lf-gold)]/60 sm:w-16" />
            <Lotus />
            <span className="h-px w-12 bg-[var(--lf-gold)]/60 sm:w-16" />
          </motion.div>

          <motion.p
            variants={fadeUp(reduce, 0, 16)}
            className="mt-5 font-ui text-[11px] font-semibold tracking-[0.3em] text-[var(--lf-gold-ink)] uppercase sm:text-xs"
          >
            Your Beauty Is Our Priority
          </motion.p>

          <motion.p
            variants={fadeUp(reduce, 0, 20)}
            className="mt-4 max-w-md font-ui text-sm leading-[1.8] text-[var(--lf-muted)] sm:text-base"
          >
            Flawless makeup for every occasion — from your matric dance to
            your wedding day — plus hair installations, sleek ponytails and
            updos, done by expert hands with premium products in Tlhabane.
          </motion.p>

          {/* Arch-topped service tiles, as on the poster. Labels, not links. */}
          <motion.ul
            variants={fadeUp(reduce, 0, 18)}
            aria-label="Our services"
            className="mt-8 flex justify-center gap-3 sm:gap-4 lg:justify-start"
          >
            {highlights.map((item) => (
              <li
                key={item.label}
                className="flex w-[78px] flex-col items-center gap-2.5 rounded-t-full rounded-b-2xl border border-[var(--lf-gold)]/45 bg-[var(--lf-white)]/55 px-2 pt-6 pb-3.5 sm:w-[88px]"
              >
                <item.icon className="size-6 text-[var(--lf-gold-ink)]" strokeWidth={1.25} aria-hidden />
                <span className="font-ui text-[10px] font-semibold tracking-[0.2em] uppercase">
                  {item.label}
                </span>
                <span className="-mt-1.5 font-ui text-[10px] font-semibold whitespace-nowrap text-[var(--lf-gold-ink)]">
                  {item.price}
                </span>
              </li>
            ))}
          </motion.ul>

          <motion.div
            variants={springUp(reduce, 0)}
            className="mt-9 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4"
          >
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--lf-gold)] px-8 py-3.5 font-ui text-sm font-semibold text-[var(--lf-white)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-12px_color-mix(in_srgb,var(--lf-gold)_90%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lf-gold-ink)] active:translate-y-0"
            >
              Book appointment
              <Sparkles className="size-4" aria-hidden />
            </Link>
            {/* The full catalogue page, not the homepage teaser below.
                Link rather than <a> so it's a client transition and gets
                prefetched. */}
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-full border border-[var(--lf-ink)]/20 bg-[var(--lf-white)]/40 px-8 py-3.5 font-ui text-sm font-semibold text-[var(--lf-ink)] transition-colors duration-300 hover:border-[var(--lf-gold)] hover:bg-[var(--lf-white)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lf-gold-ink)]"
            >
              Explore services
            </Link>
          </motion.div>

          <motion.dl
            variants={fadeUp(reduce, 0, 16)}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-5 border-t border-[var(--lf-gold)]/25 pt-7 lg:justify-start"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5">
                <stat.icon className="size-4 shrink-0 text-[var(--lf-gold-ink)]" aria-hidden />
                {/* dt before dd for valid markup; reversed so the value
                    still reads first. */}
                <div className="flex flex-col-reverse text-left">
                  <dt className="font-ui text-[11px] text-[var(--lf-muted)]">{stat.label}</dt>
                  <dd className="font-ui text-sm font-bold">{stat.value}</dd>
                </div>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* ── Collage ────────────────────────────────────────────────
            Three photos in one organic frame with ivory gutters, and a
            gold hairline outline offset around it. Phones get one frame with
            the salon's own photo; sm and up get the full collage. */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp(reduce, 0.35, 32)}
          className="relative mx-auto w-full max-w-[320px] sm:max-w-[460px] lg:max-w-[540px]"
        >
          <div
            aria-hidden
            style={{ borderRadius: BLOB }}
            className="absolute -inset-3 border border-[var(--lf-gold)]/50 sm:-inset-4"
          />

          <div
            style={{ borderRadius: BLOB }}
            className="relative grid aspect-[4/5] grid-cols-2 grid-rows-[1.2fr_1fr] gap-1.5 overflow-hidden bg-[var(--lf-white)] p-1.5 shadow-[0_40px_80px_-40px_color-mix(in_srgb,var(--lf-rose)_75%,transparent)] sm:aspect-[6/7]"
          >
            <div className="relative col-span-2 hidden overflow-hidden rounded-[18px] sm:block">
              <NextImage
                src={collage.interior.src}
                alt={collage.interior.alt}
                fill
                priority
                sizes="(min-width: 1024px) 540px, 460px"
                className="object-cover object-[50%_22%]"
              />
            </div>
            <div className="relative col-span-2 row-span-2 overflow-hidden rounded-[18px] sm:col-span-1 sm:row-span-1">
              <NextImage
                src={collage.portrait.src}
                alt={collage.portrait.alt}
                fill
                priority
                sizes="(min-width: 640px) 270px, 320px"
                className="object-cover object-[50%_30%]"
              />
            </div>
            <div className="relative hidden overflow-hidden rounded-[18px] sm:block">
              <NextImage
                src={collage.second.src}
                alt={collage.second.alt}
                fill
                sizes="270px"
                className="object-cover object-[50%_35%]"
              />
            </div>
          </div>

          <span className="text-[var(--lf-gold)]">
            <Glint className="-top-6 right-6 size-4" />
            <Glint className="top-1/3 -right-6 size-2.5 opacity-70" />
            <Glint className="-bottom-7 left-10 size-3" />
            <Glint className="top-10 -left-7 size-2 opacity-60" />
          </span>
        </motion.div>
      </div>

      {/* ── Wave divider ───────────────────────────────────────────────
          Curves the hero into the services band below (its cream ground).
          preserveAspectRatio is off so the curve stretches to any width
          instead of clipping. */}
      <svg
        aria-hidden
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 z-10 h-[70px] w-full sm:h-[110px]"
      >
        <path d="M0,96 C360,16 1080,16 1440,96 L1440,160 L0,160 Z" fill="var(--lf-cream)" />
      </svg>
    </section>
  )
}
