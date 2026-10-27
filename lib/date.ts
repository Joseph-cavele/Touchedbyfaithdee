// The salon operates on a single local calendar (South Africa / SAST by
// default). Bookings store their date as a plain "YYYY-MM-DD" string taken from
// the customer's local <input type="date">, so "today" must be resolved in that
// same local timezone — not UTC. On a UTC server (or in the early-morning local
// hours) `new Date().toISOString()` rolls over a day too early/late and makes
// the dashboard's "today's appointments" count wrong.
const SALON_TIMEZONE = process.env.SALON_TIMEZONE || "Africa/Johannesburg"

/** Today's date in the salon's timezone as a "YYYY-MM-DD" string. */
export function salonToday(): string {
  // en-CA formats as YYYY-MM-DD, which matches how bookingDate is stored.
  return new Intl.DateTimeFormat("en-CA", { timeZone: SALON_TIMEZONE }).format(
    new Date()
  )
}

/**
 * The real instant of a salon-local "YYYY-MM-DD" + "HH:MM" — e.g. when an
 * appointment starts. Works out the salon timezone's offset for that date,
 * so it stays right on a UTC server (and would survive daylight saving).
 */
export function salonDateTime(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number)
  const [hh, mm] = time.split(":").map(Number)
  const asUtc = Date.UTC(y, m - 1, d, hh, mm)
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIMEZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(asUtc))
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const zonedAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"))
  return new Date(asUtc - (zonedAsUtc - asUtc))
}

/** The salon-local date `days` days before (negative = after) today, "YYYY-MM-DD". */
export function salonDateDaysAgo(days: number): string {
  const [y, m, d] = salonToday().split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d - days)).toISOString().slice(0, 10)
}
