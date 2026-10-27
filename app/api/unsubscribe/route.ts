import { isValidObjectId } from "mongoose"

import { SALON_NAME, SALON_PHONE_DISPLAY } from "@/lib/salon-contact"
import { isValidUnsubscribeToken, optOutCustomer } from "@/features/notifications/server/scheduled-emails"

/**
 * GET /api/unsubscribe?c=<customerId>&t=<token> — the link at the foot of
 * the "we miss you" email. The token is an HMAC of the customer id, so the
 * link only works for the person it was sent to. Appointment confirmations
 * and reminders keep coming; only the follow-ups stop.
 */
function page(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — ${SALON_NAME}</title></head>
<body style="margin:0;background:#F8EEDF;font-family:Georgia,serif;color:#211A12;display:grid;place-items:center;min-height:100vh;padding:24px">
<main style="max-width:420px;text-align:center;background:#fff;border:1px solid #e6d6b8;border-radius:20px;padding:32px">
<p style="letter-spacing:.25em;font-size:11px;color:#7e6332;text-transform:uppercase;margin:0">${SALON_NAME}</p>
<h1 style="font-weight:500;margin:12px 0">${title}</h1>
<p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">${body}</p>
<p style="font-family:Arial,sans-serif;font-size:14px"><a href="/" style="color:#7e6332">Back to the website</a></p>
</main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  )
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const customerId = url.searchParams.get("c") ?? ""
  const token = url.searchParams.get("t") ?? ""

  if (!isValidObjectId(customerId) || !isValidUnsubscribeToken(customerId, token)) {
    return page(
      "Link not recognised",
      `This unsubscribe link isn't valid. To stop our emails, call or WhatsApp us on ${SALON_PHONE_DISPLAY}.`,
      400
    )
  }

  await optOutCustomer(customerId)
  return page(
    "You're unsubscribed",
    "You won't get “we miss you” emails from us any more. We'll still send your appointment confirmations and reminders."
  )
}
