import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { requireOwner } from "@/lib/auth-guard"
import { connectDB } from "@/lib/db"
import { BookingModel } from "@/lib/models/Booking"
import { CustomerModel } from "@/lib/models/Customer"
import { ServiceModel } from "@/lib/models/Service"
import { StylistModel } from "@/lib/models/Stylist"
import { isSlotTaken, runsPastClosing, toMinutes } from "@/features/bookings/availability"
import { getBusyIntervals } from "@/features/bookings/server/get-busy-intervals"
import { walkInSchema } from "@/features/bookings/walk-in-schema"

/**
 * POST /api/bookings/walk-in — owner records a client who walked in.
 *
 * Finds the client by email, then phone, so a regular isn't duplicated;
 * otherwise creates them (email and phone are both optional). Then records
 * the visit as a booking with source "WALK_IN", priced from the services
 * on the server like every other booking. "Served & paid" is saved as
 * COMPLETED + PAID so it counts in revenue straight away.
 *
 * Errors carry a `message` written for the dashboard form to show as-is.
 */
export async function POST(req: Request) {
  const denied = await requireOwner()
  if (denied) return denied

  const parsed = walkInSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Please check the details and try again." },
      { status: 400 }
    )
  }
  const { name, serviceIds, stylistId, bookingDate, bookingTime, status } = parsed.data
  const email = parsed.data.email?.trim().toLowerCase() || undefined
  const phone = parsed.data.phone?.trim() || ""
  const notes = parsed.data.notes?.trim() || undefined

  await connectDB()

  const [stylist, services] = await Promise.all([
    StylistModel.findById(stylistId).catch(() => null),
    ServiceModel.find({ _id: { $in: serviceIds } }).catch(() => []),
  ])
  if (!stylist) {
    return NextResponse.json({ message: "That stylist no longer exists. Refresh and choose again." }, { status: 404 })
  }
  if (services.length !== serviceIds.length) {
    return NextResponse.json({ message: "One of those services no longer exists. Refresh and choose again." }, { status: 404 })
  }

  /* A visit booked in for later must not clash with the stylist's other
     bookings. One that already happened is recorded as it was. */
  if (status === "CONFIRMED") {
    const duration = services.reduce((sum, s) => sum + (s.duration ?? 0), 0)
    if (runsPastClosing(toMinutes(bookingTime), duration)) {
      return NextResponse.json(
        { message: "That visit would run past closing time. Choose an earlier time." },
        { status: 400 }
      )
    }
    const busy = await getBusyIntervals(stylistId, bookingDate)
    if (isSlotTaken(toMinutes(bookingTime), duration, busy)) {
      return NextResponse.json(
        { message: `${stylist.name} is already booked at ${bookingTime} on ${bookingDate}. Choose another time.` },
        { status: 409 }
      )
    }
  }

  /* Same client again? Match on email first, then phone. The email match
     ignores letter case: the online booking form stores addresses as typed,
     so "Thandi@Gmail.com" online and "thandi@gmail.com" here are one client. */
  const findByEmail = (value: string) =>
    CustomerModel.findOne({ email: value }).collation({ locale: "en", strength: 2 })
  let customer =
    (email && (await findByEmail(email))) ||
    (phone && (await CustomerModel.findOne({ phone }))) ||
    null
  try {
    if (customer) {
      // Fill in what was missing; never overwrite what the client gave before.
      if (email && !customer.email) customer.email = email
      if (phone && !customer.phone) customer.phone = phone
      await customer.save()
    } else {
      customer = await CustomerModel.create({ name, phone, ...(email ? { email } : {}) })
    }
  } catch (err) {
    // E11000: that email is already on another customer (e.g. created a moment
    // ago), or an old non-sparse email index rejects a second email-less
    // client — run `npm run sync-indexes` once if this keeps happening.
    if ((err as { code?: number }).code === 11000) {
      console.error("Walk-in customer save hit a unique index:", err)
      return NextResponse.json(
        {
          message: email
            ? "That email already belongs to another client. Leave it blank or use their phone number."
            : "We couldn't save a client without an email. Add a phone number or email and try again.",
        },
        { status: 409 }
      )
    }
    throw err
  }

  const amount = services.reduce((sum, s) => sum + (s.price ?? 0), 0)
  const booking = await BookingModel.create({
    customer: customer._id,
    stylist: stylist._id,
    services: services.map((s) => s._id),
    bookingDate,
    bookingTime,
    notes,
    amount,
    source: "WALK_IN",
    paymentMethod: "IN_PERSON",
    paymentStatus: status === "COMPLETED" ? "PAID" : "UNPAID",
    ...(status === "COMPLETED" ? { paidAt: new Date() } : {}),
    status,
  })

  // Counts, revenue and charts on the dashboard all move.
  revalidateTag("dashboard", { expire: 0 })

  return NextResponse.json(
    { id: String(booking._id), customerId: String(customer._id), customerName: customer.name },
    { status: 201 }
  )
}
