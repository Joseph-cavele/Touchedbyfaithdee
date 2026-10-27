import { SALON_NAME } from "@/lib/salon-contact"
import type { ReportsData } from "@/types"

/* The Reports page as one CSV: a block per section with a blank row
   between, so it reads top-to-bottom in Excel or Google Sheets. Money is
   written as plain rand numbers (no "R", no spaces) so the cells can be
   summed and charted in the spreadsheet. */

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
}

/** RFC 4180 quoting, plus a guard against spreadsheet formula injection:
    a cell starting with = + - @ is prefixed with ' so it stays text. */
function cell(value: string | number) {
  let text = String(value)
  if (typeof value === "string" && /^[=+\-@]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const row = (...cells: (string | number)[]) => cells.map(cell).join(",")

export function reportsToCsv(data: ReportsData, generatedAt: Date) {
  const lines = [
    row(`${SALON_NAME} — Business report`),
    row("Generated", generatedAt.toLocaleString("en-ZA")),
    row("Total revenue = earned (completed) + booked (confirmed, not yet done). Monthly and per-service revenue count completed bookings. Amounts are in rand (ZAR)."),
    "",
    row("Summary"),
    row("Metric", "Value"),
    row("Total revenue (R)", data.summary.totalRevenue),
    row("Earned revenue — completed (R)", data.summary.earnedRevenue),
    row("Booked revenue — confirmed, not yet done (R)", data.summary.bookedRevenue),
    row("Completed bookings", data.summary.completedCount),
    row("Average booking value (R)", data.summary.avgBookingValue),
    row("Cancellation rate (%)", data.summary.cancellationRate),
    row("Total bookings", data.summary.totalBookings),
    "",
    row("Revenue by month (last 6 months)"),
    row("Month", "Revenue (R)"),
    ...data.monthlyRevenue.map((m) => row(m.month, m.revenue)),
    "",
    row("Bookings by status"),
    row("Status", "Bookings"),
    ...data.statusBreakdown.map((s) => row(STATUS_LABELS[s.status] ?? s.status, s.count)),
    "",
    row("Top services"),
    row("Service", "Bookings", "Revenue (R)"),
    ...data.topServices.map((s) => row(s.name, s.count, s.revenue)),
    "",
    row("Top stylists"),
    row("Stylist", "Bookings", "Revenue (R)"),
    ...data.topStylists.map((s) => row(s.name, s.bookings, s.revenue)),
  ]
  // CRLF and a byte-order mark so Excel opens it as UTF-8 (the "—" and "é").
  return "﻿" + lines.join("\r\n") + "\r\n"
}

/** e.g. "touchedbyfaithdee-report-2026-10-18.csv" — local date, not UTC. */
export function reportFileName(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `touchedbyfaithdee-report-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.csv`
}
