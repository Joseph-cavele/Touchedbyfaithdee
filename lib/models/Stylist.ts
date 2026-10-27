import { Schema, model, models, type InferSchemaType } from "mongoose"

const stylistSchema = new Schema(
  {
    name: { type: String, required: true },
    /* Optional: not every stylist has an email. Unique among the stylists
       that do — `sparse` leaves the rest out of the index. */
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, default: "" },
    bio: { type: String },
    image: { type: String },
    workingHours: { type: String },
    active: { type: Boolean, default: true },
    services: [{ type: Schema.Types.ObjectId, ref: "Service" }],
  },
  { timestamps: true }
)

export type StylistDoc = InferSchemaType<typeof stylistSchema>
export const StylistModel = models.Stylist || model("Stylist", stylistSchema)
