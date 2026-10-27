import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"

import { sendDueFollowUps, sendDueReminders } from "@/features/notifications/server/scheduled-emails"

/**
 * GET /api/cron/emails — sends what's due: 2-hour appointment reminders and
 * "we miss you" follow-ups (features/notifications/server/scheduled-emails.ts).
 *
 * Call it every 15 minutes with the header
 *   Authorization: Bearer <CRON_SECRET>
 * Vercel Cron sends that header itself when CRON_SECRET is set; an external
 * scheduler (e.g. cron-job.org) needs it added. Without the secret: 401.
 */
export const dynamic = "force-dynamic"

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const given = Buffer.from(req.headers.get("authorization") ?? "")
  const expected = Buffer.from(`Bearer ${secret}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const [reminders, followUps] = await Promise.all([sendDueReminders(now), sendDueFollowUps(now)])
  console.log(`📬 Scheduled emails — reminders: ${JSON.stringify(reminders)}, follow-ups: ${JSON.stringify(followUps)}`)
  return NextResponse.json({ ranAt: now.toISOString(), reminders, followUps })
}
