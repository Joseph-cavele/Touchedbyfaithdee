import { NextResponse } from "next/server"

import { loginEmailSchema } from "@/features/auth/schema"
import { requestLoginCode } from "@/features/auth/server/login-code"

/**
 * POST /api/login-code — step 1 of dashboard sign-in: email a one-time code.
 *
 * Errors carry a `message` written for the sign-in card to show as-is.
 * Saying plainly that an email has no access is deliberate: the dashboard
 * has exactly one owner, and a silent "check your inbox" would leave them
 * waiting for a code that is never coming after a typo.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = loginEmailSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Enter a valid email address" },
      { status: 400 }
    )
  }

  const result = await requestLoginCode(parsed.data.email)
  if (result.ok) return NextResponse.json({ ok: true })

  switch (result.reason) {
    case "not_owner":
      return NextResponse.json(
        { message: "This email doesn't have access to the dashboard. Check the address and try again." },
        { status: 403 }
      )
    case "cooldown":
      return NextResponse.json(
        {
          message: `A code was just sent. You can request another in ${result.retryAfterSeconds} seconds.`,
          retryAfterSeconds: result.retryAfterSeconds,
        },
        { status: 429 }
      )
    case "send_failed":
      return NextResponse.json(
        { message: "We couldn't send the code just now. Please try again in a moment." },
        { status: 502 }
      )
  }
}
