"use client"

import { useState } from "react"
import NextImage from "next/image"
import { ChevronDown, Sparkles } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { fadeUp, stagger } from "@/lib/motion"
import { galleryItems } from "@/lib/salon-services"

/* Three rows on desktop to start; the rest is one click away, so the
   section doesn't push Contact far down the page. */
const INITIAL_COUNT = 9

export function SiteGallery() {
  const reduce = !!useReducedMotion()
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? galleryItems : galleryItems.slice(0, INITIAL_COUNT)
  const hiddenCount = galleryItems.length - INITIAL_COUNT

  // No photos of the studio's own work yet — hide rather than show an empty grid.
  if (galleryItems.length === 0) return null

  const reveal = {
    initial: "hidden",
    whileInView: "show",
    viewport: { once: true, amount: 0.12 },
  } as const

  return (
    <section id="gallery" className="scroll-mt-24 bg-brand-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-10 xl:px-16">
        <motion.div {...reveal} variants={stagger(0, 0.12)} className="text-center">
          <motion.p
            variants={fadeUp(reduce, 0, 14)}
            className="flex items-center justify-center gap-2 font-ui text-[10px] font-semibold tracking-[0.22em] text-brand-accent-ink uppercase sm:text-[11px]"
          >
            <Sparkles className="size-3" aria-hidden />
            Our work
            <Sparkles className="size-3" aria-hidden />
          </motion.p>

          <motion.h2
            variants={fadeUp(reduce, 0, 20)}
            className="mt-4 font-display text-[clamp(1.9rem,4.2vw,2.9rem)] leading-[1.15] font-medium tracking-[-0.01em] text-brand-text"
          >
            Recent Work
          </motion.h2>

          <motion.p
            variants={fadeUp(reduce, 0, 20)}
            className="mx-auto mt-4 max-w-md font-ui text-sm leading-[1.7] text-brand-muted sm:text-base"
          >
            A few of the looks we have created for our clients.
          </motion.p>
        </motion.div>

        {/* Per-tile triggers, for the same reason as the service cards: a
            single parent group spanning two rows could leave the lower row
            stuck at opacity 0. */}
        <ul className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {visible.map((item, i) => (
            <motion.li
              key={item.src}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp(reduce, (i % 3) * 0.08, 20)}
              className="group relative aspect-[4/5] overflow-hidden rounded-[16px] bg-brand-line"
            >
              <NextImage
                src={item.src}
                alt={item.alt}
                fill
                sizes="(min-width: 768px) 23vw, 45vw"
                // Full colour: the salon's own work, where the colour is the point.
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Label rides in on hover; on touch there is no hover state, so
                  the alt text carries the same information to screen readers. */}
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 translate-y-full bg-[linear-gradient(to_top,rgba(0,0,0,0.85),transparent)] px-4 pt-8 pb-3 font-ui text-xs font-semibold text-white transition-transform duration-300 group-hover:translate-y-0"
              >
                {item.label}
              </span>
            </motion.li>
          ))}
        </ul>

        {hiddenCount > 0 && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-line bg-brand-surface px-7 py-3 font-ui text-sm font-semibold text-brand-text transition-colors duration-300 hover:border-brand-accent hover:text-brand-accent-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
            >
              {showAll ? "Show fewer" : `Show all ${galleryItems.length} photos`}
              <ChevronDown
                aria-hidden
                className={`size-4 transition-transform duration-300 ${showAll ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
