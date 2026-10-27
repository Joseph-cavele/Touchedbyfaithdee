import { Schema, model, models, type InferSchemaType } from "mongoose"

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    /* Optional: the owner signs in with an emailed one-time code, so new
       accounts have no password. Older accounts may still carry a hash. */
    password: { type: String, required: false },
    role: { type: String, enum: ["owner", "stylist"], required: true },
  },
  { timestamps: true }
)

export type UserDoc = InferSchemaType<typeof userSchema>
export const UserModel = models.User || model("User", userSchema)
