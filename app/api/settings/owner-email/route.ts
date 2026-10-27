import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { requireOwner } from "@/lib/auth-guard"
import {
  confirmEmailChange,
  getOwnerLoginEmail,
  isOwnerEmail,
  requestEmailChangeCode,
} from "@/features/auth/server/login-code"

/**
 * The dashboard sign-in address (Settings → Sign-in email). Owner only.
 *
 *   GET                                   → { email } the current address
 *   POST { action: "request", email }     → emails a code to the NEW address
 *   POST { action: "confirm", email, code } → switches to it once the code checks out
 *
 * Errors carry a `message` written for the settings card to show as-is.
 */
export async function GET() {
  const denied = await requireOwner()
  if (denied) return denied
  return NextResponse.json({ email: await getOwnerLoginEmail() })
}

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("request"),
    email: z.string().trim().email("Enter a valid email address"),
  }),
  z.object({
    action: z.literal("confirm"),
    email: z.string().trim().email("Enter a valid email address"),
    code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
  }),
])

const fail = (message: string, status: number, extra?: object) =>
  NextResponse.json({ message, ...extra }, { status })

export async function POST(req: Request) {
  const denied = await requireOwner()
  if (denied) return denied
  // Only the owner changes the owner's sign-in email — not someone added
  // under Dashboard access.
  const session = await auth()
  if (!session?.user?.email || !(await isOwnerEmail(session.user.email))) {
    return NextResponse.json({ message: "Only the salon owner can change the sign-in email." }, { status: 403 })
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return fail(parsed.error.issues.at(-1)?.message ?? "Please check the details and try again.", 400)
  }

  if (parsed.data.action === "request") {
    const result = await requestEmailChangeCode(parsed.data.email)
    if (result.ok) return NextResponse.json({ ok: true })
    switch (result.reason) {
      case "same_email":
        return fail("That's already your sign-in email.", 400)
      case "in_use":
        return fail("That email is already used by another account. Choose a different one.", 409)
      case "cooldown":
        return fail(
          `A code was just sent. You can request another in ${result.retryAfterSeconds} seconds.`,
          429,
          { retryAfterSeconds: result.retryAfterSeconds }
        )
      case "send_failed":
        return fail(
          "We couldn't send a code to that address, so your sign-in email hasn't changed. Check the address, or try again in a moment.",
          502
        )
    }
  }

  const result = await confirmEmailChange(parsed.data.email, parsed.data.code)
  if (result.ok) return NextResponse.json({ ok: true, email: parsed.data.email.toLowerCase() })
  switch (result.reason) {
    case "invalid":
      return fail(
        `That code isn't right. You have ${result.attemptsLeft} ${result.attemptsLeft === 1 ? "try" : "tries"} left.`,
        400
      )
    case "expired":
      return fail("That code has expired. Send a new code and try again.", 400)
    case "too_many_attempts":
      return fail("Too many wrong tries — that code no longer works. Send a new code.", 400)
    case "in_use":
      return fail("That email is already used by another account. Choose a different one.", 409)
  }
}
