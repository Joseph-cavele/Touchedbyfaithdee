import { NextRequest, NextResponse } from "next/server"

import { confirmPaidBooking } from "@/features/bookings/server/confirm-paid-booking"
import { isValidWebhookSignature } from "@/lib/paystack"

/**
 * Paystack's server-to-server notification. This is the RELIABLE half of the
 * flow — the browser callback only fires if the customer actually returns, and
 * people close tabs the moment their bank app says "approved". Without this
 * endpoint those bookings sit unpaid forever despite the money having moved.
 *
 * Point Paystack at it in Dashboard → Settings → API Keys & Webhooks:
 *   https://<your-domain>/api/payments/webhook
 * It must be publicly reachable, so on localhost use a tunnel (ngrok et al.);
 * Paystack cannot reach http://localhost:3000.
 */
export async function POST(req: NextRequest) {
  /* The RAW body, before any JSON parsing. The signature is computed over the
     exact bytes Paystack sent — re-serialising a parsed object reorders keys
     and changes whitespace, and the digest stops matching. */
  const rawBody = await req.text()

  if (!isValidWebhookSignature(rawBody, req.headers.get("x-paystack-signature"))) {
    // Unsigned or badly signed: someone other than Paystack is posting here.
    console.error("Rejected a Paystack webhook with an invalid signature")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: { event?: string; data?: { reference?: string } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 })
  }

  const reference = event.data?.reference

  /* Always 200 for anything we don't act on. A non-2xx makes Paystack retry
     with backoff, and retrying an event we will never care about is noise. */
  if (event.event !== "charge.success" || !reference) {
    return NextResponse.json({ received: true })
  }

  try {
    const result = await confirmPaidBooking(reference)
    return NextResponse.json({ received: true, outcome: result.outcome })
  } catch (err) {
    /* 500 here is deliberate: it asks Paystack to retry. A transient failure
       verifying or writing must not silently drop a real payment. */
    console.error("Webhook failed to settle a payment", err)
    return NextResponse.json({ error: "Could not process" }, { status: 500 })
  }
}
