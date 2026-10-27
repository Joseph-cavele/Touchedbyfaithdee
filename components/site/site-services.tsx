"use client"

import NextImage from "next/image"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { Glint, laFePalette, laFeScript, Lotus } from "@/components/site/la-fe-brand"
import { fadeUp, stagger } from "@/lib/motion"
import { featuredServices, serviceCategories } from "@/lib/salon-services"

export function SiteServices() {
  const reduce = !!useReducedMotion()

  // `whileInView` with `once` so the reveal fires as the section arrives and
  // never re-runs when the visitor scrolls back up.
  const reveal = {
    initial: "hidden",
    whileInView: "show",
    viewport: { once: true, amount: 0.15 },
  } as const

  return (
    <section
      id="services"
      style={laFePalette}
      className="relative isolate scroll-mt-24 overflow-hidden bg-[var(--lf-cream)] pt-14 pb-36 text-[var(--lf-ink)] sm:pt-20 sm:pb-44"
    >
      {/* ── Ground ─────────────────────────────────────────────────────
          Cream, warmed by a faint rose glow behind the cards and a gold one
          low right — quieter than the hero so the cards carry the colour. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(55%_40%_at_50%_38%,color-mix(in_srgb,var(--lf-rose)_14%,transparent),transparent_70%),radial-gradient(40%_35%_at_92%_88%,color-mix(in_srgb,var(--lf-gold)_12%,transparent),transparent_70%)]"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-10 xl:px-16">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div {...reveal} variants={stagger(0, 0.12)} className="flex flex-col items-center text-center">
          <motion.p
            variants={fadeUp(reduce, 0, 14)}
            className="flex items-center gap-2 font-ui text-[10px] font-semibold tracking-[0.3em] text-[var(--lf-gold-ink)] uppercase sm:text-[11px]"
          >
            <Sparkles className="size-3" aria-hidden />
            What we offer
            <Sparkles className="size-3" aria-hidden />
          </motion.p>

          <motion.h2
            variants={fadeUp(reduce, 0, 20)}
            className="mt-4 font-display text-[clamp(2rem,4.4vw,3.1rem)] leading-[1.15] font-medium tracking-[-0.01em]"
          >
            Our{" "}
            <span
              className={`${laFeScript.className} inline-block px-1 align-[-0.08em] text-[1.45em] leading-none font-normal text-[var(--lf-rose-ink)]`}
            >
              Premium
            </span>{" "}
            Services
          </motion.h2>

          {/* Divider: gold hairlines either side of the logo's lotus, as in
              the hero. */}
          <motion.div variants={fadeUp(reduce, 0, 12)} aria-hidden className="mt-4 flex items-center gap-3">
            <span className="h-px w-12 bg-[var(--lf-gold)]/60 sm:w-16" />
            <Lotus />
            <span className="h-px w-12 bg-[var(--lf-gold)]/60 sm:w-16" />
          </motion.div>

          <motion.p
            variants={fadeUp(reduce, 0, 20)}
            className="mt-5 max-w-md font-ui text-sm leading-[1.8] text-[var(--lf-muted)] sm:text-base"
          >
            Luxury treatments tailored for you, delivered by skilled
            professionals.
          </motion.p>
        </motion.div>

        {/* ── Featured cards ─────────────────────────────────────────────
            Each card carries its own `whileInView` rather than inheriting from
            a parent group. A single trigger on the grid meant all six were
            driven by one container spanning two rows, and `fadeUp`'s explicit
            `delay: 0` overrode the parent's staggerChildren — so the second
            row could stay stuck at opacity 0. Per-card triggers cannot fail
            that way, and each row reveals as it actually reaches the viewport.
            The index delay keeps the stagger within a row. */}
        <div className="mt-14 grid gap-7 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {featuredServices.map((service, i) => (
            <motion.article
              key={service.name}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp(reduce, (i % 3) * 0.1, 24)}
              className="group flex flex-col rounded-[28px] border border-[var(--lf-gold)]/25 bg-[var(--lf-white)] p-4 shadow-[0_24px_60px_-36px_color-mix(in_srgb,var(--lf-rose)_80%,transparent)] transition-[box-shadow,translate] duration-500 hover:-translate-y-1 hover:shadow-[0_34px_70px_-34px_color-mix(in_srgb,var(--lf-rose)_95%,transparent)] sm:p-5"
            >
              {/* Arch-topped photo, the poster's signature frame, with a gold
                  hairline offset around it like the hero collage. */}
              <div className="relative mx-1.5 mt-1.5">
                <div
                  aria-hidden
                  className="absolute -inset-1.5 rounded-t-full rounded-b-[20px] border border-[var(--lf-gold)]/45 transition-colors duration-500 group-hover:border-[var(--lf-gold)]"
                />
                <div className="relative aspect-[5/6] overflow-hidden rounded-t-full rounded-b-[16px] bg-[var(--lf-ivory)]">
                  <NextImage
                    src={service.image}
                    alt={service.alt}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                </div>
                <span className="text-[var(--lf-gold)]">
                  <Glint className="-top-1 right-3 size-3 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </span>
              </div>

              <div className="flex flex-1 flex-col items-center px-1 pt-6 text-center">
                <h3 className="font-display text-xl font-medium">{service.name}</h3>
                <span aria-hidden className="mt-3 block h-px w-10 bg-[var(--lf-gold)]/70" />
                <p className="mt-3 flex-1 font-ui text-sm leading-[1.7] text-[var(--lf-muted)]">
                  {service.description}
                </p>

                <div className="mt-6 flex w-full items-center justify-between gap-3 border-t border-[var(--lf-gold)]/20 pt-4">
                  <span className="font-ui text-sm font-bold text-[var(--lf-gold-ink)]">
                    {service.from}
                  </span>
                  <Link
                    href="/book"
                    className="inline-flex items-center rounded-full bg-[var(--lf-gold)] px-5 py-2 font-ui text-xs font-semibold text-[var(--lf-white)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_-10px_color-mix(in_srgb,var(--lf-gold)_90%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lf-gold-ink)] active:translate-y-0"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* These six are a teaser; /services carries all of them as cards
            with prices. Without this link the page is reachable only from the
            nav, which visitors who have already scrolled past it won't go
            back up to. */}
        <div className="mt-12 text-center">
          <Link
            href="/services"
            className="inline-flex items-center rounded-full border border-[var(--lf-ink)]/20 bg-[var(--lf-white)]/60 px-8 py-3.5 font-ui text-sm font-semibold text-[var(--lf-ink)] transition-colors duration-300 hover:border-[var(--lf-gold)] hover:bg-[var(--lf-white)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lf-gold-ink)]"
          >
            View all services &amp; prices
          </Link>
        </div>

        {/* ── Full price list ────────────────────────────────────────────
            Every service and every price, because a salon page that hides
            them makes people phone to ask instead of booking. */}
        <div className="mt-16 grid gap-10 rounded-[28px] border border-[var(--lf-gold)]/25 bg-[var(--lf-white)] p-6 shadow-[0_24px_60px_-40px_color-mix(in_srgb,var(--lf-rose)_80%,transparent)] sm:p-10 md:grid-cols-2 md:gap-14">
          {serviceCategories.map((category, i) => (
            <motion.div
              key={category.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeUp(reduce, i * 0.1, 22)}
            >
              <h3 className="flex items-center gap-2.5 font-display text-xl font-medium">
                <Lotus />
                {category.title}
              </h3>
              <span aria-hidden className="mt-3 block h-px w-12 bg-[var(--lf-gold)]" />

              <dl className="mt-5">
                {category.items.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-baseline justify-between gap-4 border-b border-[var(--lf-gold)]/20 py-3 last:border-b-0"
                  >
                    <dt className="font-ui text-sm">{item.name}</dt>
                    <dd className="font-ui text-sm font-semibold whitespace-nowrap text-[var(--lf-gold-ink)]">
                      {item.price}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Wave divider ───────────────────────────────────────────────
          Mirrors the hero's: curves the cream band into the About section's
          surface below. */}
      <svg
        aria-hidden
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 z-10 h-[70px] w-full sm:h-[110px]"
      >
        <path d="M0,96 C360,16 1080,16 1440,96 L1440,160 L0,160 Z" fill="var(--lz-surface)" />
      </svg>
    </section>
  )
}
