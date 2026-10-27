import { NextRequest, NextResponse } from "next/server"
import { formatTotal } from "@/lib/currency"
import { revalidateTag } from "next/cache"
import { isValidObjectId } from "mongoose"
import { connectDB } from "@/lib/db"
import { BookingModel } from "@/lib/models/Booking"
import { BookingImageModel } from "@/lib/models/BookingImage"
import { NotificationModel } from "@/lib/models/Notification"
import { updateBookingStatusSchema } from "@/features/bookings/schema"
import { emailFrom, EMAIL_REPLY_TO, resend } from "@/lib/resend"
import { appointmentConfirmedEmailHtml } from "@/emails/appointment-confirmed"
import { appointmentCancelledEmailHtml } from "@/emails/appointment-cancelled"
import { requireOwner } from "@/lib/auth-guard"

interface PopulatedBooking {
  _id: unknown
  customer: { name: string; email: string }
  stylist: { name: string }
  services: { name: string; price?: number | null }[]
  bookingDate: string
  bookingTime: string
  status: string
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireOwner()
  if (denied) return denied

  const { id } = await params
  const body = await req.json()
  const parsed = updateBookingStatusSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status update", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { status, reason } = parsed.data

  await connectDB()

  const booking = await BookingModel.findById(id)
    .populate("customer", "name email")
    .populate("stylist", "name")
    .populate("services", "name price")
    .lean<PopulatedBooking>()

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  await BookingModel.findByIdAndUpdate(id, { status })
  await NotificationModel.updateMany({ bookingId: id, read: false }, { read: true })

  // Status changes move bookings between the dashboard's counts and revenue.
  revalidateTag("dashboard", { expire: 0 })

  const serviceNames = booking.services.map((s) => s.name)

  // null = no email applies to this status; true/false = whether it was sent.
  let emailSent: boolean | null = null

  if (resend && booking.customer.email && (status === "CONFIRMED" || status === "CANCELLED")) {
    const message =
      status === "CONFIRMED"
        ? {
            subject: "Touchedbyfaithdee Studio — your appointment is confirmed",
            html: appointmentConfirmedEmailHtml({
              customerName: booking.customer.name,
              stylistName: booking.stylist.name,
              serviceNames,
              bookingDate: booking.bookingDate,
              bookingTime: booking.bookingTime,
              // Same price line as the confirmation sent at booking time.
              totalDisplay: formatTotal(booking.services.map((s) => s.price)),
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

  return NextResponse.json({ id, status, emailSent })
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
