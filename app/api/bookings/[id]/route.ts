import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { formatTotal } from "@/lib/currency"
import { revalidateTag } from "next/cache"
import { isValidObjectId } from "mongoose"
import { connectDB } from "@/lib/db"
import { salonDateTime, salonToday } from "@/lib/date"
import { BookingModel } from "@/lib/models/Booking"
import { BookingImageModel } from "@/lib/models/BookingImage"
import { NotificationModel } from "@/lib/models/Notification"
import { updateBookingStatusSchema } from "@/features/bookings/schema"
import { canTransitionBookingStatus } from "@/features/bookings/server/booking-lifecycle"
import { getBusyIntervals } from "@/features/bookings/server/get-busy-intervals"
import { isSlotTaken, runsPastClosing, TIME_SLOTS, toMinutes } from "@/features/bookings/availability"
import { emailFrom, EMAIL_REPLY_TO, resend } from "@/lib/resend"
import { appointmentConfirmedEmailHtml } from "@/emails/appointment-confirmed"
import { appointmentCancelledEmailHtml } from "@/emails/appointment-cancelled"
import { bookingRejectedEmailHtml } from "@/emails/booking-reminders"
import { requireOwner } from "@/lib/auth-guard"
import type { BookingStatus } from "@/types"

interface PopulatedBooking {
  _id: unknown
  customer: { name: string; email: string }
  stylist: { _id: unknown; name: string }
  services: { name: string; price?: number | null; duration?: number | null }[]
  bookingDate: string
  bookingTime: string
  status: BookingStatus
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireOwner()
  if (denied) return denied

  const { id } = await params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  const body = await req.json()
  const parsed = updateBookingStatusSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status update", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { status, reason, bookingDate, bookingTime } = parsed.data

  await connectDB()

  const booking = await BookingModel.findById(id)
    .populate("customer", "name email")
    .populate("stylist", "name")
    .populate("services", "name price duration")
    .lean<PopulatedBooking>()

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  const nextStatus = status ?? booking.status
  const statusChanged = nextStatus !== booking.status
  const rescheduled =
    !!bookingDate &&
    !!bookingTime &&
    (bookingDate !== booking.bookingDate || bookingTime !== booking.bookingTime)
  const approval = statusChanged && nextStatus === "CONFIRMED"
  const rejection = statusChanged && nextStatus === "REJECTED"

  if (!statusChanged && !rescheduled) {
    return NextResponse.json({ id, status: nextStatus, emailSent: null })
  }

  if (statusChanged) {
    if (!canTransitionBookingStatus(booking.status, nextStatus)) {
      return NextResponse.json(
        { error: `A ${booking.status.toLowerCase()} booking cannot be changed to ${nextStatus}.` },
        { status: 409 }
      )
    }
  }

  if (
    (approval || rescheduled) &&
    ["PENDING", "PENDING_PAYMENT", "CONFIRMED"].includes(booking.status)
  ) {
    const targetDate = bookingDate ?? booking.bookingDate
    const targetTime = bookingTime ?? booking.bookingTime
    if (targetDate < salonToday() || salonDateTime(targetDate, targetTime) <= new Date()) {
      return NextResponse.json({ error: "Choose an appointment time in the future." }, { status: 400 })
    }

    if (!TIME_SLOTS.includes(targetTime)) {
      return NextResponse.json({ error: "Choose an appointment time within opening hours." }, { status: 400 })
    }

    const duration = booking.services.reduce((sum, service) => sum + (service.duration ?? 0), 0)
    if (runsPastClosing(toMinutes(targetTime), duration)) {
      return NextResponse.json(
        { error: "Those services would run past closing time. Choose an earlier time." },
        { status: 400 }
      )
    }

    const busy = await getBusyIntervals(String(booking.stylist._id), targetDate, id)
    if (isSlotTaken(toMinutes(targetTime), duration, busy)) {
      return NextResponse.json(
        { error: `That time is no longer available with ${booking.stylist.name}.` },
        { status: 409 }
      )
    }
  }

  const setFields: Record<string, unknown> = {}
  const unsetFields: Record<string, 1> = {}
  if (statusChanged) setFields.status = nextStatus
  if (rescheduled) {
    setFields.bookingDate = bookingDate
    setFields.bookingTime = bookingTime
    for (const field of [
      "reminderSentAt",
      "customer24HourReminderSentAt",
      "customer24HourReminderClaimedAt",
      "customer24HourReminderSkippedAt",
      "customer24HourReminderLastError",
      "customer2HourReminderSentAt",
      "customer2HourReminderClaimedAt",
      "customer2HourReminderSkippedAt",
      "customer2HourReminderLastError",
    ]) {
      unsetFields[field] = 1
    }
  }
  if (approval || rejection || nextStatus === "CANCELLED") {
    unsetFields.ownerReminderClaimedAt = 1
    unsetFields.ownerReminderLastError = 1
  }
  if (approval) {
    const session = await auth()
    setFields.approvedAt = new Date()
    setFields.reviewedBy = session?.user?.email ?? session?.user?.name ?? "owner"
    unsetFields.rejectedAt = 1
    unsetFields.rejectionReason = 1
  }
  if (rejection) {
    const session = await auth()
    setFields.rejectedAt = new Date()
    setFields.reviewedBy = session?.user?.email ?? session?.user?.name ?? "owner"
    if (reason) setFields.rejectionReason = reason
    else unsetFields.rejectionReason = 1
  }
  if (nextStatus === "CANCELLED" || nextStatus === "REJECTED" || nextStatus === "COMPLETED" || nextStatus === "NO_SHOW") {
    unsetFields.customer24HourReminderClaimedAt = 1
    unsetFields.customer2HourReminderClaimedAt = 1
  }

  const update: Record<string, unknown> = {}
  if (Object.keys(setFields).length) update.$set = setFields
  if (Object.keys(unsetFields).length) update.$unset = unsetFields
  const updated = await BookingModel.findOneAndUpdate(
    { _id: id, status: booking.status },
    update,
    { returnDocument: "after" }
  )

  if (!updated) {
    return NextResponse.json({ error: "This booking was changed by another request. Refresh and try again." }, { status: 409 })
  }

  if (statusChanged) {
    await NotificationModel.updateMany({ bookingId: id, read: false }, { read: true })
  }

  // Status changes move bookings between the dashboard's counts and revenue.
  revalidateTag("dashboard", { expire: 0 })

  const serviceNames = booking.services.map((s) => s.name)

  // null = no email applies to this status; true/false = whether it was sent.
  let emailSent: boolean | null = null

  if (
    resend &&
    booking.customer.email &&
    statusChanged &&
    (nextStatus === "CONFIRMED" || nextStatus === "REJECTED" || nextStatus === "CANCELLED")
  ) {
    const message =
      nextStatus === "CONFIRMED"
        ? {
            subject: "Touchedbyfaithdee Studio — your appointment is confirmed",
            html: appointmentConfirmedEmailHtml({
              customerName: booking.customer.name,
              stylistName: booking.stylist.name,
              serviceNames,
              bookingDate: bookingDate ?? booking.bookingDate,
              bookingTime: bookingTime ?? booking.bookingTime,
              totalDisplay: formatTotal(booking.services.map((s) => s.price)),
            }),
          }
        : nextStatus === "REJECTED"
          ? {
              subject: "Touchedbyfaithdee Studio — appointment request update",
              html: bookingRejectedEmailHtml({
                customerName: booking.customer.name,
                serviceNames,
                bookingDate: booking.bookingDate,
                bookingTime: booking.bookingTime,
                reason,
              }),
            }
          : {
              subject: "Touchedbyfaithdee Studio — appointment cancelled",
              html: appointmentCancelledEmailHtml({
                customerName: booking.customer.name,
                stylistName: booking.stylist.name,
                serviceNames,
                bookingDate: booking.bookingDate,
                bookingTime: booking.bookingTime,
                reason,
              }),
            }

    try {
      const { error } = await resend.emails.send({
        from: emailFrom(),
        to: booking.customer.email,
        replyTo: EMAIL_REPLY_TO,
        subject: message.subject,
        html: message.html,
      })
      // Resend reports failures (e.g. the sandbox "own address only" 403) via the
      // returned `error` object without throwing — so we must check it explicitly.
      if (error) {
        console.error("Booking status email rejected by Resend:", error)
        emailSent = false
      } else {
        emailSent = true
      }
    } catch (err) {
      console.error("Failed to send booking status email", err)
      emailSent = false
    }
  }

  return NextResponse.json({ id, status: nextStatus, emailSent })
}

/* Removes a booking for good (test bookings, duplicates, mistakes). No
   email goes out — to tell the customer, cancel instead (PATCH above). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireOwner()
  if (denied) return denied

  const { id } = await params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  await connectDB()
  const booking = await BookingModel.findByIdAndDelete(id)

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  // Nothing else should point at a booking that no longer exists.
  await Promise.all([
    NotificationModel.deleteMany({ bookingId: id }),
    BookingImageModel.deleteMany({ bookingId: id }),
  ])

  revalidateTag("dashboard", { expire: 0 })

  return NextResponse.json({ id })
}
