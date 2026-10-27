import { NextRequest, NextResponse } from "next/server"

import { confirmPaidBooking } from "@/features/bookings/server/confirm-paid-booking"

/**
 * Where Paystack sends the customer's browser after checkout.
 *
 * This is a NAVIGATION, not a notification — it tells us the customer came
 * back, nothing more. It carries no proof of payment, anyone can type the URL,
 * and a customer who closes the tab never hits it at all. So it does exactly
 * what the webhook does: hands the reference to `confirmPaidBooking`, which
 * asks Paystack what really happened. Whichever arrives first settles the
 * booking; the second is a no-op.
 */
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
  const reference = req.nextUrl.searchParams.get("reference")

  const failed = (bookingId?: string) =>
    NextResponse.redirect(
      new URL(
        `/book/payment/failed${bookingId ? `?booking=${bookingId}` : ""}`,
        baseUrl
      )
    )

  if (!reference) return failed()

  try {
    const result = await confirmPaidBooking(reference)

    switch (result.outcome) {
      case "confirmed":
      case "already-confirmed":
        return NextResponse.redirect(
          new URL(`/book/payment/success?booking=${result.bookingId}`, baseUrl)
        )
      case "failed":
        return failed(result.bookingId)
      default:
        return failed()
    }
  } catch (err) {
    /* Verification itself broke — a Paystack outage, a network blip. The
       payment may well have succeeded, so the booking is left alone for the
       webhook to settle rather than being marked failed on our guess. */
    console.error("Payment callback could not verify the transaction", err)
    return failed()
  }
}
