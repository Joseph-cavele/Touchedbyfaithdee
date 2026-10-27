import { Schema, model, models, type InferSchemaType } from "mongoose"

/* Messages from the public contact form. Stored as well as emailed: the
   email is best-effort (Resend can reject it, and in development its sandbox
   rejects every address but the account owner's), so the database is what
   guarantees a visitor's message isn't lost. */
const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    /** Dial code + national number, or "" when the visitor skipped it. */
    phone: { type: String, default: "" },
    message: { type: String, required: true, trim: true },
    /** Consent to be replied to is required to submit; marketing is opt-in. */
    marketingOptIn: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export type ContactMessageDoc = InferSchemaType<typeof contactMessageSchema>
export const ContactMessageModel =
  models.ContactMessage || model("ContactMessage", contactMessageSchema)
