import { z } from "zod"

/* Touchedbyfaithdee Studio's departments — the groups its price lists
   are split into (lib/salon-services.ts uses the same names).
   Renaming one is a data migration — existing Service documents store the
   category as a plain string, so change a name here and the services filed
   under the old one drop out of the booking wizard's tabs until they are
   re-filed. Add freely; rename deliberately. */
export const SERVICE_CATEGORIES = ["Makeup", "Hair", "Combos"] as const

/**
 * What a service falls back to when its category is missing or unrecognised.
 * Imported everywhere that needs a default rather than being spelled out at
 * each call site — five copies of the string `"Hair"` is how the old list
 * outlived the redesign in the first place.
 */
export const DEFAULT_SERVICE_CATEGORY: (typeof SERVICE_CATEGORIES)[number] =
  "Makeup"

export const serviceInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
  /* Optional — leave blank for "Price on request". When given it must be a
     real price, so 0 can never be saved to mean "unknown". */
  price: z.number().positive("Price must be greater than 0").optional(),
  duration: z.number().int().positive("Duration must be greater than 0"),
  category: z.enum(SERVICE_CATEGORIES),
  /* The Service model has always had an `image` field, but it was absent
     here — and since both API routes persist `parsed.data`, anything not in
     this schema was silently dropped on the way to the database. A photo
     could not be saved at all until this line existed.

     `""` is allowed alongside a URL so the field can be cleared: an empty
     string round-trips to the model as "no image", where `undefined` would
     leave the previous URL in place on an update. */
  image: z.string().trim().url("Enter a valid image URL").or(z.literal("")).optional(),
  /* A combo's checklist. Blank lines from the dashboard's one-per-line
     textarea are dropped here, so they never reach the database. */
  includes: z
    .array(z.string().trim())
    .transform((items) => items.filter(Boolean))
    .refine((items) => items.length <= 12, "Up to 12 items")
    .optional(),
})

/** The category the dashboard's Combos page manages. */
export const COMBO_CATEGORY: (typeof SERVICE_CATEGORIES)[number] = "Combos"

export type ServiceInputValues = z.infer<typeof serviceInputSchema>
