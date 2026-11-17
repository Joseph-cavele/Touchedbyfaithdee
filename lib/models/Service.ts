import { Schema, model, models, type InferSchemaType } from "mongoose"
import { SALON_ID } from "@/lib/salon-identity"

const serviceSchema = new Schema(
  {
    salonId: { type: String, required: true, default: SALON_ID },
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, trim: true },
    description: { type: String, default: "" },
    /* Optional: a service without a confirmed price shows "Price on
       request" everywhere (lib/currency.ts formatPrice) and adds nothing to
       a booking's amount. Never store 0 to mean "unknown". */
    price: { type: Number, min: 0 },
    duration: { type: Number, required: true },
    category: { type: String, default: "Makeup" },
    isActive: { type: Boolean, default: true },
    image: { type: String },
    /* What a combo bundles, one line per item — the poster's checklist
       ("28" Human Blend Wig", "Wig Installation", …). Empty for ordinary
       services. */
    includes: { type: [String], default: undefined },
    /* Stable key for scripts/seed.ts, which upserts on { category, slug } so
       re-running it never duplicates a service. Optional: services created
       in the dashboard don't need one. */
    slug: { type: String },
  },
  { timestamps: true }
)

/* ── Indexes ──────────────────────────────────────────────────────────
   The collection had none, so every service read was a collection scan
   followed by an in-memory sort — including the one on the booking
   wizard's service picker, which runs on every visit to /book. */

// getServices() — find().sort({ name: 1 }). Lets the sort be served by the
// index walk instead of a SORT stage.
serviceSchema.index({ name: 1 })

serviceSchema.index(
  { salonId: 1, normalizedName: 1 },
  { unique: true, partialFilterExpression: { normalizedName: { $type: "string" } } }
)

// Catalogue and picker, which group by category and order by name within
// it. `name` as the second key means the grouped read is sorted for free.
serviceSchema.index({ salonId: 1, category: 1, name: 1 })

// The seed's upsert key. Partial, so dashboard-created services (no slug)
// are not forced to be unique against each other.
serviceSchema.index(
  { category: 1, slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $type: "string" } } }
)

export type ServiceDoc = InferSchemaType<typeof serviceSchema>
export const ServiceModel = models.Service || model("Service", serviceSchema)
