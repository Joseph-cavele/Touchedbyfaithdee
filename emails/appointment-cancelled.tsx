import { brandedEmail, emailRow } from "@/emails/layout"
import { escapeHtml } from "@/emails/escape-html"

interface AppointmentCancelledEmailProps {
  customerName: string
  stylistName: string
  serviceNames: string[]
  bookingDate: string
  bookingTime: string
  reason?: string
}

export function appointmentCancelledEmailHtml({
  customerName,
  stylistName,
  serviceNames,
  bookingDate,
  bookingTime,
  reason,
}: AppointmentCancelledEmailProps) {
  return brandedEmail(`
      <h2 style="margin-top: 0;">Your appointment has been cancelled</h2>
      <p>Hi ${escapeHtml(customerName)}, your appointment at Touchedbyfaithdee Studio has been cancelled. Here were the details:</p>
      <table style="width: 100%; border-collapse: collapse;">
        ${emailRow("Services", escapeHtml(serviceNames.join(", ")))}
        ${emailRow("Stylist", escapeHtml(stylistName))}
        ${emailRow("Date", escapeHtml(bookingDate))}
        ${emailRow("Time", escapeHtml(bookingTime))}
      </table>
      ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
      <p>To book a new appointment, reply to this email, WhatsApp us, or book online.</p>
  `)
}
