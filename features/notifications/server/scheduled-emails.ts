import { createHmac, timingSafeEqual } from "node:crypto"

import { connectDB } from "@/lib/db"
import { salonDateDaysAgo } from "@/lib/date"
import { BookingModel } from "@/lib/models/Booking"
import { CustomerModel } from "@/lib/models/Customer"
import { emailFrom, EMAIL_REPLY_TO, resend } from "@/lib/resend"
import { SALON_NAME } from "@/lib/salon-contact"
import {
  customerAppointmentReminderEmailHtml,
  pendingBookingOwnerReminderEmailHtml,
} from "@/emails/booking-reminders"
import { weMissYouEmailHtml } from "@/emails/we-miss-you"
import {
  getCustomerReminderDecision,
  OWNER_APPROVAL_REMINDER_DELAY_MS,
  type CustomerReminderLead,
} from "@/features/notifications/lib/reminder-schedule"
import { getBookingServiceSnapshots } from "@/features/bookings/server/service-snapshots"

/* ══════════════════════════════════════════════════════════════════════
   Scheduled customer emails, run by GET /api/cron/emails every 15 minutes.

   Owner      3 hours after a booking is created, while it is still PENDING.
   Customer   24 hours and 2 hours before a CONFIRMED appointment.
              A reminder whose due time passed before confirmation is skipped.
   Follow-up  "We miss you", 14 days after a COMPLETED visit, only if the
              client hasn't booked again since, hasn't unsubscribed, and
              hasn't had one in the last 30 days. Visits more than 21 days
              old are left alone, so switching this on doesn't email every
              past client at once.

   Each booking is claimed atomically before a send. Resend idempotency keys
   make retries safe if the worker restarts after delivery but before MongoDB
   records the sent timestamp. Failed sends are released for the next run.
   ══════════════════════════════════════════════════════════════════════ */

const CLAIM_LEASE_MS = 20 * 60 * 1000
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

async function send(
  to: string,
  subject: string,
  html: string,
  idempotencyKey?: string
): Promise<boolean> {
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
    const message = { from: emailFrom(), to, replyTo: EMAIL_REPLY_TO, subject, html }
    const { error } = idempotencyKey
      ? await resend.emails.send(message, { idempotencyKey })
      : await resend.emails.send(message)
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
  serviceItems?: {
    serviceId?: unknown
    serviceName: string
    price?: number | null
    duration: number
  }[]
  bookingDate: string
  bookingTime: string
  createdAt: Date
  approvedAt?: Date
  reminderSentAt?: Date
  customer24HourReminderSentAt?: Date
  customer24HourReminderSkippedAt?: Date
  customer2HourReminderSentAt?: Date
  customer2HourReminderSkippedAt?: Date
}

/* ── Reminders ──────────────────────────────────────────────────────── */

export async function sendDueReminders(now = new Date()) {
  await connectDB()
  const result = {
    ownerSent: 0,
    customer24HourSent: 0,
    customer2HourSent: 0,
    failed: 0,
    skipped: 0,
  }
  const expiredClaim = new Date(now.getTime() - CLAIM_LEASE_MS)
  const claimable = (field: string) => ({
    $or: [{ [field]: { $exists: false } }, { [field]: { $lt: expiredClaim } }],
  })

  const pendingBookings = await BookingModel.find({
    status: "PENDING",
    createdAt: { $lte: new Date(now.getTime() - OWNER_APPROVAL_REMINDER_DELAY_MS) },
    ownerReminderSentAt: { $exists: false },
    ...claimable("ownerReminderClaimedAt"),
  })
    .populate("customer", "name email")
    .populate("services", "name")
    .lean<PopulatedBooking[]>()

  for (const booking of pendingBookings) {
    const ownerEmail = process.env.OWNER_EMAIL?.trim()
    if (!ownerEmail) {
      console.error(`Pending-booking reminder failed for ${booking._id}: OWNER_EMAIL is not set`)
      await BookingModel.updateOne(
        { _id: booking._id, status: "PENDING", ownerReminderSentAt: { $exists: false } },
        { $set: { ownerReminderLastError: "OWNER_EMAIL is not set" } }
      )
      result.failed++
      continue
    }

    const claim = await BookingModel.updateOne(
      {
        _id: booking._id,
        status: "PENDING",
        ownerReminderSentAt: { $exists: false },
        ...claimable("ownerReminderClaimedAt"),
      },
      { $set: { ownerReminderClaimedAt: now } }
    )
    if (!claim.modifiedCount) continue

    const stillPending = await BookingModel.exists({ _id: booking._id, status: "PENDING" })
    if (!stillPending) {
      await BookingModel.updateOne({ _id: booking._id }, { $unset: { ownerReminderClaimedAt: 1 } })
      continue
    }

    const ok = await send(
      ownerEmail,
      "Pending Booking Reminder",
      pendingBookingOwnerReminderEmailHtml({
        customerName: booking.customer?.name ?? "Unknown",
        serviceNames: getBookingServiceSnapshots(booking).map((service) => service.serviceName),
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        dashboardUrl: `${appBaseUrl()}/dashboard/bookings`,
      }),
      `booking-${booking._id}-owner-pending`
    )

    if (ok) {
      await BookingModel.updateOne(
        { _id: booking._id, ownerReminderClaimedAt: now },
        {
          $set: { ownerReminderSentAt: now },
          $unset: { ownerReminderClaimedAt: 1, ownerReminderLastError: 1 },
        }
      )
      console.info(`Pending-booking reminder sent for ${booking._id} to ${ownerEmail}`)
      result.ownerSent++
    } else {
      await BookingModel.updateOne(
        { _id: booking._id },
        {
          $set: { ownerReminderLastError: "Email delivery failed; retry scheduled." },
          $unset: { ownerReminderClaimedAt: 1 },
        }
      )
      console.error(`Pending-booking reminder delivery failed for ${booking._id}`)
      result.failed++
    }
  }

  const confirmedBookings = await BookingModel.find({
    status: "CONFIRMED",
    bookingDate: { $gte: salonDateDaysAgo(0), $lte: salonDateDaysAgo(-1) },
    $or: [
      { customer24HourReminderSentAt: { $exists: false } },
      { customer2HourReminderSentAt: { $exists: false } },
    ],
  })
    .populate("customer", "name email")
    .populate("services", "name")
    .lean<PopulatedBooking[]>()

  for (const booking of confirmedBookings) {
    const email = booking.customer?.email?.trim()
    const details = {
      customerName: booking.customer?.name ?? "there",
      serviceNames: getBookingServiceSnapshots(booking).map((service) => service.serviceName),
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
    }

    for (const lead of ["24-hour", "2-hour"] as const satisfies readonly CustomerReminderLead[]) {
      const sentField = lead === "24-hour"
        ? "customer24HourReminderSentAt"
        : "customer2HourReminderSentAt"
      const claimField = lead === "24-hour"
        ? "customer24HourReminderClaimedAt"
        : "customer2HourReminderClaimedAt"
      const skippedField = lead === "24-hour"
        ? "customer24HourReminderSkippedAt"
        : "customer2HourReminderSkippedAt"
      const lastErrorField = lead === "24-hour"
        ? "customer24HourReminderLastError"
        : "customer2HourReminderLastError"
      const sentAt = lead === "24-hour"
        ? booking.customer24HourReminderSentAt
        : booking.customer2HourReminderSentAt
      const skippedAt = lead === "24-hour"
        ? booking.customer24HourReminderSkippedAt
        : booking.customer2HourReminderSkippedAt

      if (sentAt || skippedAt) continue
      if (lead === "2-hour" && booking.reminderSentAt) {
        await BookingModel.updateOne(
          { _id: booking._id, customer2HourReminderSentAt: { $exists: false } },
          { $set: { customer2HourReminderSentAt: booking.reminderSentAt } }
        )
        continue
      }

      const decision = getCustomerReminderDecision({
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        approvedAt: booking.approvedAt,
        createdAt: new Date(booking.createdAt),
        now,
        lead,
      })
      if (decision === "not-due") continue
      if (decision === "skip" || !email) {
        await BookingModel.updateOne(
          { _id: booking._id, status: "CONFIRMED", [sentField]: { $exists: false } },
          { $set: { [skippedField]: now }, $unset: { [lastErrorField]: 1 } }
        )
        console.info(
          `Customer ${lead} reminder skipped for ${booking._id}${email ? "" : ": no customer email"}`
        )
        result.skipped++
        continue
      }

      const claim = await BookingModel.updateOne(
        {
          _id: booking._id,
          status: "CONFIRMED",
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
          [sentField]: { $exists: false },
          ...claimable(claimField),
        },
        { $set: { [claimField]: now } }
      )
      if (!claim.modifiedCount) continue

      const unchanged = await BookingModel.exists({
        _id: booking._id,
        status: "CONFIRMED",
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
      })
      if (!unchanged) {
        await BookingModel.updateOne({ _id: booking._id }, { $unset: { [claimField]: 1 } })
        continue
      }

      const ok = await send(
        email,
        "Appointment Reminder – Your Salon Visit",
        customerAppointmentReminderEmailHtml(details),
        `booking-${booking._id}-customer-${lead}-${booking.bookingDate}-${booking.bookingTime}`
      )
      if (ok) {
        await BookingModel.updateOne(
          { _id: booking._id, [claimField]: now },
          {
            $set: { [sentField]: now },
            $unset: {
              [claimField]: 1,
              [lastErrorField]: 1,
            },
          }
        )
        console.info(`Customer ${lead} reminder sent for ${booking._id} to ${email}`)
        if (lead === "24-hour") result.customer24HourSent++
        else result.customer2HourSent++
      } else {
        await BookingModel.updateOne(
          { _id: booking._id },
          {
            $set: {
              [lastErrorField]: "Email delivery failed; retry scheduled.",
            },
            $unset: { [claimField]: 1 },
          }
        )
        console.error(`Customer ${lead} reminder delivery failed for ${booking._id}`)
        result.failed++
      }
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
        serviceNames: getBookingServiceSnapshots(visit).map((s) => s.serviceName),
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
