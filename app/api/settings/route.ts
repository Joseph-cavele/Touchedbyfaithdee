import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { SettingsModel } from "@/lib/models/Settings"
import { settingsSchema } from "@/features/settings/schema"
import {
  getSettings,
  serializeSettings,
} from "@/features/settings/server/get-settings"
import { requireOwner } from "@/lib/auth-guard"

interface SettingsDoc {
  salonName: string
  tagline: string
  email: string
  phone: string
  address: string
  openingHours: string
  notificationEmail: string
  emailNotifications: boolean
}

export async function GET() {
  const denied = await requireOwner()
  if (denied) return denied

  const settings = await getSettings()

  if (!settings) {
    return NextResponse.json({ error: "Settings unavailable" }, { status: 500 })
  }

  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  const denied = await requireOwner()
  if (denied) return denied

  const body = await req.json()
  const parsed = settingsSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid settings", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  await connectDB()
  const settings = await SettingsModel.findOneAndUpdate(
    { key: "salon" },
    { ...parsed.data, key: "salon" },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  ).lean<SettingsDoc>()

  if (!settings) {
    return NextResponse.json({ error: "Settings unavailable" }, { status: 500 })
  }

  return NextResponse.json(serializeSettings(settings))
}
