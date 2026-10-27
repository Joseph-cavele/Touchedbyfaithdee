import crypto from "node:crypto"

/**
 * Paystack, server-side only.
 *
 * NOTHING in this file may be imported into a client component — it reads
 * PAYSTACK_SECRET_KEY, and a secret key that reaches the browser can charge
 * cards and issue refunds on the salon's account. The public key is the only
 * half that is safe to ship, and this integration is a redirect flow, so the
 * browser never needs either.
 */
const PAYSTACK_API = "https://api.paystack.co"

/** Null when unconfigured, mirroring lib/resend.ts, so callers degrade
    instead of throwing at import time. */
export const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY ?? null

export const isPaystackConfigured = Boolean(paystackSecretKey)

/**
 * Paystack works in the currency's smallest unit — cents for ZAR. Sending
 * Rand directly charges a hundredth of the intended amount, which is the
 * classic way to discover this in production rather than in test mode.
 */
export const toSubunit = (rand: number) => Math.round(rand * 100)
export const fromSubunit = (cents: number) => cents / 100

type InitializeArgs = {
  email: string
  /** In Rand. Converted here — callers pass what the customer sees. */
  amount: number
  reference: string
  callbackUrl: string
  metadata?: Record<string, unknown>
}

type InitializeResult = {
  authorizationUrl: string
  accessCode: string
  reference: string
}

async function paystackFetch(path: string, init?: RequestInit) {
  if (!paystackSecretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not set")
  }

  const res = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    // Payment calls must never be served from a cache.
    cache: "no-store",
  })

  const body = await res.json().catch(() => null)

  if (!res.ok || !body?.status) {
    throw new Error(
      `Paystack ${path} failed (${res.status}): ${body?.message ?? "no response body"}`
    )
  }

  return body
}

/** Creates a transaction and returns the hosted checkout URL to redirect to. */
export async function initializeTransaction({
  email,
  amount,
  reference,
  callbackUrl,
  metadata,
}: InitializeArgs): Promise<InitializeResult> {
  const body = await paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: toSubunit(amount),
      currency: "ZAR",
      reference,
      callback_url: callbackUrl,
      metadata,
    }),
  })

  return {
    authorizationUrl: body.data.authorization_url,
    accessCode: body.data.access_code,
    reference: body.data.reference,
  }
}

export type VerifiedTransaction = {
  status: string
  /** In Rand, converted back from cents. */
  amount: number
  currency: string
  reference: string
  paidAt: string | null
}

/**
 * Asks Paystack what actually happened. This is the only source of truth for
 * whether a booking is paid — the browser coming back to the callback URL
 * proves only that the browser came back. Anyone can type that URL.
 */
export async function verifyTransaction(
  reference: string
): Promise<VerifiedTransaction> {
  const body = await paystackFetch(
    `/transaction/verify/${encodeURIComponent(reference)}`
  )

  return {
    status: body.data.status,
    amount: fromSubunit(body.data.amount),
    currency: body.data.currency,
    reference: body.data.reference,
    paidAt: body.data.paid_at ?? null,
  }
}

/**
 * Paystack signs webhooks with HMAC-SHA512 over the raw body using the secret
 * key. Verify before trusting anything in the payload — the endpoint is public,
 * so without this check anyone could POST "payment succeeded" for any booking.
 *
 * `timingSafeEqual` rather than `===`: comparing signatures with a short-circuit
 * string compare leaks how much of the digest was correct.
 */
export function isValidWebhookSignature(rawBody: string, signature: string | null) {
  if (!paystackSecretKey || !signature) return false

  const expected = crypto
    .createHmac("sha512", paystackSecretKey)
    .update(rawBody)
    .digest("hex")

  const a = Buffer.from(expected)
  const b = Buffer.from(signature)

  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/** Booking-scoped, unique, and readable in the Paystack dashboard. */
export function buildReference(bookingId: string) {
  return `bk_${bookingId}_${Date.now()}`
}
