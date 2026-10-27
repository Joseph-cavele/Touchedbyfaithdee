import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { NotificationModel } from "@/lib/models/Notification"
import { requireOwner } from "@/lib/auth-guard"

export async function POST() {
  const denied = await requireOwner()
  if (denied) return denied

  await connectDB()
  await NotificationModel.updateMany({ read: false }, { read: true })
  return NextResponse.json({ ok: true })
}
