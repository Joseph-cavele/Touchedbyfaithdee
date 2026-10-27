import { z } from "zod"

/**
 * Paystack checkout. Off for now: the salon takes payment in person (with a
 * deposit arranged directly), so there is no online amount to charge. The
 * wizard hides "Pay now" and POST /api/bookings refuses ONLINE while false.
 * The Paystack code is untouched — flip this once the salon has its own keys.
 */
export const ONLINE_PAYMENTS_ENABLED = false

export const createBookingSchema = z.object({
  customerName: z.string().trim().min(2, "Full name is required"),
  customerEmail: z.string().trim().email("Enter a valid email address"),
  /* Required now that a booking can be paid online — if a payment half-lands
     or a slot has to move, email alone is a slow way to reach someone on the
     day. Digits, spaces, brackets, dashes and an optional leading "+". */
  customerPhone: z
    .string()
    .trim()
    .min(6, "Phone number is required")
    .max(24, "That phone number is too long")
    .regex(/^\+?[\d\s()-]{6,}$/, "Enter a valid phone number"),
  /** Which button the customer pressed on the review step. */
  paymentMethod: z.enum(["ONLINE", "IN_PERSON"]),
  serviceIds: z.array(z.string()).min(1, "Select at least one service"),
  stylistId: z.string().min(1, "Select a stylist"),
  bookingDate: z.string().min(1, "Select a date"),
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
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
  reason: z.string().trim().optional(),
})

export type UpdateBookingStatusValues = z.infer<typeof updateBookingStatusSchema>
