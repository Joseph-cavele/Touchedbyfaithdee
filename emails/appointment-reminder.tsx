import { brandedEmail, emailRow } from "@/emails/layout"
import { escapeHtml } from "@/emails/escape-html"
import { SALON_ADDRESS, SALON_NAME } from "@/lib/salon-contact"

interface AppointmentReminderEmailProps {
  customerName: string
  bookingTime: string
  serviceNames: string[]
  stylistName: string
}

/** Sent about 2 hours before the appointment (scheduled-emails.ts). */
export function appointmentReminderEmailHtml({
  customerName,
  bookingTime,
  serviceNames,
  stylistName,
}: AppointmentReminderEmailProps) {
  return brandedEmail(`
      <h2 style="margin-top: 0;">See you soon!</h2>
      <p>Hi ${escapeHtml(customerName)}, your appointment at ${SALON_NAME} is in 2 hours, at ${escapeHtml(bookingTime)}. We look forward to seeing you!</p>
      <table style="width: 100%; border-collapse: collapse;">
        ${emailRow("Time", escapeHtml(bookingTime))}
        ${emailRow("Services", escapeHtml(serviceNames.join(", ")))}
        ${emailRow("Stylist", escapeHtml(stylistName))}
        ${emailRow("Where", escapeHtml(SALON_ADDRESS))}
      </table>
      <p>Running late or can't make it? Please call or WhatsApp us using the details below.</p>
  `)
}
