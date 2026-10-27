"use client"

import { useRef, useState } from "react"
import NextImage from "next/image"
import Link from "next/link"
import { CalendarCheck, Clock, Play, Scissors, Sparkles } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"

import { fadeUp } from "@/lib/motion"
import { salonImages } from "@/lib/salon-assets"
import { SALON_HOURS, SALON_NAME } from "@/lib/salon-contact"
import { salonServices, serviceCategories } from "@/lib/salon-services"

/* ══════════════════════════════════════════════════════════════════════
   VIDEO SLOT — the studio's tour video, set in lib/salon-assets.ts
   (salonImages.about.video). If it's ever "", the play button renders but
   is disabled rather than clickable: a play control that does nothing when
   pressed is a broken promise to the visitor, not a placeholder.
   ══════════════════════════════════════════════════════════════════════ */
const VIDEO_SRC = salonImages.about.video

/* Every figure here is derived from real data — the service list and the
   opening hours. Do not add years in business, client counts or awards until
   the salon confirms them: they are public claims about the business. */
const stats = [
  { icon: Scissors, value: String(salonServices.length), label: "Services Offered" },
  { icon: Sparkles, value: String(serviceCategories.length), label: "Specialities" },
  { icon: CalendarCheck, value: "7 days", label: "Open every week" },
]

export function SiteAbout() {
  const reduce = !!useReducedMotion()
  const [playing, setPlaying] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  /* ── Scroll-linked parallax ──────────────────────────────────────────
     Progress runs 0 → 1 across the section's full travel through the
     viewport ("start end" = its top hits the bottom of the screen,
     "end start" = its bottom leaves the top), so the drift is tied to
     scroll position rather than played once on entry.

     The three layers move at different rates and in opposing directions,
     which is what separates them into foreground and background — a
     collage that moves as one block just reads as a scrolling image. Only
     `y` is touched, so this stays on the compositor alongside the existing
     ambient scale. */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const photoY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"])
  const insetY = useTransform(scrollYProgress, [0, 1], ["18%", "-18%"])
  const badgeY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"])

  const reveal = (delay: number, distance = 20) => ({
    initial: "hidden" as const,
    whileInView: "show" as const,
    viewport: { once: true, amount: 0.25 },
    variants: fadeUp(reduce, delay, distance),
  })

  return (
    <section
      ref={sectionRef}
      id="about"
      className="scroll-mt-24 bg-brand-surface py-20 sm:py-28"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 md:px-10 lg:grid-cols-2 lg:gap-16 xl:px-16">
        {/* ── Left: image collage ────────────────────────────────────── */}
        <motion.div {...reveal(0, 28)} className="relative">
          <div className="group relative aspect-4/3 w-full overflow-hidden rounded-[22px] bg-brand-glass shadow-[0_24px_60px_-28px_rgba(0,0,0,0.45)]">
            {playing && VIDEO_SRC ? (
              <video
                src={VIDEO_SRC}
                poster={salonImages.about.main.src}
                controls
                autoPlay
                playsInline
                aria-label={`Tour of ${SALON_NAME}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                {/* Overscanned 10% top and bottom so a ±6% parallax drift
                    never pulls an edge inside the frame and exposes the
                    backing. The frame itself clips the overflow. */}
                <motion.div
                  className="absolute inset-x-0 -inset-y-[10%]"
                  style={reduce ? undefined : { y: photoY }}
                  animate={reduce ? undefined : { scale: [1, 1.07, 1] }}
                  transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
                >
                  <NextImage
                    src={salonImages.about.main.src}
                    alt={salonImages.about.main.alt}
                    fill
                    sizes="(min-width: 1024px) 45vw, 90vw"
                    // 3:2 photo in a 4:3 frame: only the sides are trimmed,
                    // so the chairs and mirror stay centred.
                    className="object-cover object-center"
                  />
                </motion.div>

                {/* Darkened so the white play glyph holds up over a bright,
                    high-key interior. */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.25)_60%,rgba(0,0,0,0.45)_100%)]"
                />

                <button
                  type="button"
                  disabled={!VIDEO_SRC}
                  onClick={() => setPlaying(true)}
                  aria-label={
                    VIDEO_SRC ? "Play the salon tour" : "Salon tour video coming soon"
                  }
                  className="absolute inset-0 grid place-items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent disabled:cursor-default"
                >
                  <span className="relative grid size-16 place-items-center rounded-full bg-brand-accent text-brand-on-accent shadow-[0_12px_36px_-8px_color-mix(in_srgb,var(--lz-gold)_90%,transparent)] transition-transform duration-300 group-hover:scale-110 sm:size-20">
                    {/* Two rings on a staggered loop, so one is always mid-flight. */}
                    {[0, 1.4].map((delay) => (
                      <motion.span
                        key={delay}
                        aria-hidden
                        className="absolute inset-0 rounded-full border-2 border-brand-accent"
                        initial={{ scale: 1, opacity: 0.7 }}
                        animate={reduce ? undefined : { scale: [1, 1.9], opacity: [0.7, 0] }}
                        transition={{
                          duration: 2.8,
                          delay,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                    ))}
                    <Play className="relative size-6 translate-x-0.5 fill-current sm:size-7" />
                  </span>
                </button>

                <span className="absolute bottom-4 left-4 rounded-full bg-brand-glass/70 px-3 py-1.5 font-ui text-[11px] font-semibold text-white backdrop-blur-sm">
                  Take a look inside
                </span>
              </>
            )}
          </div>

          {/* Second frame, overlapping the first from below-left. Hidden on
              small screens where there isn't room for it to read as a collage
              rather than a mistake. Drifts against the main photo — it's
              unclipped, so it can travel further than the 6% inside the frame. */}
          <motion.div
            style={reduce ? undefined : { y: insetY }}
            className="absolute -bottom-12 -left-6 hidden aspect-square w-40 overflow-hidden rounded-[18px] border-4 border-brand-surface shadow-[0_18px_44px_-20px_rgba(0,0,0,0.5)] sm:block lg:w-48"
          >
            <NextImage
              src={salonImages.about.inset.src}
              alt={salonImages.about.inset.alt}
              fill
              sizes="12rem"
              className="object-cover"
            />
          </motion.div>

          {/* Hours badge. Gentlest drift of the three — it carries a
              number the visitor is meant to read, so it stays closest to the
              page's own scroll speed. */}
          <motion.div
            style={reduce ? undefined : { y: badgeY }}
            className="absolute -bottom-8 right-4 flex items-center gap-3 rounded-[16px] bg-brand-surface px-5 py-3.5 shadow-[0_18px_44px_-16px_rgba(0,0,0,0.35)] sm:right-8"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-accent text-brand-on-accent">
              <Clock className="size-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-xl font-semibold text-brand-text">
                {SALON_HOURS.open}–{SALON_HOURS.close}
              </span>
              <span className="block font-ui text-[11px] text-brand-muted">
                Open {SALON_HOURS.days}
              </span>
            </span>
          </motion.div>
        </motion.div>

        {/* ── Right: copy ────────────────────────────────────────────── */}
        <div className="mt-16 lg:mt-0">
          <motion.p
            {...reveal(0, 14)}
            className="flex items-center gap-2 font-ui text-[10px] font-semibold tracking-[0.22em] text-brand-accent-ink uppercase sm:text-[11px]"
          >
            <Sparkles className="size-3" aria-hidden />
            About us
          </motion.p>

          <motion.h2
            {...reveal(0.08)}
            className="mt-4 font-display text-[clamp(1.9rem,4.2vw,2.9rem)] leading-[1.15] font-medium tracking-[-0.01em] text-brand-text"
          >
            Welcome to {SALON_NAME}
          </motion.h2>

          <motion.p
            {...reveal(0.16)}
            className="mt-6 font-ui text-sm leading-[1.8] text-brand-muted sm:text-base"
          >
            {SALON_NAME} is in Tlhabane, North West, and
            open every day of the week. Book online, or message us on WhatsApp
            if you are not sure which service you need.
          </motion.p>

          <motion.p
            {...reveal(0.22)}
            className="mt-4 font-ui text-sm leading-[1.8] text-brand-muted sm:text-base"
          >
            We do makeup for every occasion — from your matric dance to your
            wedding day — plus hair installations, frontal ponytails and
            updos, all under one roof.
          </motion.p>

          <motion.dl {...reveal(0.28)} className="mt-10 flex flex-wrap gap-x-10 gap-y-6">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-start">
                <span className="grid size-10 place-items-center rounded-full bg-brand-line text-brand-accent-ink">
                  <stat.icon className="size-4" aria-hidden />
                </span>
                <dd className="mt-3 font-display text-2xl font-semibold text-brand-text">
                  {stat.value}
                </dd>
                <dt className="mt-0.5 font-ui text-xs text-brand-muted">{stat.label}</dt>
              </div>
            ))}
          </motion.dl>

          {/* The reference's "Know More About Us" points at a deeper about
              page that doesn't exist here, so the CTA goes where it can
              actually do something. */}
          <motion.div {...reveal(0.34)} className="mt-10">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-8 py-3.5 font-ui text-sm font-semibold text-brand-on-accent transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-12px_color-mix(in_srgb,var(--lz-gold)_90%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent active:translate-y-0"
            >
              Book Your Visit
              <Sparkles className="size-4" aria-hidden />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
