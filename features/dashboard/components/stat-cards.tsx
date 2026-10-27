import { Banknote, CalendarCheck, CalendarClock, Hourglass, UsersRound } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/currency"
import type { DashboardStats } from "@/types"

export function StatCards({ stats }: { stats: DashboardStats }) {
  /* Tints were emerald/amber/rose/sky — five unrelated stock hues that
     predated the brand theme and read as a different product next to it.
     They now follow one rule, expressed in theme tokens so they track the
     palette instead of drifting from it again:

       gold     = what the salon earned or is committed to (the numbers
                  the owner opens the page for)
       muted    = what's merely waiting or is roster context

     The icons are decorative — the figures carry the meaning — so the
     restraint costs nothing and stops the row competing with the charts. */
  const cards: {
    label: string
    value: string
    detail?: string
    icon: typeof Banknote
    tint: string
  }[] = [
    {
      label: "Total revenue",
      value: formatCurrency(stats.totalRevenue),
      // Earned = completed visits; booked = confirmed appointments to come.
      detail: `${formatCurrency(stats.earnedRevenue ?? 0)} earned · ${formatCurrency(stats.bookedRevenue ?? 0)} booked`,
      icon: Banknote,
      tint: "bg-primary/12 text-brand-accent-ink",
    },
    {
      label: "Total appointments",
      value: stats.totalAppointments.toLocaleString(),
      icon: CalendarCheck,
      tint: "bg-primary/12 text-brand-accent-ink",
    },
    {
      label: "Today's appointments",
      value: stats.todaysAppointments.toLocaleString(),
      // Bookings made today, for any date — often later in the week.
      detail: `${stats.bookedToday.toLocaleString()} booked today`,
      icon: CalendarClock,
      tint: "bg-primary/12 text-brand-accent-ink",
    },
    {
      label: "Pending appointments",
      value: stats.pendingAppointments.toLocaleString(),
      icon: Hourglass,
      tint: "bg-muted text-muted-foreground",
    },
    {
      label: "Stylists",
      value: stats.stylistCount.toLocaleString(),
      icon: UsersRound,
      tint: "bg-muted text-muted-foreground",
    },
  ]

  /* Revenue leads as an espresso card (`dark` island) — the one number the
     owner opens the page for. The rest sit on white. Icon tiles are
     arch-topped like the hero's service tiles. */
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card, i) => (
        <Card key={card.label} className={cn(i === 0 && "dark col-span-2 sm:col-span-1")}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-semibold tracking-[0.18em] text-brand-accent-ink uppercase">
                {card.label}
              </span>
              <span
                className={cn(
                  "flex h-9 w-8 shrink-0 items-center justify-center rounded-t-full rounded-b-lg ring-1 ring-brand-accent/30",
                  card.tint
                )}
              >
                <card.icon className="size-4" />
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-display text-3xl leading-none font-medium">{card.value}</span>
              {card.detail && <span className="text-xs text-muted-foreground">{card.detail}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
