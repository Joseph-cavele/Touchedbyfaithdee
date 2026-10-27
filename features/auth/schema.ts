import { z } from "zod"

/* Passwordless sign-in: step 1 asks for the email, step 2 for the code that
   was emailed to it (features/auth/server/login-code.ts). */

export const loginEmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
})

export const loginCodeSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
})

export type LoginEmailValues = z.infer<typeof loginEmailSchema>
export type LoginCodeValues = z.infer<typeof loginCodeSchema>
