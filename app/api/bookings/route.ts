import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { connectDB } from "@/lib/db"
import { CustomerModel } from "@/lib/models/Customer"
import { StylistModel } from "@/lib/models/Stylist"
import { ServiceModel } from "@/lib/models/Service"
import { BookingModel } from "@/lib/models/Booking"
import { BookingImageModel } from "@/lib/models/BookingImage"
import { NotificationModel } from "@/lib/models/Notification"
import { createBookingSchema } from "@/features/bookings/schema"
import { salonDateTime, salonToday } from "@/lib/date"
import { isSlotTaken, runsPastClosing, TIME_SLOTS, toMinutes } from "@/features/bookings/availability"
import { getBusyIntervals } from "@/features/bookings/server/get-busy-intervals"
import { getBookings } from "@/features/bookings/server/get-bookings"
import { emailFrom, EMAIL_REPLY_TO, resend } from "@/lib/resend"
import { formatTotal } from "@/lib/currency"
import { newBookingOwnerEmailHtml } from "@/emails/new-booking-owner"
import { bookingRequestReceivedEmailHtml } from "@/emails/booking-reminders"
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
  if (bookingDate < salonToday() || salonDateTime(bookingDate, bookingTime) <= new Date()) {
    return NextResponse.json(
      { error: "Choose an appointment time in the future." },
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
    status: "PENDING",
  })

  if (imageUrls.length > 0) {
    await BookingImageModel.insertMany(
      imageUrls.map((imageUrl) => ({ bookingId: booking._id, imageUrl }))
    )
  }

  /* Hold the selected slot while the owner reviews this request. */
  await NotificationModel.create({
    title: "New Booking",
    message: `${customerName} requested an appointment with ${stylist.name}. Approval is required.`,
    bookingId: booking._id,
    read: false,
  })

  if (resend && customerEmail) {
    try {
      const { error } = await resend.emails.send({
        from: emailFrom(),
        to: customerEmail,
        replyTo: EMAIL_REPLY_TO,
        subject: "Touchedbyfaithdee Studio — booking request received",
        html: bookingRequestReceivedEmailHtml({
          customerName,
          serviceNames: services.map((s) => s.name),
          bookingDate,
          bookingTime,
        }),
      })
      if (error) console.error("Customer booking receipt rejected by Resend:", error)
    } catch (err) {
      console.error("Failed to send customer booking receipt", err)
    }
  }

  if (resend && process.env.OWNER_EMAIL) {
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
