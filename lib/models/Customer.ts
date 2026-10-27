import { Schema, model, models, type InferSchemaType } from "mongoose"

const customerSchema = new Schema(
  {
    name: { type: String, required: true },
    /* Optional: walk-in clients often give no email. Unique among the
       customers that have one — `sparse` leaves the rest out of the index,
       so any number of email-less walk-ins can coexist. */
    email: { type: String, unique: true, sparse: true },
    /** Optional: existing customers predate this field, and the booking form
        is the only thing that collects it. */
    phone: { type: String, default: "" },
    /** Unsubscribed from "we miss you" follow-ups via the link in that email.
        Appointment confirmations and reminders still go out. */
    marketingOptOut: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export type CustomerDoc = InferSchemaType<typeof customerSchema>
export const CustomerModel = models.Customer || model("Customer", customerSchema)
