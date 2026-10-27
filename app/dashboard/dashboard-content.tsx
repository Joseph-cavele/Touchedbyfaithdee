"use client"

import Link from "next/link"
import { CalendarClock, ExternalLink, Loader2, Sparkles } from "lucide-react"
import { Glint, laFePalette, laFeScript, Lotus } from "@/components/site/la-fe-brand"
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard"
import { StatCards } from "@/features/dashboard/components/stat-cards"
import { MonthlyBookingsChart } from "@/features/dashboard/components/monthly-bookings-chart"
import { ServicesPerformanceChart } from "@/features/dashboard/components/services-performance-chart"
import { UpcomingAppointmentsTable } from "@/features/dashboard/components/upcoming-appointments-table"
import { RecentActivity } from "@/features/dashboard/components/recent-activity"

/* Shortcuts to pages that already exist — nothing new behind them. */
const quickLinks = [
  { label: "View bookings", href: "/dashboard/bookings", icon: CalendarClock },
  { label: "Manage services", href: "/dashboard/services", icon: Sparkles },
  { label: "Open booking page", href: "/book", icon: ExternalLink },
]

/** Greeting band in the La-fe style: ivory-to-blush ground, script name,
    lotus divider and tagline, as on the public hero. */
function WelcomeBanner({ name }: { name?: string | null }) {
  const firstName = name?.trim().split(" ")[0]
  /* Rendered on the server and again in the browser, which may sit in a
     different time zone — the date is the one value allowed to differ. */
  const today = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <section
      style={laFePalette}
      className="relative isolate overflow-hidden rounded-[28px] border border-[var(--lf-gold)]/30 bg-[linear-gradient(110deg,var(--lf-white)_0%,var(--lf-ivory)_55%,color-mix(in_srgb,var(--lf-rose)_22%,var(--lf-ivory))_100%)] px-6 py-6 text-[var(--lf-ink)] shadow-[0_24px_50px_-36px_color-mix(in_srgb,var(--lf-rose)_90%,transparent)] sm:px-8 sm:py-7"
    >
      <span aria-hidden className="text-[var(--lf-gold)]">
        <Glint className="top-5 right-[38%] size-3 opacity-70" />
        <Glint className="right-6 bottom-6 size-4" />
        <Glint className="top-8 right-16 size-2 opacity-60" />
      </span>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p
            suppressHydrationWarning
            className="font-ui text-[10px] font-semibold tracking-[0.28em] text-[var(--lf-gold-ink)] uppercase"
          >
            {today}
          </p>
          <h2 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] leading-tight font-medium">
            Welcome back
            {firstName && (
              <>
                ,{" "}
                <span className={`${laFeScript.className} text-[1.35em] font-normal text-[var(--lf-rose-ink)]`}>
                  {firstName}
                </span>
              </>
            )}
          </h2>
          <div aria-hidden className="mt-2 flex items-center gap-3">
            <span className="h-px w-10 bg-[var(--lf-gold)]/60" />
            <Lotus />
            <span className="h-px w-10 bg-[var(--lf-gold)]/60" />
          </div>
          <p className="mt-2 font-ui text-[11px] font-semibold tracking-[0.24em] text-[var(--lf-gold-ink)] uppercase">
            Your Beauty Is Our Priority
          </p>
        </div>

        <nav aria-label="Quick links" className="flex flex-wrap gap-2.5">
          {quickLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                i === 0
                  ? "inline-flex items-center gap-2 rounded-full bg-[var(--lf-gold)] px-5 py-2.5 font-ui text-xs font-semibold text-[var(--lf-white)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_-10px_color-mix(in_srgb,var(--lf-gold)_90%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lf-gold-ink)]"
                  : "inline-flex items-center gap-2 rounded-full border border-[var(--lf-ink)]/15 bg-[var(--lf-white)]/70 px-5 py-2.5 font-ui text-xs font-semibold transition-colors duration-300 hover:border-[var(--lf-gold)] hover:bg-[var(--lf-white)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lf-gold-ink)]"
              }
            >
              <link.icon className="size-3.5" aria-hidden />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  )
}

export function DashboardContent({ name }: { name?: string | null }) {
  const { data, isLoading, isError } = useDashboard()

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <p className="p-6 text-sm text-destructive">
        Could not load dashboard data. Please refresh the page.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <WelcomeBanner name={name} />
      <StatCards stats={data.stats} />

      {/* `min-w-0` on every grid child is load-bearing, not defensive tidying.
          Grid items default to `min-width: auto`, which refuses to shrink below
          the intrinsic width of their content. Without it the appointments
          table pushed its column wider than the track instead of letting the
          `overflow-x-auto` container inside <Table> take over, so the right-hand
          columns were clipped with no way to scroll to them. Recharts has the
          same problem — it measures a parent that never shrank. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <MonthlyBookingsChart data={data.monthlyBookings} />
        </div>
        <div className="min-w-0">
          <ServicesPerformanceChart data={data.servicesPerformance} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <UpcomingAppointmentsTable appointments={data.upcomingAppointments} />
        </div>
        <div id="activity" className="min-w-0">
          <RecentActivity items={data.recentActivity} />
        </div>
      </div>
    </div>
  )
}
