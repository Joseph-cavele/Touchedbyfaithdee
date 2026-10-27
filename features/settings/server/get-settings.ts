import { connectDB } from "@/lib/db"
import { SettingsModel } from "@/lib/models/Settings"
import type { SalonSettings } from "@/types"

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

export function serializeSettings(doc: SettingsDoc): SalonSettings {
  return {
    salonName: doc.salonName,
    tagline: doc.tagline,
    email: doc.email,
    phone: doc.phone,
    address: doc.address,
    openingHours: doc.openingHours,
    notificationEmail: doc.notificationEmail ?? "",
    emailNotifications: doc.emailNotifications,
  }
}

export async function getSettings(): Promise<SalonSettings | null> {
  await connectDB()
  // Create the singleton with defaults on first read.
  const settings = await SettingsModel.findOneAndUpdate(
    { key: "salon" },
    { $setOnInsert: { key: "salon" } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  ).lean<SettingsDoc>()

  return settings ? serializeSettings(settings) : null
}
