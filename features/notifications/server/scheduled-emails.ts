import { createHmac, timingSafeEqual } from "node:crypto"

import { connectDB } from "@/lib/db"
import { salonDateDaysAgo, salonDateTime } from "@/lib/date"
import { BookingModel } from "@/lib/models/Booking"
import { CustomerModel } from "@/lib/models/Customer"
import { emailFrom, EMAIL_REPLY_TO, resend } from "@/lib/resend"
import { SALON_NAME } from "@/lib/salon-contact"
import { appointmentReminderEmailHtml } from "@/emails/appointment-reminder"
import { weMissYouEmailHtml } from "@/emails/we-miss-you"

/* ══════════════════════════════════════════════════════════════════════
   Scheduled customer emails, run by GET /api/cron/emails every 15 minutes.

   Reminder   ~2 hours before a CONFIRMED / PENDING appointment.
              Skipped when the booking itself was made less than 2 hours
              before (the confirmation email has only just gone out).
   Follow-up  "We miss you", 14 days after a COMPLETED visit, only if the
              client hasn't booked again since, hasn't unsubscribed, and
              hasn't had one in the last 30 days. Visits more than 21 days
              old are left alone, so switching this on doesn't email every
              past client at once.

   Every send is "claimed" first by stamping the booking atomically, so two
   overlapping runs can't email the same person twice; a failed send
   un-claims it to be retried on the next run.
   ══════════════════════════════════════════════════════════════════════ */

const REMINDER_LEAD_MS = 2 * 60 * 60 * 1000
const FOLLOW_UP_AFTER_DAYS = 14
const FOLLOW_UP_WINDOW_DAYS = 21
const FOLLOW_UP_GAP_MS = 30 * 24 * 60 * 60 * 1000

export function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000").replace(/\/+$/, "")
}

/* ── Unsubscribe links ──────────────────────────────────────────────── */

function unsubscribeToken(customerId: string) {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is not set")
  return createHmac("sha256", secret).update(`unsubscribe:${customerId}`).digest("hex").slice(0, 32)
}

export function unsubscribeUrl(customerId: string) {
  return `${appBaseUrl()}/api/unsubscribe?c=${customerId}&t=${unsubscribeToken(customerId)}`
}

export function isValidUnsubscribeToken(customerId: string, token: string) {
  const expected = Buffer.from(unsubscribeToken(customerId))
  const actual = Buffer.from(token)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

/* ── Sending ────────────────────────────────────────────────────────── */

async function send(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend) {
    // No RESEND_API_KEY: log in development so the job can be tried locally.
    if (process.env.NODE_ENV !== "production") {
      console.log(`✉️  [no RESEND_API_KEY] would email ${to}: ${subject}`)
      return true
    }
    console.error("Scheduled email not sent: RESEND_API_KEY is not set")
    return false
  }
  try {
    const { error } = await resend.emails.send({ from: emailFrom(), to, replyTo: EMAIL_REPLY_TO, subject, html })
    if (error) {
      console.error("Scheduled email rejected by Resend:", error)
      return false
    }
    return true
  } catch (err) {
    console.error("Scheduled email failed", err)
    return false
  }
}

type PopulatedBooking = {
  _id: unknown
  customer: { _id: unknown; name: string; email?: string; marketingOptOut?: boolean } | null
  stylist: { name: string } | null
  services: { name: string }[]
  bookingDate: string
  bookingTime: string
  createdAt: Date
}

/* ── Reminders ──────────────────────────────────────────────────────── */

export async function sendDueReminders(now = new Date()) {
  await connectDB()
  const result = { sent: 0, failed: 0 }

  // Appointments today or tomorrow (salon dates) that haven't been reminded.
  const candidates = await BookingModel.find({
    status: { $in: ["CONFIRMED", "PENDING"] },
    reminderSentAt: { $exists: false },
    bookingDate: { $gte: salonDateDaysAgo(0), $lte: salonDateDaysAgo(-1) },
  })
    .populate("customer", "name email")
    .populate("stylist", "name")
    .populate("services", "name")
    .lean<PopulatedBooking[]>()

  for (const b of candidates) {
    const email = b.customer?.email
    if (!email) continue
    const start = salonDateTime(b.bookingDate, b.bookingTime).getTime()
    const untilStart = start - now.getTime()
    if (untilStart <= 0 || untilStart > REMINDER_LEAD_MS) continue
    // Booked at short notice — the confirmation has only just been sent.
    if (start - new Date(b.createdAt).getTime() < REMINDER_LEAD_MS) continue

    const claimed = await BookingModel.updateOne(
      { _id: b._id, reminderSentAt: { $exists: false } },
      { $set: { reminderSentAt: now } }
    )
    if (claimed.modifiedCount === 0) continue // another run took it

    const ok = await send(
      email,
      `Reminder: your ${SALON_NAME} appointment is at ${b.bookingTime} today`,
      appointmentReminderEmailHtml({
        customerName: b.customer?.name ?? "there",
        bookingTime: b.bookingTime,
        serviceNames: b.services.map((s) => s.name),
        stylistName: b.stylist?.name ?? "our team",
      })
    )
    if (ok) result.sent++
    else {
      result.failed++
      await BookingModel.updateOne({ _id: b._id }, { $unset: { reminderSentAt: 1 } })
    }
  }
  return result
}

/* ── "We miss you" follow-ups ───────────────────────────────────────── */

export async function sendDueFollowUps(now = new Date()) {
  await connectDB()
  const result = { sent: 0, failed: 0, skipped: 0 }

  // Completed visits from 14–21 days ago, newest first.
  const visits = await BookingModel.find({
    status: "COMPLETED",
    followUpSentAt: { $exists: false },
    bookingDate: { $gte: salonDateDaysAgo(FOLLOW_UP_WINDOW_DAYS), $lte: salonDateDaysAgo(FOLLOW_UP_AFTER_DAYS) },
  })
    .populate("customer", "name email marketingOptOut")
    .populate("services", "name")
    .sort({ bookingDate: -1, bookingTime: -1 })
    .lean<PopulatedBooking[]>()

  const seen = new Set<string>()
  for (const visit of visits) {
    const customer = visit.customer
    if (!customer) continue
    const customerId = String(customer._id)
    if (seen.has(customerId)) continue // only their latest visit in the window
    seen.add(customerId)

    if (!customer.email || customer.marketingOptOut) {
      // No address, or unsubscribed: mark the visit handled (epoch = skipped).
      await BookingModel.updateOne({ _id: visit._id }, { $set: { followUpSentAt: new Date(0) } })
      result.skipped++
      continue
    }

    // Booked again since (any later, non-cancelled booking)? Then no nudge.
    const rebooked = await BookingModel.exists({
      customer: customer._id,
      _id: { $ne: visit._id },
      status: { $nin: ["CANCELLED", "NO_SHOW"] },
      $or: [
        { bookingDate: { $gt: visit.bookingDate } },
        { bookingDate: visit.bookingDate, bookingTime: { $gt: visit.bookingTime } },
      ],
    })
    // Already nudged in the last 30 days (for an earlier visit)?
    const recentlyNudged = await BookingModel.exists({
      customer: customer._id,
      followUpSentAt: { $gte: new Date(now.getTime() - FOLLOW_UP_GAP_MS) },
    })
    if (rebooked || recentlyNudged) {
      // Mark it so this visit isn't reconsidered on every run.
      await BookingModel.updateOne({ _id: visit._id }, { $set: { followUpSentAt: new Date(0) } })
      result.skipped++
      continue
    }

    const claimed = await BookingModel.updateOne(
      { _id: visit._id, followUpSentAt: { $exists: false } },
      { $set: { followUpSentAt: now } }
    )
    if (claimed.modifiedCount === 0) continue

    const ok = await send(
      customer.email,
      `We miss you at ${SALON_NAME}!`,
      weMissYouEmailHtml({
        customerName: customer.name,
        serviceNames: visit.services.map((s) => s.name),
        bookUrl: `${appBaseUrl()}/book`,
        unsubscribeUrl: unsubscribeUrl(customerId),
      })
    )
    if (ok) result.sent++
    else {
      result.failed++
      await BookingModel.updateOne({ _id: visit._id }, { $unset: { followUpSentAt: 1 } })
    }
  }
  return result
}

/** Unsubscribe a customer from follow-ups (the link in "we miss you"). */
export async function optOutCustomer(customerId: string) {
  await connectDB()
  const res = await CustomerModel.updateOne({ _id: customerId }, { $set: { marketingOptOut: true } }).catch(() => null)
  return !!res && res.matchedCount > 0
}
