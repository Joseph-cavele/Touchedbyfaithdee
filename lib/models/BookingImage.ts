import { Schema, model, models, type InferSchemaType } from "mongoose"

const bookingImageSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
)

export type BookingImageDoc = InferSchemaType<typeof bookingImageSchema>
export const BookingImageModel =
  models.BookingImage || model("BookingImage", bookingImageSchema)
