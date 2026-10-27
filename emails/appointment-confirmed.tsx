import { brandedEmail, emailRow } from "@/emails/layout"
import { escapeHtml } from "@/emails/escape-html"

interface AppointmentConfirmedEmailProps {
  customerName: string
  stylistName: string
  serviceNames: string[]
  bookingDate: string
  bookingTime: string
  /** Total as shown to the customer, e.g. "R 270" or "Price on request". */
  totalDisplay?: string
}

export function appointmentConfirmedEmailHtml({
  customerName,
  stylistName,
  serviceNames,
  bookingDate,
  bookingTime,
  totalDisplay,
}: AppointmentConfirmedEmailProps) {
  return brandedEmail(`
      <h2 style="margin-top: 0;">Your appointment is confirmed</h2>
      <p>Hi ${escapeHtml(customerName)}, your booking at Touchedbyfaithdee Studio is confirmed. Here are the details:</p>
      <table style="width: 100%; border-collapse: collapse;">
        ${emailRow("Services", escapeHtml(serviceNames.join(", ")))}
        ${emailRow("Stylist", escapeHtml(stylistName))}
        ${emailRow("Date", escapeHtml(bookingDate))}
        ${emailRow("Time", escapeHtml(bookingTime))}
        ${totalDisplay ? emailRow("Price", escapeHtml(totalDisplay)) : ""}
      </table>
      ${
        totalDisplay && /request/i.test(totalDisplay)
          ? "<p>Some of your services are priced on request — we will confirm the price with you before we start.</p>"
          : ""
      }
      <p>Payment is in person at the salon. Need to change or cancel? Reply to this email or WhatsApp us.</p>
      <p>We look forward to seeing you!</p>
  `)
}
