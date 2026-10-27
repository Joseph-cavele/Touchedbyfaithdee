import { NextResponse } from "next/server"
import { z } from "zod"

import { requireOwner } from "@/lib/auth-guard"
import { connectDB } from "@/lib/db"
import { UserModel } from "@/lib/models/User"
import { auth } from "@/auth"
import { normalizeEmail } from "@/features/auth/server/login-code"

/**
 * PATCH /api/settings/owner { name } — rename the owner (Settings → Account).
 * The sign-in email is changed separately, via /api/settings/owner-email,
 * because that one has to be confirmed with a code.
 */
const bodySchema = z.object({
  name: z.string().trim().min(2, "Enter your name (at least 2 letters)").max(60, "Keep the name under 60 characters"),
})

export async function PATCH(req: Request) {
  const denied = await requireOwner()
  if (denied) return denied

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Enter your name." },
      { status: 400 }
    )
  }

  await connectDB()
  const updated = await UserModel.findOneAndUpdate(
    // The signed-in person's own account — the owner, or someone the owner
    // added under Dashboard access — never someone else's.
    { email: normalizeEmail((await auth())?.user?.email ?? ""), role: "owner" },
    { $set: { name: parsed.data.name } },
    { returnDocument: "after" }
  )
  if (!updated) {
    return NextResponse.json({ message: "Couldn't find your account. Sign out and back in, then try again." }, { status: 404 })
  }
  return NextResponse.json({ name: updated.name })
}
