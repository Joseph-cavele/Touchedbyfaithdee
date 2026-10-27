import { brandedEmail, EMAIL_COLORS } from "@/emails/layout"
import { escapeHtml } from "@/emails/escape-html"
import { SALON_NAME } from "@/lib/salon-contact"

interface WeMissYouEmailProps {
  customerName: string
  /** What they had done last time, e.g. ["Messy updo bun"]. */
  serviceNames: string[]
  bookUrl: string
  unsubscribeUrl: string
}

/** Sent two weeks after a completed visit if the client hasn't rebooked. */
export function weMissYouEmailHtml({ customerName, serviceNames, bookUrl, unsubscribeUrl }: WeMissYouEmailProps) {
  const c = EMAIL_COLORS
  const last = serviceNames.length ? ` for your ${escapeHtml(serviceNames.join(", "))}` : ""
  return brandedEmail(`
      <h2 style="margin-top: 0;">We miss you!</h2>
      <p>Hi ${escapeHtml(customerName)}, it's been two weeks since you visited us${last} — we miss you!</p>
      <p>Whenever you're ready for your next look, we'd love to have you back at ${SALON_NAME}. Your beauty is our priority.</p>
      <p style="margin: 24px 0; text-align: center;">
        <a href="${escapeHtml(bookUrl)}" style="display: inline-block; padding: 12px 28px; background: ${c.gold}; color: ${c.black}; border-radius: 999px; font-weight: bold; text-decoration: none;">Book your next visit</a>
      </p>
      <p style="color: ${c.muted}; font-size: 12px;">Don't want these reminders? <a href="${escapeHtml(unsubscribeUrl)}" style="color: ${c.muted};">Unsubscribe</a> — you'll still get your appointment confirmations.</p>
  `)
}
