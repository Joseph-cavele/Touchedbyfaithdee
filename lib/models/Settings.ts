import { Schema, model, models, type InferSchemaType } from "mongoose"

const settingsSchema = new Schema(
  {
    // Singleton key so there is only ever one settings document.
    key: { type: String, default: "salon", unique: true },
    salonName: { type: String, default: "Touchedbyfaithdee Studio" },
    tagline: { type: String, default: "Your Beauty Is Our Priority" },
    /* Defaults are the salon's real details, not samples. Kept in step with
       lib/salon-contact.ts by hand — this model cannot import it, since the
       seed and the API both load the schema outside the app's module graph. */
    email: { type: String, default: "faithdiale4@gmail.com" },
    phone: { type: String, default: "073 979 0375" },
    address: { type: String, default: "2389 Rangaka Street, Tlhabane, 0309" },
    openingHours: { type: String, default: "Monday – Sunday, 08:30 – 18:00" },
    notificationEmail: { type: String, default: "" },
    emailNotifications: { type: Boolean, default: true },
    /* The ONE address that can sign in to the dashboard (by emailed code).
       Empty = OWNER_EMAIL from .env (lib/owner-account.ts). Changed only
       through Settings → Sign-in email, which confirms the new address with
       a code first (features/auth/server/login-code.ts). */
    ownerLoginEmail: { type: String, default: "" },
    /* Everyone else the owner has allowed to sign in to the dashboard
       (Settings → Dashboard access). Emails are stored lower-case. */
    dashboardUsers: {
      type: [
        {
          _id: false,
          name: { type: String, required: true },
          email: { type: String, required: true },
          addedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
)

export type SettingsDoc = InferSchemaType<typeof settingsSchema>
export const SettingsModel = models.Settings || model("Settings", settingsSchema)
