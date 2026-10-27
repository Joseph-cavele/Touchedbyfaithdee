import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { NotificationModel } from "@/lib/models/Notification"
import { requireOwner } from "@/lib/auth-guard"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireOwner()
  if (denied) return denied

  const { id } = await params
  await connectDB()

  const notification = await NotificationModel.findByIdAndUpdate(
    id,
    { read: true },
    { returnDocument: "after" }
  ).lean()

  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 })
  }

  return NextResponse.json({ id: String(notification._id), read: notification.read })
}
