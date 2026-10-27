import { Resend } from "resend"
import { SALON_EMAIL, SALON_NAME } from "@/lib/salon-contact"

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

/**
 * Sender for every email, shown as "Touchedbyfaithdee Studio <address>".
 *
 * RESEND_FROM_EMAIL must be on a domain verified in Resend — a Gmail address
 * cannot be a Resend sender. `onboarding@resend.dev` works for testing but
 * only delivers to the Resend account's own address. A value that already
 * has a display name ("Name <addr>") is used as-is.
 */
export function emailFrom() {
  const address = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev"
  return address.includes("<") ? address : `${SALON_NAME} <${address}>`
}

/** Where customer replies go — the salon's own inbox, not the sending domain. */
export const EMAIL_REPLY_TO = SALON_EMAIL
