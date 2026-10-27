import { brandedEmail } from "@/emails/layout"
import { escapeHtml } from "@/emails/escape-html"

interface ContactMessageOwnerEmailProps {
  name: string
  email: string
  phone?: string
  message: string
  marketingOptIn: boolean
}

export function contactMessageOwnerEmailHtml({
  name,
  email,
  phone,
  message,
  marketingOptIn,
}: ContactMessageOwnerEmailProps) {
  return brandedEmail(`
      <h2 style="margin-top: 0;">New Message from the Website</h2>
      <p>Someone sent a message through the contact form.</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 4px 0; color: #666;">Name</td><td>${escapeHtml(name)}</td></tr>
        <tr><td style="padding: 4px 0; color: #666;">Email</td><td>${escapeHtml(email)}</td></tr>
        <tr><td style="padding: 4px 0; color: #666;">Phone</td><td>${phone ? escapeHtml(phone) : "Not given"}</td></tr>
        <tr><td style="padding: 4px 0; color: #666;">Marketing</td><td>${marketingOptIn ? "Opted in" : "Did not opt in"}</td></tr>
      </table>
      <p style="color: #666; margin-bottom: 4px;">Message</p>
      <!-- white-space: pre-wrap keeps the sender's own line breaks, which
           escapeHtml would otherwise leave to collapse into one paragraph. -->
      <p style="white-space: pre-wrap; padding: 12px; background: #f5f5f5; border-radius: 8px;">${escapeHtml(message)}</p>
      <p>Reply straight to this email to answer ${escapeHtml(name)}.</p>
  `)
}
