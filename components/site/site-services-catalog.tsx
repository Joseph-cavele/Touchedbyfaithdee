"use client"

import NextImage from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"

import { fadeUp } from "@/lib/motion"
import { serviceCatalog, type CatalogItem } from "@/lib/salon-services"

/* The full catalogue, one card per service, grouped by category.

   Card anatomy follows the reference layout: a circular image medallion on a
   dark surface, then title, description, price, and a full-width action.

   NOT carried over from the reference: the star rating and review count each
   of its cards displays. There is no rating data in this system — no reviews
   collection, no aggregate on the Service model — so any stars rendered here
   would be numbers invented for real customers to read. That is a fabricated
   endorsement rather than a placeholder. When real ratings exist,
   the slot for them is between the description and the button. */

/** Initials for a service with no photograph — up to two significant words. */
function monogram(name: string) {
  const skip = new Set(["and", "the", "only", "with", "of", "&"])

  return name
    .replace(/\(.*?\)/g, "") // drop qualifiers like "(Crochet Method)"
    .split(/[\s&]+/)
    .filter((word) => word && !skip.has(word.toLowerCase()))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

function ServiceCard({ item, delay }: { item: CatalogItem; delay: number }) {
  const reduce = !!useReducedMotion()

  return (
    <motion.article
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeUp(reduce, delay, 24)}
      className="group flex flex-col items-center rounded-[22px] bg-brand-surface p-6 text-center shadow-[0_18px_50px_-24px_rgba(0,0,0,0.28)] transition-shadow duration-300 hover:shadow-[0_26px_64px_-22px_rgba(0,0,0,0.34)]"
    >
      {/* The medallion keeps its circle whether it holds a photo or a
          monogram, so a category with only some photographs still reads as
          one even grid rather than two different card designs. */}
      <div className="relative grid size-32 shrink-0 place-items-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_35%,var(--lz-blush)_0%,color-mix(in_srgb,var(--lz-rose)_32%,var(--lz-surface))_100%)]">
        {item.image ? (
          <NextImage
            src={item.image}
            alt={item.alt ?? ""}
            fill
            sizes="128px"
            className="object-cover grayscale transition-[filter,transform] duration-500 group-hover:scale-[1.06] group-hover:grayscale-0"
          />
        ) : (
          <span
            aria-hidden
            className="font-display text-3xl font-medium text-brand-accent-ink"
          >
            {monogram(item.name)}
          </span>
        )}
      </div>

      <h3 className="mt-6 font-display text-lg font-medium text-brand-text">
        {item.name}
      </h3>

      {/* Only the photographed services carry copy. Rather than invent a
          sentence for the rest, the price does the talking — `flex-1` on the
          wrapper keeps every button in a row aligned regardless. */}
      <div className="mt-2 flex flex-1 flex-col">
        {item.description && (
          <p className="font-ui text-sm leading-[1.65] text-brand-muted">
            {item.description}
          </p>
        )}

        <p className="mt-3 font-ui text-sm font-bold text-brand-accent-ink">
          {item.price}
        </p>
      </div>

      <Link
        href="/book"
        className="mt-6 w-full rounded-full bg-brand-line px-5 py-3 font-ui text-xs font-semibold text-brand-accent-ink transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-accent hover:text-brand-on-accent hover:shadow-[0_12px_26px_-10px_color-mix(in_srgb,var(--lz-gold)_90%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent active:translate-y-0"
      >
        Book {item.name}
      </Link>
    </motion.article>
  )
}

export function SiteServicesCatalog() {
  const reduce = !!useReducedMotion()

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-10 xl:px-16">
      {serviceCatalog.map((category, categoryIndex) => (
        <section
          key={category.title}
          /* Anchored so the price-list summary and any future nav can link
             straight to a category. */
          id={category.title.toLowerCase().replace(/[^a-z]+/g, "-")}
          className={categoryIndex === 0 ? "scroll-mt-28" : "mt-20 scroll-mt-28"}
        >
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp(reduce, 0, 18)}
            className="flex items-center gap-4"
          >
            <h2 className="font-display text-[clamp(1.5rem,3vw,2rem)] font-medium tracking-[-0.01em] text-brand-text">
              {category.title}
            </h2>
            <span aria-hidden className="h-px flex-1 bg-brand-line" />
            <span className="font-ui text-xs font-semibold tracking-[0.14em] text-brand-muted uppercase">
              {category.items.length} services
            </span>
          </motion.div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {category.items.map((item, i) => (
              // Delay resets each row so the stagger reads left-to-right
              // rather than drifting ever later down a long category.
              <ServiceCard key={item.name} item={item} delay={(i % 3) * 0.1} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
