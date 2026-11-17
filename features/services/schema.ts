import { z } from "zod"

/* Touchedbyfaithdee Studio's departments — the groups its price lists
   are split into (lib/salon-services.ts uses the same names).
   Renaming one is a data migration — existing Service documents store the
   category as a plain string, so change a name here and the services filed
   under the old one drop out of the booking wizard's tabs until they are
   re-filed. Add freely; rename deliberately. */
export const SERVICE_CATEGORIES = ["Makeup", "Hair", "Combos", "Nails", "Other"] as const
export const CUSTOM_SERVICE_CATEGORIES = ["Hair", "Makeup", "Nails", "Other"] as const

/**
 * What a service falls back to when its category is missing or unrecognised.
 * Imported everywhere that needs a default rather than being spelled out at
 * each call site — five copies of the string `"Hair"` is how the old list
 * outlived the redesign in the first place.
 */
export const DEFAULT_SERVICE_CATEGORY: (typeof SERVICE_CATEGORIES)[number] =
  "Makeup"

export const serviceInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100, "Name must be 100 characters or fewer"),
  description: z.string().trim().max(1000, "Description must be 1,000 characters or fewer").optional(),
  /* Optional — leave blank for "Price on request". A supplied value cannot
     be negative. */
  price: z.number().finite().min(0, "Price cannot be negative").optional(),
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

export const customServiceInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100, "Name must be 100 characters or fewer"),
  category: z.enum(CUSTOM_SERVICE_CATEGORIES),
  price: z.number().finite().min(0, "Price cannot be negative"),
  duration: z.number().int().positive("Duration must be greater than 0"),
  description: z.string().trim().max(1000, "Description must be 1,000 characters or fewer").optional(),
})

export type CustomServiceInputValues = z.infer<typeof customServiceInputSchema>

/** The category the dashboard's Combos page manages. */
export const COMBO_CATEGORY: (typeof SERVICE_CATEGORIES)[number] = "Combos"

export type ServiceInputValues = z.infer<typeof serviceInputSchema>
