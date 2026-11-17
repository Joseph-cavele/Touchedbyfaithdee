import { z } from "zod"
import { customServiceInputSchema } from "@/features/services/schema"

const bookingDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  }, "Choose a valid date")

const serviceIdsSchema = z
  .array(z.string().regex(/^[a-f\d]{24}$/i, "Choose a valid service"))
  .min(1, "Select at least one service")
  .refine((ids) => new Set(ids).size === ids.length, "A service can only be selected once")

/**
 * Online payments are disabled; all customer bookings are submitted for
 * in-person payment and remain pending owner approval.
 */
export const ONLINE_PAYMENTS_ENABLED = false

export const createBookingSchema = z.object({
  customerName: z.string().trim().min(2, "Full name is required"),
  customerEmail: z.string().trim().email("Enter a valid email address"),
  /* The salon needs a way to reach the client about their request. Digits,
     spaces, brackets, dashes and an optional leading "+". */
  customerPhone: z
    .string()
    .trim()
    .min(6, "Phone number is required")
    .max(24, "That phone number is too long")
    .regex(/^\+?[\d\s()-]{6,}$/, "Enter a valid phone number"),
  paymentMethod: z.literal("IN_PERSON"),
  serviceIds: serviceIdsSchema,
  stylistId: z.string().min(1, "Select a stylist"),
  bookingDate: bookingDateSchema,
  bookingTime: z.string().min(1, "Select a time"),
  description: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  imageUrls: z
    .array(z.string())
    .max(5, "You can upload up to 5 images")
    .optional(),
})

export type CreateBookingFormValues = z.infer<typeof createBookingSchema>

export const updateBookingStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  reason: z.string().trim().optional(),
  bookingDate: bookingDateSchema.optional(),
  bookingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  serviceIds: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, "Choose a valid service"))
    .refine((ids) => new Set(ids).size === ids.length, "A service can only be selected once")
    .optional(),
  customServices: z.array(customServiceInputSchema).max(10).optional(),
}).refine(
  (value) =>
    value.status ||
    (value.bookingDate && value.bookingTime) ||
    value.serviceIds !== undefined ||
    value.customServices !== undefined,
  { message: "Choose a status, update services, or provide a new appointment date and time." }
).refine(
  (value) => (value.bookingDate === undefined) === (value.bookingTime === undefined),
  { message: "A new appointment date and time must be provided together." }
).refine(
  (value) => value.serviceIds === undefined || new Set(value.serviceIds).size === value.serviceIds.length,
  { message: "A service can only be selected once.", path: ["serviceIds"] }
).refine(
  (value) =>
    (value.serviceIds === undefined && value.customServices === undefined) ||
    (value.serviceIds?.length ?? 0) + (value.customServices?.length ?? 0) > 0,
  { message: "Choose at least one service.", path: ["serviceIds"] }
).refine(
  (value) => {
    const names = (value.customServices ?? []).map((service) => service.name.toLocaleLowerCase())
    return new Set(names).size === names.length
  },
  { message: "Custom service names must be unique.", path: ["customServices"] }
)

export type UpdateBookingStatusValues = z.infer<typeof updateBookingStatusSchema>
