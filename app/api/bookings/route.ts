import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { connectDB } from "@/lib/db"
import { CustomerModel } from "@/lib/models/Customer"
import { StylistModel } from "@/lib/models/Stylist"
import { ServiceModel } from "@/lib/models/Service"
import { BookingModel } from "@/lib/models/Booking"
import { BookingImageModel } from "@/lib/models/BookingImage"
import { NotificationModel } from "@/lib/models/Notification"
import { createBookingSchema, ONLINE_PAYMENTS_ENABLED } from "@/features/bookings/schema"
import { isSlotTaken, runsPastClosing, TIME_SLOTS, toMinutes } from "@/features/bookings/availability"
import { getBusyIntervals } from "@/features/bookings/server/get-busy-intervals"
import { getBookings } from "@/features/bookings/server/get-bookings"
import { emailFrom, EMAIL_REPLY_TO, resend } from "@/lib/resend"
import { formatTotal } from "@/lib/currency"
import { newBookingOwnerEmailHtml } from "@/emails/new-booking-owner"
import { appointmentConfirmedEmailHtml } from "@/emails/appointment-confirmed"
import type { BookingStatus } from "@/types"
import { requireOwner } from "@/lib/auth-guard"

export async function GET(req: NextRequest) {
  const denied = await requireOwner()
  if (denied) return denied

  const status = req.nextUrl.searchParams.get("status") as BookingStatus | null
  const bookings = await getBookings(status ?? undefined)
  return NextResponse.json(bookings)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = createBookingSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking data", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const {
    customerName,
    customerEmail,
    customerPhone,
    paymentMethod,
    serviceIds,
    stylistId,
    bookingDate,
    bookingTime,
    description,
    notes,
  } = parsed.data
  const imageUrls = parsed.data.imageUrls ?? []

  await connectDB()

  const stylist = await StylistModel.findById(stylistId)
  if (!stylist) {
    return NextResponse.json({ error: "Stylist not found" }, { status: 404 })
  }

  const services = await ServiceModel.find({ _id: { $in: serviceIds } })
  if (services.length !== serviceIds.length) {
    return NextResponse.json({ error: "One or more services not found" }, { status: 404 })
  }

  /* Online payment is switched off (see ONLINE_PAYMENTS_ENABLED).
     Refused here too, not just hidden in the wizard, so a hand-made request
     can't start a Paystack charge. */
  if (paymentMethod === "ONLINE" && !ONLINE_PAYMENTS_ENABLED) {
    return NextResponse.json(
      { error: "Online payment is not available. Please choose pay in person." },
      { status: 400 }
    )
  }

  /* Double-booking guard. The new booking runs for the sum of its services'
     durations and must not overlap anything the stylist already holds that
     day. The wizard greys these times out too, but this is the check that
     counts. Two requests landing in the same instant could still both pass —
     acceptable at one salon's volume, and the dashboard shows both if so. */
  if (!TIME_SLOTS.includes(bookingTime)) {
    return NextResponse.json(
      { error: "Please choose a time within opening hours." },
      { status: 400 }
    )
  }
  const duration = services.reduce((sum, s) => sum + (s.duration ?? 0), 0)
  if (runsPastClosing(toMinutes(bookingTime), duration)) {
    return NextResponse.json(
      { error: "Those services would run past closing time. Please choose an earlier time." },
      { status: 400 }
    )
  }
  const busy = await getBusyIntervals(stylistId, bookingDate)
  if (isSlotTaken(toMinutes(bookingTime), duration, busy)) {
    return NextResponse.json(
      {
        error: `${stylist.name} is already booked at that time on ${bookingDate}. Please choose another time.`,
      },
      { status: 409 }
    )
  }

  const customer = await CustomerModel.findOneAndUpdate(
    { email: customerEmail },
    { name: customerName, email: customerEmail, phone: customerPhone },
    { upsert: true, returnDocument: "after" }
  )

  /* Priced from the Service documents just loaded, never from the request.
     The client sends service IDs; what they cost is the server's business.
     This figure is what Paystack is asked to charge AND what the verified
     charge is checked against, so a client-supplied total would let anyone
     book a R1,500 install for R1. */
  const amount = services.reduce((sum, s) => sum + (s.price ?? 0), 0)

  const payingOnline = paymentMethod === "ONLINE"
  const totalDisplay = formatTotal(services.map((s) => s.price))

  const booking = await BookingModel.create({
    customer: customer._id,
    stylist: stylist._id,
    services: services.map((s) => s._id),
    bookingDate,
    bookingTime,
    description,
    notes,
    amount,
    paymentMethod,
    paymentStatus: "UNPAID",
    /* Booking in person confirms the slot immediately — the salon no longer
       reviews each request by hand. Paying online still holds the slot and
       confirms nothing until Paystack settles, because there the money, not
       the salon, is what the booking is waiting on. */
    status: payingOnline ? "PENDING_PAYMENT" : "CONFIRMED",
  })

  if (imageUrls.length > 0) {
    await BookingImageModel.insertMany(
      imageUrls.map((imageUrl) => ({ bookingId: booking._id, imageUrl }))
    )
  }

  /* "Booked", not "requested" — the dashboard notification used to be a
     prompt to go and act on something. Now it is a heads-up about a slot
     that is already taken. */
  if (!payingOnline) await NotificationModel.create({
    title: "New Booking",
    message: `${customerName} booked an appointment with ${stylist.name}`,
    bookingId: booking._id,
    read: false,
  })

  /* The customer's confirmation.
     Previously this went out when the owner pressed Confirm on the dashboard
     (see app/api/bookings/[id]/route.ts, which still sends it for a status
     changed by hand). With the booking confirmed on creation there is no
     such press, so without this the customer would be told nothing at all —
     the booking would be confirmed in the database and silent to the person
     who made it.

     Best-effort, like every other send here: the slot is taken whether or
     not the mail lands, and failing the request would tell the customer
     their booking did not happen when it did. */
  if (!payingOnline && resend && customerEmail) {
    try {
      const { error } = await resend.emails.send({
        from: emailFrom(),
        to: customerEmail,
        replyTo: EMAIL_REPLY_TO,
        subject: "Touchedbyfaithdee Studio — your appointment is confirmed",
        html: appointmentConfirmedEmailHtml({
          customerName,
          stylistName: stylist.name,
          serviceNames: services.map((s) => s.name),
          bookingDate,
          bookingTime,
          totalDisplay,
        }),
      })
      // Resend reports rejections on the result rather than throwing.
      if (error) console.error("Customer confirmation email rejected by Resend:", error)
    } catch (err) {
      console.error("Failed to send customer confirmation email", err)
    }
  }

  if (!payingOnline && resend && process.env.OWNER_EMAIL) {
    try {
      await resend.emails.send({
        from: emailFrom(),
        to: process.env.OWNER_EMAIL,
        subject: "New booking — Touchedbyfaithdee Studio",
        html: newBookingOwnerEmailHtml({
          customerName,
          customerEmail,
          stylistName: stylist.name,
          serviceNames: services.map((s) => s.name),
          bookingDate,
          bookingTime,
          totalDisplay,
        }),
      })
    } catch (err) {
      console.error("Failed to send owner notification email", err)
    }
  }

  // A new booking changes the dashboard's counts, revenue and charts.
  revalidateTag("dashboard", { expire: 0 })

  return NextResponse.json(
    { id: String(booking._id), amount, paymentMethod },
    { status: 201 }
  )
}
