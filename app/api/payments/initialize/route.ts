import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { connectDB } from "@/lib/db"
import { BookingModel } from "@/lib/models/Booking"
import {
  buildReference,
  initializeTransaction,
  isPaystackConfigured,
} from "@/lib/paystack"
import "@/lib/models"

const bodySchema = z.object({
  bookingId: z.string().min(1, "bookingId is required"),
})

/**
 * Starts a Paystack checkout for an existing booking and hands back the URL
 * to redirect to.
 *
 * Note what this endpoint does NOT accept: an amount. It takes a booking id,
 * loads the booking, and charges the figure stored on it. The amount was
 * computed server-side when the booking was created, so there is no request
 * shape here that lets a caller influence the price.
 */
export async function POST(req: NextRequest) {
  if (!isPaystackConfigured) {
    console.error("Payment attempted but PAYSTACK_SECRET_KEY is not set.")
    return NextResponse.json(
      { error: "Online payment is not available right now. Please pay in person." },
      { status: 503 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  await connectDB()

  const booking = await BookingModel.findById(parsed.data.bookingId).populate("customer")

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  if (booking.paymentStatus === "PAID") {
    return NextResponse.json({ error: "This booking is already paid" }, { status: 409 })
  }

  if (!booking.amount || booking.amount <= 0) {
    return NextResponse.json(
      { error: "This booking has no amount to charge" },
      { status: 400 }
    )
  }

  const email = booking.customer?.email
  if (!email) {
    return NextResponse.json({ error: "Booking has no customer email" }, { status: 400 })
  }

  /* A fresh reference per attempt. Reusing the previous one after a failure
     makes Paystack reject the retry as a duplicate, which would strand a
     customer whose first card declined. */
  const reference = buildReference(String(booking._id))

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  try {
    const { authorizationUrl } = await initializeTransaction({
      email,
      amount: booking.amount,
      reference,
      callbackUrl: `${baseUrl}/api/payments/callback`,
      metadata: {
        bookingId: String(booking._id),
        customerName: booking.customer?.name,
      },
    })

    // Saved only after Paystack accepts it, so the booking never points at a
    // reference that does not exist on their side.
    booking.paymentReference = reference
    booking.paymentStatus = "UNPAID"
    await booking.save()

    return NextResponse.json({ authorizationUrl, reference })
  } catch (err) {
    console.error("Failed to initialise Paystack transaction", err)
    return NextResponse.json(
      { error: "Could not start the payment. Please try again." },
      { status: 502 }
    )
  }
}
