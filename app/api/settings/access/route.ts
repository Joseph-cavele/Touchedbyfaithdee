import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { requireOwner } from "@/lib/auth-guard"
import {
  addDashboardUser,
  getDashboardUsers,
  getOwnerLoginEmail,
  isOwnerEmail,
  removeDashboardUser,
} from "@/features/auth/server/login-code"

/**
 * Settings → Dashboard access: who besides the owner may sign in.
 *
 *   GET                          → { ownerEmail, users, canManage }
 *   POST   { name, email }       → allow an email to sign in
 *   DELETE { email }             → take access away
 *
 * Anyone signed in may see the list; only the OWNER's own address may
 * change it, so an added person can't add others or remove the owner.
 * Errors carry a `message` written for the settings card to show as-is.
 */
export const dynamic = "force-dynamic"

const fail = (message: string, status: number) => NextResponse.json({ message }, { status })

async function callerIsOwner() {
  const session = await auth()
  return !!session?.user?.email && (await isOwnerEmail(session.user.email))
}

export async function GET() {
  const denied = await requireOwner()
  if (denied) return denied
  const [ownerEmail, users, canManage] = await Promise.all([
    getOwnerLoginEmail(),
    getDashboardUsers(),
    callerIsOwner(),
  ])
  return NextResponse.json({ ownerEmail, users, canManage })
}

const addSchema = z.object({
  name: z.string().trim().min(2, "Enter their name").max(60, "Keep the name under 60 characters"),
  email: z.string().trim().email("Enter a valid email address"),
})
const removeSchema = z.object({ email: z.string().trim().email("Enter a valid email address") })

export async function POST(req: Request) {
  const denied = await requireOwner()
  if (denied) return denied
  if (!(await callerIsOwner())) return fail("Only the salon owner can change who has access.", 403)

  const parsed = addSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the details and try again.", 400)

  const result = await addDashboardUser(parsed.data.name, parsed.data.email)
  if (result.ok) return NextResponse.json({ ok: true, users: await getDashboardUsers() })
  if (result.reason === "is_owner") return fail("That's the owner's own email — it always has access.", 400)
  return fail("That email already has access.", 409)
}

export async function DELETE(req: Request) {
  const denied = await requireOwner()
  if (denied) return denied
  if (!(await callerIsOwner())) return fail("Only the salon owner can change who has access.", 403)

  const parsed = removeSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the details and try again.", 400)

  const result = await removeDashboardUser(parsed.data.email)
  if (result.ok) return NextResponse.json({ ok: true, users: await getDashboardUsers() })
  if (result.reason === "is_owner") return fail("The owner's access can't be removed.", 400)
  return fail("That email isn't on the access list.", 404)
}
