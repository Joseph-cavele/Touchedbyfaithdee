"use client"

import NextImage from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { fadeUp } from "@/lib/motion"
import {
  featuredServices,
  serviceSlug,
  type FeaturedService,
} from "@/lib/salon-services"

/**
 * The reference's rating line: score, five stars, review count.
 *
 * Renders nothing unless the service actually carries both a score and a
 * count. That is the whole point — the design's star row is built and ready,
 * and it appears the moment there are real reviews behind it. Until then a
 * card simply has no rating, rather than a number invented for customers to
 * read as other people's experience.
 */
function Rating({ rating, reviewCount }: Pick<FeaturedService, "rating" | "reviewCount">) {
  if (rating === undefined || reviewCount === undefined) return null

  return (
    <span className="flex items-center gap-1.5">
      <span className="font-ui text-xs font-semibold text-brand-text">
        {rating.toFixed(1)}
      </span>

      <span className="flex items-center gap-px" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className={`size-3 ${
              i < Math.round(rating)
                ? "fill-brand-accent text-brand-accent"
                : "fill-brand-line text-brand-line"
            }`}
          />
        ))}
      </span>

      <span className="sr-only">{rating.toFixed(1)} out of 5, from {reviewCount} reviews</span>
      <span aria-hidden className="font-ui text-xs text-brand-muted">
        ({reviewCount})
      </span>
    </span>
  )
}

export function SiteServiceCards() {
  const reduce = !!useReducedMotion()

  return (
    <section id="services-list" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 md:px-10 xl:px-16">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp(reduce, 0, 16)}
          className="text-center font-display text-[clamp(1.4rem,3vw,1.9rem)] font-medium tracking-[-0.01em] text-brand-text"
        >
          Our Services List
        </motion.h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredServices.map((service, i) => (
            <motion.article
              key={service.name}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp(reduce, (i % 3) * 0.09, 22)}
              className="group flex flex-col rounded-[16px] border border-brand-line/60 bg-brand-surface p-3 shadow-[0_10px_34px_-22px_rgba(0,0,0,0.35)] transition-shadow duration-300 hover:shadow-[0_18px_46px_-20px_rgba(0,0,0,0.4)]"
            >
              {/* Pale panel with the photo held in a circle — the reference's
                  signature card treatment. The panel is what gives the circle
                  something to sit on; without it the image floats. */}
              <div className="grid place-items-center rounded-[12px] bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,var(--lz-blush)_0%,var(--lz-bg)_100%)] py-7">
                <div className="relative size-32 overflow-hidden rounded-full ring-8 ring-brand-surface/70">
                  <NextImage
                    src={service.image}
                    alt={service.alt}
                    fill
                    sizes="128px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                </div>
              </div>

              <div className="flex flex-1 flex-col px-2 pt-4 pb-1">
                <h3 className="font-display text-base font-semibold text-brand-text">
                  {service.name}
                </h3>

                <p className="mt-1.5 flex-1 font-ui text-xs leading-[1.7] text-brand-muted">
                  {service.description}
                </p>

                {/* The reference puts its rating on this line. With no reviews
                    yet the row would be empty, so the price takes the space —
                    and when ratings do arrive the two sit together rather than
                    the price being pushed off the card. */}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="font-ui text-xs font-bold text-brand-accent-ink">
                    {service.from}
                  </span>
                  <Rating rating={service.rating} reviewCount={service.reviewCount} />
                </div>

                <Link
                  href={`/services/${serviceSlug(service.name)}`}
                  className="mt-4 w-full rounded-[10px] bg-brand-line/70 px-4 py-2.5 text-center font-ui text-xs font-semibold text-brand-accent-ink transition-colors duration-300 hover:bg-brand-accent hover:text-brand-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
                >
                  View details
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
