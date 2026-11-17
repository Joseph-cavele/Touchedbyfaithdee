import { z } from "zod"
import { customServiceInputSchema } from "@/features/services/schema"

/* A walk-in recorded from the dashboard: the client, and the visit. Shared
   by the dashboard form and POST /api/bookings/walk-in. */
export const walkInSchema = z.object({
  name: z.string().trim().min(2, "Enter the client's name"),
  phone: z
    .string()
    .trim()
    .max(20, "That phone number looks too long")
    .regex(/^[0-9+()\s-]*$/, "Use digits only for the phone number")
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email("Enter a valid email, or leave it blank").optional().or(z.literal("")),
  serviceIds: z.array(z.string().min(1)).default([]),
  customServices: z.array(customServiceInputSchema).max(10, "Add up to 10 custom services").optional().default([]),
  stylistId: z.string().min(1, "Choose who is doing the service"),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  bookingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a time"),
  /* COMPLETED = served and paid now; CONFIRMED = booked in for later. */
  status: z.enum(["COMPLETED", "CONFIRMED"]),
  notes: z.string().trim().max(500, "Keep notes under 500 characters").optional().or(z.literal("")),
}).refine(
  (value) => value.serviceIds.length > 0 || value.customServices.length > 0,
  { message: "Choose at least one service", path: ["serviceIds"] }
).refine(
  (value) => new Set(value.serviceIds).size === value.serviceIds.length,
  { message: "A service can only be selected once", path: ["serviceIds"] }
).refine(
  (value) => {
    const names = value.customServices.map((service) => service.name.toLocaleLowerCase())
    return new Set(names).size === names.length
  },
  { message: "Custom service names must be unique", path: ["customServices"] }
)

export type WalkInValues = z.infer<typeof walkInSchema>
