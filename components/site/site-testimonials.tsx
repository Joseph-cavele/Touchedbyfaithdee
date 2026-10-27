"use client"

import { useCallback, useEffect, useState } from "react"
import NextImage from "next/image"
import { ChevronLeft, ChevronRight, Quote, Sparkles } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { EASE_OUT, fadeUp } from "@/lib/motion"
import { testimonials } from "@/lib/salon-testimonials"

/* Quotes live in lib/salon-testimonials.ts — real client words only. The
   section renders nothing while that list is empty. */
const COUNT = testimonials.length
const AUTOPLAY_MS = 7000

/** Horizontal step between neighbouring cards, as a % of one card's width. */
const SLOT = 100

/* No display utility here on purpose — each placement below sets its own,
   so `hidden`/`grid` can't fight over which one wins. */
const navBase =
  "size-11 place-items-center rounded-full bg-brand-surface text-brand-text shadow-[0_14px_34px_-14px_rgba(0,0,0,0.5)] transition-all duration-300 hover:bg-brand-accent hover:text-brand-on-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent sm:size-12"

/* Declared at module level, not inside SiteTestimonials: a component defined
   during render is a new component every render, so React would remount it
   (and drop focus) on each autoplay tick. */
function NavButton({
  dir,
  className,
  onStep,
}: {
  dir: "prev" | "next"
  className: string
  onStep: (step: number) => void
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={() => onStep(dir === "prev" ? -1 : 1)}
      aria-label={dir === "prev" ? "Previous testimonial" : "Next testimonial"}
      className={`${navBase} ${className}`}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  )
}

export function SiteTestimonials() {
  const reduce = !!useReducedMotion()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const go = useCallback((step: number) => {
    setActive((current) => (current + step + COUNT) % COUNT)
  }, [])

  /* Autoplay is a convenience, never the only way through: the arrows and
     dots drive the same state, and hovering, focusing or dragging stops the
     timer so it can't yank a card away mid-read. */
  useEffect(() => {
    if (reduce || paused || COUNT < 2) return
    const id = setInterval(() => setActive((n) => (n + 1) % COUNT), AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [reduce, paused])

  /* Signed distance around the ring rather than a plain subtraction, so the
     last card advances *forward* into the first instead of rewinding the
     whole track. Anything further than one slot away is parked invisibly and
     can teleport across the wrap without being seen. */
  const offsetOf = (index: number) => {
    const raw = index - active
    if (raw > COUNT / 2) return raw - COUNT
    if (raw < -COUNT / 2) return raw + COUNT
    return raw
  }

  const reveal = (delay: number, distance = 20) => ({
    initial: "hidden" as const,
    whileInView: "show" as const,
    viewport: { once: true, amount: 0.25 },
    variants: fadeUp(reduce, delay, distance),
  })

  // No real quotes yet — show nothing rather than an empty carousel.
  if (COUNT === 0) return null

  return (
    <section
      id="testimonials"
      className="scroll-mt-24 bg-brand-bg py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-10 xl:px-16">
        <div className="text-center">
          <motion.p
            {...reveal(0, 14)}
            className="flex items-center justify-center gap-2 font-ui text-[10px] font-semibold tracking-[0.22em] text-brand-accent-ink uppercase sm:text-[11px]"
          >
            <Sparkles className="size-3" aria-hidden />
            Testimonials
            <Sparkles className="size-3" aria-hidden />
          </motion.p>

          <motion.h2
            {...reveal(0.08)}
            className="mt-4 font-display text-[clamp(1.9rem,4.2vw,2.9rem)] leading-[1.15] font-medium tracking-[-0.01em] text-brand-text"
          >
            What Our Clients Say
          </motion.h2>

          <motion.p
            {...reveal(0.16)}
            className="mx-auto mt-4 max-w-md font-ui text-sm leading-[1.7] text-brand-muted sm:text-base"
          >
            From our chair, in our clients&rsquo; own words.
          </motion.p>
        </div>

        {/* Arrows live outside the clipping viewport so they can sit on the
            edge without being cut off by it. */}
        <motion.div
          {...reveal(0.22, 28)}
          className="relative mt-14"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div
            role="group"
            aria-roledescription="carousel"
            aria-label="Client testimonials"
            className="relative h-[420px] overflow-hidden sm:h-[400px]"
          >
            {testimonials.map((item, i) => {
              const offset = offsetOf(i)
              const isActive = offset === 0
              const isNeighbour = Math.abs(offset) === 1

              return (
                <motion.figure
                  key={item.name}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${COUNT}`}
                  aria-hidden={!isActive}
                  inert={!isActive || undefined}
                  className="absolute top-1/2 left-1/2 w-[min(88vw,26rem)] rounded-[22px] bg-brand-surface p-7 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)] sm:p-9"
                  /* Percentage x is relative to the card's own width, so the
                     step holds at every breakpoint without measuring. */
                  animate={{
                    x: `${offset * SLOT - 50}%`,
                    y: "-50%",
                    scale: isActive ? 1 : 0.88,
                    opacity: isActive ? 1 : isNeighbour ? 0.5 : 0,
                    zIndex: isActive ? 20 : isNeighbour ? 10 : 0,
                  }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { duration: 0.6, ease: EASE_OUT }
                  }
                  style={{ pointerEvents: isActive ? "auto" : "none" }}
                  /* Swipe, for the phone where the arrows are a small target.
                     Constrained to zero on both sides so the card springs back
                     and the index — not the drag — decides where it lands. */
                  drag={isActive ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.18}
                  onDragStart={() => setPaused(true)}
                  onDragEnd={(_, info) => {
                    const throw_ = info.offset.x + info.velocity.x * 0.12
                    if (throw_ < -70) go(1)
                    else if (throw_ > 70) go(-1)
                    setPaused(false)
                  }}
                >
                  <Quote
                    className="size-8 fill-current text-brand-accent-ink sm:size-9"
                    aria-hidden
                  />

                  <blockquote className="mt-5 font-ui text-sm leading-[1.75] text-brand-text/85 sm:text-base sm:leading-[1.8]">
                    {item.quote}
                  </blockquote>

                  <hr className="mt-7 border-0 border-t border-brand-line" />

                  <figcaption className="mt-5 flex items-center gap-3.5">
                    {item.avatar ? (
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-full">
                        <NextImage
                          src={item.avatar}
                          alt=""
                          fill
                          sizes="2.75rem"
                          className="object-cover"
                        />
                      </span>
                    ) : (
                      <span
                        aria-hidden
                        className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-line font-display text-base font-semibold text-brand-accent-ink"
                      >
                        {item.name.charAt(0)}
                      </span>
                    )}

                    <span className="leading-tight">
                      <span className="block font-display text-base font-semibold text-brand-text sm:text-lg">
                        {item.name}
                      </span>
                      <span className="block font-ui text-xs text-brand-muted sm:text-sm">
                        {item.location}
                      </span>
                    </span>
                  </figcaption>
                </motion.figure>
              )
            })}
          </div>

          {/* Edge arrows, tablet and up only. Below `sm` the card is sized in
              vw and grows wider than the gap the arrows need, so they landed
              on top of the quote — and being z-30, they also swallowed the
              taps that were meant to start a swipe. They move into the
              control row below instead. */}
          <NavButton onStep={go}
            dir="prev"
            className="absolute top-1/2 left-0 z-30 hidden -translate-y-1/2 sm:grid"
          />
          <NavButton onStep={go}
            dir="next"
            className="absolute top-1/2 right-0 z-30 hidden -translate-y-1/2 sm:grid"
          />
        </motion.div>

        {/* One control row: arrows flank the dots on phones, dots alone from
            `sm` up where the edge arrows take over. */}
        <div className="mt-10 flex items-center justify-center gap-4 sm:gap-2.5">
          <NavButton onStep={go} dir="prev" className="grid shrink-0 sm:hidden" />

          <div className="flex items-center gap-2.5">
            {testimonials.map((item, i) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show testimonial ${i + 1}`}
                aria-current={i === active}
                className="group grid size-6 place-items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    i === active
                      ? "size-2.5 bg-brand-accent"
                      : "size-2 bg-brand-line group-hover:bg-brand-accent/50"
                  }`}
                />
              </button>
            ))}
          </div>

          <NavButton onStep={go} dir="next" className="grid shrink-0 sm:hidden" />
        </div>
      </div>
    </section>
  )
}
