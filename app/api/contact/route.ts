import { NextRequest, NextResponse } from "next/server"

import { DEFAULT_DIAL_CODE, contactMessageSchema } from "@/features/contact/schema"
import { contactMessageOwnerEmailHtml } from "@/emails/contact-message-owner"
import { contactMessageReceivedEmailHtml } from "@/emails/contact-message-received"
import { connectDB } from "@/lib/db"
import { ContactMessageModel } from "@/lib/models/ContactMessage"
import { EMAIL_REPLY_TO, emailFrom, resend } from "@/lib/resend"

/**
 * Public contact endpoint — unauthenticated, and it writes to the database
 * and sends email, which makes it the most abusable route in the app. Two
 * cheap defences: the honeypot below, and the per-IP window.
 *
 * The window lives in module memory, so it resets on redeploy and is per
 * instance rather than global — it slows a single sender down, it does not
 * stop a distributed flood. If this ever draws real spam, move it to a shared
 * store (Redis/Upstash) or put a CAPTCHA in front.
 */
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 10 * 60 * 1000
const hits = new Map<string, number[]>()

function isRateLimited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)

  // Opportunistic sweep — without it the map grows once per unique IP, for
  // the life of the process.
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(key)
    }
  }

  return recent.length > RATE_LIMIT
}

export async function POST(req: NextRequest) {
  // `NextRequest.ip` is gone; the proxy header is what's left. Spoofable, but
  // this is friction, not authentication.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many messages. Please try again in a few minutes." },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  /* Honeypot, checked before validation and answered with an ordinary success:
     a bot that gets a 400 learns to retry without the field, and one that gets
     a 200 has no reason to come back at all. Nothing is stored or sent. */
  const { website } = body as { website?: unknown }
  if (typeof website === "string" && website.trim() !== "") {
    return NextResponse.json({ ok: true, emailSent: true }, { status: 201 })
  }

  const parsed = contactMessageSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid message", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { name, email, dialCode, phone, message, marketingOptIn } = parsed.data

  /* The dial code is only meaningful attached to a number, so an empty phone
     field stores an empty string rather than a bare "+27". A number the
     visitor already typed in international form keeps its own code — the
     fallback exists for bare national numbers, and prefixing both would
     store "+27 +27 82 …". */
  const fullPhone = !phone
    ? ""
    : phone.startsWith("+")
      ? phone
      : `${dialCode ?? DEFAULT_DIAL_CODE} ${phone}`

  await connectDB()

  /* Stored first, emailed second — and deliberately in that order. Delivery is
     the part that fails: Resend's sandbox rejects every address but the
     account owner's, and a live key can still bounce. Writing the message down
     before trying to send it is what makes "thanks, we have your message" true
     even when the notification never lands.

     NOTE: nothing in the dashboard reads this collection yet, so today these
     messages are only visible in MongoDB or in the owner's inbox. An inbox
     screen is the obvious next piece of work. */
  const saved = await ContactMessageModel.create({
    name,
    email,
    phone: fullPhone,
    message,
    marketingOptIn,
  })

  // null = no attempt was possible; true/false = whether it went out.
  let emailSent: boolean | null = null
  const to = process.env.OWNER_EMAIL

  if (!resend || !to) {
    console.error(
      "Contact message saved but not emailed — delivery is unconfigured (needs RESEND_API_KEY and OWNER_EMAIL)."
    )
  } else {
    try {
      const { error } = await resend.emails.send({
        from: emailFrom(),
        to,
        // Reply goes to the visitor, not to the no-reply sender, so the owner
        // can answer from their inbox without copying the address out.
        replyTo: email,
        subject: `Website enquiry from ${name} — Touchedbyfaithdee Studio`,
        html: contactMessageOwnerEmailHtml({
          name,
          email,
          phone: fullPhone,
          message,
          marketingOptIn,
        }),
      })

      // Resend reports failures (e.g. the sandbox "own address only" 403) on
      // the returned object without throwing, so this has to be checked.
      if (error) {
        console.error("Contact email rejected by Resend:", error)
        emailSent = false
      } else {
        emailSent = true
      }
    } catch (err) {
      console.error("Failed to send contact email", err)
      emailSent = false
    }
  }

  /* The visitor's copy: confirms the enquiry arrived. Independent of the
     owner's email above — one failing never stops the other — and never
     fails the request, since the message is already saved. */
  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: emailFrom(),
        to: email,
        // Their reply lands in the salon's inbox, not the no-reply sender.
        replyTo: EMAIL_REPLY_TO,
        subject: "We received your message — Touchedbyfaithdee Studio",
        html: contactMessageReceivedEmailHtml({ name, message }),
      })
      if (error) console.error("Contact confirmation email rejected by Resend:", error)
    } catch (err) {
      console.error("Failed to send contact confirmation email", err)
    }
  }

  return NextResponse.json(
    { ok: true, id: String(saved._id), emailSent },
    { status: 201 }
  )
}
