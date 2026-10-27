import { Schema, model, models, type InferSchemaType } from "mongoose"

const bookingSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    stylist: { type: Schema.Types.ObjectId, ref: "Stylist", required: true },
    services: [{ type: Schema.Types.ObjectId, ref: "Service", required: true }],
    bookingDate: { type: String, required: true },
    bookingTime: { type: String, required: true },
    description: { type: String },
    notes: { type: String },
    /** How the booking came in: the public booking page, or recorded by the
        owner on the dashboard for a client who walked in. */
    source: { type: String, enum: ["ONLINE", "WALK_IN"], default: "ONLINE" },
    status: {
      type: String,
      enum: [
        // Online payment started but not yet settled. The slot is held, but
        // nothing is confirmed until Paystack says the money arrived.
        "PENDING_PAYMENT",
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
        "COMPLETED",
        "NO_SHOW",
      ],
      default: "PENDING",
    },

    /* ── Payment ────────────────────────────────────────────────────────
       `amount` is a SNAPSHOT of what the services cost when the booking was
       made, in Rand. It is not derived from the Service documents at read
       time on purpose: prices change, and a booking has to keep charging —
       and keep showing — the figure the customer actually agreed to.

       It is also what the Paystack charge is verified against, so it must
       be computed server-side from the service IDs and never accepted from
       the request body. A client that can name its own price will. */
    amount: { type: Number, required: true, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["ONLINE", "IN_PERSON"],
      default: "IN_PERSON",
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "FAILED"],
      default: "UNPAID",
    },
    /** Paystack transaction reference. Unique, but sparse — in-person
        bookings never get one, and a non-sparse unique index would reject
        every booking after the first with a null reference. */
    paymentReference: { type: String, index: true, sparse: true, unique: true },
    paidAt: { type: Date },

    /* Scheduled emails (features/notifications/server/scheduled-emails.ts).
       Each is set when that email is sent, so it goes out once only. */
    /** "Your appointment is in 2 hours" reminder. */
    reminderSentAt: { type: Date },
    /** "We miss you" follow-up, two weeks after this (completed) visit. */
    followUpSentAt: { type: Date },
  },
  { timestamps: true }
)

/* ── Indexes ──────────────────────────────────────────────────────────
   Each one is shaped to a query that actually runs, and the sort
   directions match the callers exactly. That matters: an index whose
   direction disagrees with the sort can still be walked backwards, but
   only if every sort key is in the index — otherwise Mongo falls back to
   an in-memory SORT stage, which is the slow part these are meant to
   remove. */

// getBookings(status) — features/bookings/server/get-bookings.ts.
// Equality on status, then the exact two-key sort. Supersedes the old
// { status: 1, bookingDate: 1 }, which stopped short of bookingTime and so
// left the tiebreak to an in-memory sort.
bookingSchema.index({ status: 1, bookingDate: -1, bookingTime: -1 })

// getBookings() with no status filter — same sort, no leading predicate.
bookingSchema.index({ bookingDate: -1, bookingTime: -1 })

// Dashboard feed: find().sort({ createdAt: -1 }).
bookingSchema.index({ createdAt: -1 })

// Per-customer history lookups.
bookingSchema.index({ customer: 1 })

// A stylist's day — slot availability and the stylist schedule view.
bookingSchema.index({ stylist: 1, bookingDate: 1, bookingTime: 1 })

export type BookingDoc = InferSchemaType<typeof bookingSchema>
export const BookingModel = models.Booking || model("Booking", bookingSchema)
