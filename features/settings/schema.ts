import { z } from "zod"

export const settingsSchema = z.object({
  salonName: z.string().trim().min(1, "Salon name is required"),
  tagline: z.string().trim().max(120, "Keep the tagline under 120 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().min(1, "Phone is required"),
  address: z.string().trim().min(1, "Address is required"),
  openingHours: z.string().trim().min(1, "Opening hours are required"),
  notificationEmail: z.union([
    z.string().trim().email("Enter a valid email address"),
    z.literal(""),
  ]),
  emailNotifications: z.boolean(),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>
