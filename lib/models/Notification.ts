import { Schema, model, models, type InferSchemaType } from "mongoose"

const notificationSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export type NotificationDoc = InferSchemaType<typeof notificationSchema>
export const NotificationModel =
  models.Notification || model("Notification", notificationSchema)
