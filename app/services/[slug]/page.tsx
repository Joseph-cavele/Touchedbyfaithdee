import type { Metadata } from "next"
import NextImage from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Check } from "lucide-react"

import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import {
  featuredServices,
  serviceCatalog,
  serviceSlug,
} from "@/lib/salon-services"

/**
 * Detail page behind each card's "View details".
 *
 * Everything shown here already existed — the photograph, the description and
 * the published price. Nothing about the service is invented for this page;
 * where there is nothing more to say than the card already said, the page
 * says that much and points at booking rather than padding it out.
 */
function findService(slug: string) {
  const service = featuredServices.find((s) => serviceSlug(s.name) === slug)
  if (!service) return null

  /* Joined on the name — both lists are built from the same entries in
     lib/salon-services.ts. (Not the image: services share a category photo.) */
  const category = serviceCatalog.find((c) =>
    c.items.some((item) => item.name === service.name)
  )
  const item = category?.items.find((i) => i.name === service.name)

  return { service, category, item }
}

export function generateStaticParams() {
  return featuredServices.map((service) => ({ slug: serviceSlug(service.name) }))
}

export async function generateMetadata(
  props: PageProps<"/services/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params
  const found = findService(slug)

  if (!found) return { title: "Service not found" }

  return {
    title: `${found.service.name} | Touchedbyfaithdee Studio`,
    description: found.service.description,
  }
}

export default async function ServiceDetailPage(
  props: PageProps<"/services/[slug]">
) {
  const { slug } = await props.params
  const found = findService(slug)

  if (!found) notFound()

  const { service, category, item } = found

  // Everything else in the same category, for someone who landed on the
  // wrong one and needs a way across rather than back.
  const siblings =
    category?.items.filter((i) => i.name !== service.name).slice(0, 6) ?? []

  return (
    <div className="flex flex-1 flex-col bg-brand-bg text-brand-text selection:bg-brand-accent selection:text-brand-on-accent">
      <SiteHeader active="Services" />

      <main className="mx-auto w-full max-w-7xl px-5 py-10 md:px-10 xl:px-16">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 font-ui text-xs font-semibold text-brand-muted transition-colors hover:text-brand-accent-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          All services
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="relative aspect-4/3 overflow-hidden rounded-[22px] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
            <NextImage
              src={service.image}
              alt={service.alt}
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col justify-center">
            {category && (
              <p className="font-ui text-[10px] font-semibold tracking-[0.22em] text-brand-accent-ink uppercase sm:text-[11px]">
                {category.title}
              </p>
            )}

            <h1 className="mt-3 font-display text-[clamp(1.9rem,4.2vw,2.9rem)] leading-[1.15] font-medium tracking-[-0.01em] text-brand-text">
              {service.name}
            </h1>

            <p className="mt-4 max-w-md font-ui text-sm leading-[1.75] text-brand-muted sm:text-base">
              {service.description}
            </p>

            {item && (
              <div className="mt-7 rounded-[16px] bg-brand-surface p-5 shadow-[0_14px_40px_-26px_rgba(0,0,0,0.3)]">
                <p className="font-ui text-xs font-semibold tracking-[0.14em] text-brand-muted uppercase">
                  Price
                </p>
                <p className="mt-1 font-display text-2xl font-medium text-brand-accent-ink">
                  {item.price}
                </p>
                {/* The price list quotes ranges for exactly this reason; saying
                    so is more use than a single figure that turns out wrong. */}
                {item.price.includes("–") && (
                  <p className="mt-2 font-ui text-xs leading-[1.6] text-brand-muted">
                    The range covers hair length and condition. We confirm your
                    price before we start — never after.
                  </p>
                )}
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="inline-flex items-center rounded-full bg-brand-accent px-8 py-3.5 font-ui text-sm font-semibold text-brand-on-accent transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-12px_color-mix(in_srgb,var(--lz-gold)_90%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent active:translate-y-0"
              >
                Book this service
              </Link>
              <Link
                href="/#contact"
                className="inline-flex items-center rounded-full border border-brand-line bg-brand-surface px-8 py-3.5 font-ui text-sm font-semibold text-brand-text transition-colors duration-300 hover:border-brand-accent hover:text-brand-accent-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
              >
                Ask a question
              </Link>
            </div>
          </div>
        </div>

        {siblings.length > 0 && category && (
          <section className="mt-16">
            <h2 className="font-display text-xl font-medium text-brand-text">
              Also in {category.title}
            </h2>

            <ul className="mt-5 grid gap-x-10 gap-y-1 sm:grid-cols-2">
              {siblings.map((sibling) => (
                <li
                  key={sibling.name}
                  className="flex items-baseline justify-between gap-4 border-b border-brand-line py-3"
                >
                  <span className="flex items-baseline gap-2 font-ui text-sm text-brand-text">
                    <Check className="size-3.5 shrink-0 text-brand-accent-ink" aria-hidden />
                    {sibling.name}
                  </span>
                  <span className="font-ui text-sm font-semibold whitespace-nowrap text-brand-accent-ink">
                    {sibling.price}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
