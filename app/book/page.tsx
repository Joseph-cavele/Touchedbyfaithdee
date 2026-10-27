import Image from "next/image"
import {
  CalendarCheck,
  ChevronRight,
  Clock,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"
import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"
import { BookingWizard } from "@/features/bookings/components/booking-wizard"
import { SERVICE_CATEGORIES } from "@/features/services/schema"
import { getServices } from "@/features/services/server/get-services"
import { salonImages } from "@/lib/salon-assets"

const heroSteps = [
  { n: "1", label: "Choose Service", icon: Sparkles },
  { n: "2", label: "Select Time", icon: Clock },
  { n: "3", label: "Confirm Booking", icon: CalendarCheck },
]

const features = [
  { icon: CalendarCheck, title: "Easy Booking", text: "Book your appointment in just a few clicks." },
  { icon: Users, title: "Expert Stylists", text: "Our professionals are here to make you look your best." },
  { icon: ShieldCheck, title: "Hygiene & Safety", text: "We follow top-notch hygiene standards for your safety." },
  { icon: Sparkles, title: "Best Experience", text: "Relax and enjoy a premium salon experience." },
]

type Category = (typeof SERVICE_CATEGORIES)[number]
const isCategory = (value?: string): value is Category =>
  SERVICE_CATEGORIES.includes(value as Category)

/* /book?service=<id> (a combo's "Book" button on the home page) opens the
   wizard with that service chosen; /book?category=Makeup opens that tab.
   Both are checked against the real list, so a stale or edited link just
   falls back to the normal empty wizard. */
async function preselection(params: { service?: string | string[]; category?: string | string[] }) {
  const serviceId = typeof params.service === "string" ? params.service : undefined
  const category = typeof params.category === "string" ? params.category : undefined

  if (serviceId) {
    const service = (await getServices().catch(() => [])).find((s) => s.id === serviceId)
    if (service) {
      return {
        initialServiceId: service.id,
        initialCategory: isCategory(service.category) ? service.category : undefined,
      }
    }
  }
  return { initialCategory: isCategory(category) ? category : undefined }
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const initial = await preselection(await searchParams)

  return (
    <div className="flex flex-1 flex-col bg-brand-bg text-brand-text">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[58%]">
          <Image
            src={salonImages.bookingBanner.src}
            alt={salonImages.bookingBanner.alt}
            fill
            priority
            sizes="(min-width: 640px) 58vw, 100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-t from-brand-bg via-brand-bg/70 to-brand-bg/20 sm:bg-linear-to-r sm:from-brand-bg sm:via-brand-bg/40 sm:to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pt-32 pb-16 sm:pt-36 sm:pb-20">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tracking-[0.3em] text-brand-accent-ink">
                BOOK YOUR APPOINTMENT
              </span>
              <span className="h-px w-12 bg-brand-accent/40" />
            </div>

            <h1 className="mt-5 font-display text-5xl leading-[1.05] font-bold sm:text-6xl">
              We Can&apos;t Wait
              <br />
              To <span className="italic text-brand-accent-ink">Pamper</span> You
              <Sparkles className="ml-2 inline size-7 text-brand-accent-ink" />
            </h1>

            <p className="mt-5 max-w-md text-sm text-brand-muted">
              Choose your preferred service, stylist, and time. We&apos;ll take
              care of the rest.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              {heroSteps.map((s, i) => (
                <div key={s.n} className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full border border-brand-accent/30 bg-brand-bg/70 text-brand-accent-ink backdrop-blur">
                      <s.icon className="size-5" />
                    </span>
                    <span className="text-xs font-medium text-brand-text/80">
                      {s.n}. {s.label}
                    </span>
                  </div>
                  {i < heroSteps.length - 1 && (
                    <ChevronRight className="size-4 text-brand-text/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Wizard — #booking is where the home page's combo buttons land. */}
      <section id="booking" className="scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <BookingWizard {...initial} />
        </div>
      </section>

      {/* Features strip */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-2xl bg-brand-surface p-6 shadow-sm ring-1 ring-brand-line sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-line/50 text-brand-accent-ink">
                  <f.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-brand-text">{f.title}</h3>
                  <p className="mt-0.5 text-xs text-brand-muted">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
