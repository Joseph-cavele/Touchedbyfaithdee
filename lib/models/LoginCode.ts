import { Schema, model, models, type InferSchemaType } from "mongoose"

/* One-time dashboard sign-in codes (features/auth/server/login-code.ts).
   Only a keyed hash of the code is stored, never the code itself. MongoDB's
   TTL monitor deletes each document once `expiresAt` passes, so expired
   codes don't pile up; the verifier also checks the time itself, because
   the monitor only runs about once a minute. */
const loginCodeSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    /** "login" signs the owner in; "change-email" confirms a new sign-in
        address. A code only ever works for the purpose it was sent for. */
    purpose: { type: String, enum: ["login", "change-email"], default: "login" },
    codeHash: { type: String, required: true },
    /** Wrong guesses so far — the code is burned after MAX_ATTEMPTS. */
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
)

export type LoginCodeDoc = InferSchemaType<typeof loginCodeSchema>
export const LoginCodeModel = models.LoginCode || model("LoginCode", loginCodeSchema)
