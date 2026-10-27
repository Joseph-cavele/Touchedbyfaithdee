"use client"

import { Clock, Crown, Heart, Sparkles } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { fadeUp } from "@/lib/motion"

const reasons = [
  {
    icon: Crown,
    title: "Premium Quality",
    description: "Only the finest products and techniques for exceptional results.",
  },
  {
    icon: Sparkles,
    title: "Hygienic Products",
    description: "100% sanitised tools and premium branded products.",
  },
  {
    icon: Clock,
    title: "On-Time Service",
    description: "We respect your time with punctual appointments.",
  },
  {
    icon: Heart,
    title: "Client Satisfaction",
    description: "Your happiness is our top priority, always.",
  },
]

export function SiteWhyUs() {
  const reduce = !!useReducedMotion()

  /* Every element carries its own trigger rather than inheriting from a parent
     group — the same fix applied to the service cards, where one container
     driving children across rows left the lower row stuck at opacity 0. */
  const reveal = (delay: number, distance = 20) => ({
    initial: "hidden" as const,
    whileInView: "show" as const,
    viewport: { once: true, amount: 0.3 },
    variants: fadeUp(reduce, delay, distance),
  })

  return (
    <section
      id="why-us"
      className="scroll-mt-24 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,var(--lz-blush)_0%,var(--lz-bg)_60%)] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-10 xl:px-16">
        <div className="text-center">
          <motion.p
            {...reveal(0, 14)}
            className="flex items-center justify-center gap-2 font-ui text-[10px] font-semibold tracking-[0.22em] text-brand-accent-ink uppercase sm:text-[11px]"
          >
            <Sparkles className="size-3" aria-hidden />
            Why us
            <Sparkles className="size-3" aria-hidden />
          </motion.p>

          <motion.h2
            {...reveal(0.08)}
            className="mt-4 font-display text-[clamp(1.9rem,4.2vw,2.9rem)] leading-[1.15] font-medium tracking-[-0.01em] text-brand-text"
          >
            Why Choose Us
          </motion.h2>

          <motion.p
            {...reveal(0.16)}
            className="mx-auto mt-4 max-w-md font-ui text-sm leading-[1.7] text-brand-muted sm:text-base"
          >
            Experience the difference that sets us apart from the rest.
          </motion.p>
        </div>

        <ul className="mt-16 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4 md:gap-x-8">
          {reasons.map((reason, i) => (
            <motion.li
              key={reason.title}
              {...reveal((i % 4) * 0.1, 24)}
              className="group flex flex-col items-center text-center"
            >
              <span className="grid size-14 place-items-center rounded-full bg-brand-surface text-brand-accent-ink shadow-[0_10px_28px_-12px_color-mix(in_srgb,var(--lz-gold)_55%,transparent)] transition-transform duration-300 group-hover:-translate-y-1">
                <reason.icon className="size-6" aria-hidden />
              </span>

              <h3 className="mt-6 font-display text-base font-medium text-brand-text sm:text-lg">
                {reason.title}
              </h3>
              <p className="mt-2 max-w-[24ch] font-ui text-xs leading-[1.6] text-brand-muted sm:text-sm">
                {reason.description}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
