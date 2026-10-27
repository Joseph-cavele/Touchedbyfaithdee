import { brandedEmail } from "@/emails/layout"
import { escapeHtml } from "@/emails/escape-html"

interface ContactMessageReceivedEmailProps {
  name: string
  message: string
}

/** Sent to the visitor, so they know their enquiry reached the salon. */
export function contactMessageReceivedEmailHtml({ name, message }: ContactMessageReceivedEmailProps) {
  return brandedEmail(`
      <h2 style="margin-top: 0;">We received your message</h2>
      <p>Hi ${escapeHtml(name)}, thank you for contacting Touchedbyfaithdee Studio. We have your message and will get back to you as soon as we can.</p>
      <p style="color: #666; margin-bottom: 4px;">Your message</p>
      <p style="white-space: pre-wrap; padding: 12px; background: #f5f5f5; border-radius: 8px;">${escapeHtml(message)}</p>
      <p>Need an answer sooner? Call or WhatsApp us on the number below, or reply to this email.</p>
  `)
}
