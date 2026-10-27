import { revalidateTag } from "next/cache"

import { appointmentConfirmedEmailHtml } from "@/emails/appointment-confirmed"
import { newBookingOwnerEmailHtml } from "@/emails/new-booking-owner"
import { connectDB } from "@/lib/db"
import { BookingModel } from "@/lib/models/Booking"
import { NotificationModel } from "@/lib/models/Notification"
import { emailFrom, EMAIL_REPLY_TO, resend } from "@/lib/resend"
import { verifyTransaction } from "@/lib/paystack"
import "@/lib/models"

export type ConfirmOutcome =
  | { outcome: "confirmed"; bookingId: string }
  | { outcome: "already-confirmed"; bookingId: string }
  | { outcome: "failed"; bookingId: string; reason: string }
  | { outcome: "unknown-reference"; reason: string }

/**
 * Turns a Paystack reference into a settled booking.
 *
 * Both the browser callback and the webhook call this, and either can arrive
 * first — or twice, since Paystack retries webhooks. So it has to be
 * idempotent, and the idempotency is enforced by a conditional update rather
 * than a read-then-write: two concurrent calls would both pass an `if
 * (booking.paymentStatus !== "PAID")` check and both send an email. The
 * `findOneAndUpdate` below only matches a booking that is NOT already paid, so
 * exactly one caller gets a document back and sends the confirmation.
 */
export async function confirmPaidBooking(reference: string): Promise<ConfirmOutcome> {
  await connectDB()

  const existing = await BookingModel.findOne({ paymentReference: reference })
  if (!existing) {
    return { outcome: "unknown-reference", reason: "No booking holds that reference" }
  }

  const bookingId = String(existing._id)
  const verified = await verifyTransaction(reference)

  if (verified.status !== "success") {
    /* Left as PENDING_PAYMENT, not cancelled — the customer can retry against
       the same booking, which is why the slot is still theirs. */
    await BookingModel.updateOne(
      { _id: existing._id, paymentStatus: { $ne: "PAID" } },
      { $set: { paymentStatus: "FAILED" } }
    )
    return { outcome: "failed", bookingId, reason: `Paystack status: ${verified.status}` }
  }

  /* Paystack says paid — but paid HOW MUCH, and in what. A transaction can be
     initialised for one amount and completed for another, so the charge is
     checked against the amount snapshotted on the booking before anything is
     confirmed. Underpayment is a failed payment, not a discount. */
  if (verified.currency !== "ZAR" || verified.amount < existing.amount) {
    console.error(
      `Payment mismatch on ${reference}: charged ${verified.amount} ${verified.currency}, expected ${existing.amount} ZAR`
    )
    await BookingModel.updateOne(
      { _id: existing._id, paymentStatus: { $ne: "PAID" } },
      { $set: { paymentStatus: "FAILED" } }
    )
    return { outcome: "failed", bookingId, reason: "Amount or currency mismatch" }
  }

  // Only the first caller to get here wins; the rest get null.
  const booking = await BookingModel.findOneAndUpdate(
    { _id: existing._id, paymentStatus: { $ne: "PAID" } },
    {
      $set: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        paidAt: verified.paidAt ? new Date(verified.paidAt) : new Date(),
      },
    },
    { returnDocument: "after" }
  )
    .populate("customer")
    .populate("stylist")
    .populate("services")

  if (!booking) {
    return { outcome: "already-confirmed", bookingId }
  }

  await NotificationModel.create({
    title: "Booking Paid",
    message: `${booking.customer?.name ?? "A customer"} paid R${existing.amount} online`,
    bookingId: booking._id,
    read: false,
  })

  if (resend && booking.customer?.email) {
    try {
      const { error } = await resend.emails.send({
        from: emailFrom(),
        to: booking.customer.email,
        replyTo: EMAIL_REPLY_TO,
        subject: "Touchedbyfaithdee Studio — your appointment is confirmed",
        html: appointmentConfirmedEmailHtml({
          customerName: booking.customer.name,
          stylistName: booking.stylist?.name ?? "your stylist",
          serviceNames: (booking.services ?? []).map((s: { name: string }) => s.name),
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
        }),
      })
      // Resend reports rejections on the result rather than throwing.
      if (error) console.error("Confirmation email rejected by Resend:", error)
    } catch (err) {
      /* Swallowed on purpose: the money is taken and the booking is confirmed.
         Failing this request over an undelivered email would leave the customer
         staring at an error page for a payment that actually went through. */
      console.error("Failed to send confirmation email", err)
    }
  }

  /* Owner notification for online payments.
     POST /api/bookings only emails the owner for in-person bookings — at that
     point an online booking is PENDING_PAYMENT and may never be paid, so
     announcing it would be announcing a booking that might not happen. The
     consequence was that a booking paid online reached the owner's inbox
     never: not at request time, and not here either. This closes that gap, and
     here is the right place for it because reaching this line means the money
     actually cleared.

     Sent independently of the customer email above — a failure there must not
     cost the owner their copy, and vice versa. Both are best-effort for the
     same reason: the payment is already taken. */
  if (resend && process.env.OWNER_EMAIL) {
    try {
      const { error } = await resend.emails.send({
        from: emailFrom(),
        to: process.env.OWNER_EMAIL,
        subject: "New booking (paid online) — Touchedbyfaithdee Studio",
        html: newBookingOwnerEmailHtml({
          customerName: booking.customer?.name ?? "A customer",
          customerEmail: booking.customer?.email ?? "",
          stylistName: booking.stylist?.name ?? "Unassigned",
          serviceNames: (booking.services ?? []).map((s: { name: string }) => s.name),
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
          paidAmount: existing.amount,
        }),
      })
      if (error) console.error("Owner paid-booking email rejected by Resend:", error)
    } catch (err) {
      console.error("Failed to send owner paid-booking email", err)
    }
  }

  revalidateTag("dashboard", { expire: 0 })

  return { outcome: "confirmed", bookingId }
}
