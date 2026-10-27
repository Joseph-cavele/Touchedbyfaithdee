import { z } from "zod"

export const stylistInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  /* Both optional — a stylist can be added before their details are
     known. A blank email is stored as no email (see stylistWriteData). */
  email: z.string().trim().email("Enter a valid email address, or leave it blank").or(z.literal("")),
  phone: z.string().trim(),
  bio: z.string().trim().optional(),
  /* Same omission as the service schema had: the Stylist model carries
     `image`, but the routes persist `parsed.data`, so a portrait could not
     be saved until it was declared here. `""` clears it. */
  image: z.string().trim().url("Enter a valid image URL").or(z.literal("")).optional(),
  workingHours: z.string().trim().optional(),
  active: z.boolean(),
  services: z.array(z.string()),
})

export type StylistInputValues = z.infer<typeof stylistInputSchema>

/**
 * The validated form → what to write. A blank email is left out (create) or
 * removed (update): storing "" would make two email-less stylists clash on
 * the unique email index.
 */
export function stylistWriteData(values: StylistInputValues) {
  const { email, ...rest } = values
  return email ? { $set: { ...rest, email } } : { $set: rest, $unset: { email: 1 } }
}
