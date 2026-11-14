import { brandedEmail, emailRow } from "@/emails/layout"
import { escapeHtml } from "@/emails/escape-html"
import { SALON_NAME } from "@/lib/salon-contact"

interface BookingReminderDetails {
  customerName: string
  serviceNames: string[]
  bookingDate: string
  bookingTime: string
}

export function bookingRequestReceivedEmailHtml({
  customerName,
  serviceNames,
  bookingDate,
  bookingTime,
  paymentReceived = false,
}: BookingReminderDetails & { paymentReceived?: boolean }) {
  return brandedEmail(`
    <h2 style="margin-top: 0;">Booking request received</h2>
    <p>Hello ${escapeHtml(customerName)}, ${
      paymentReceived
        ? "your payment has been received and your appointment request is waiting for the salon to review it."
        : "your appointment request has been received and is waiting for the salon to review it."
    }</p>
    <table style="width: 100%; border-collapse: collapse;">
      ${emailRow("Service", escapeHtml(serviceNames.join(", ")))}
      ${emailRow("Date", escapeHtml(bookingDate))}
      ${emailRow("Time", escapeHtml(bookingTime))}
      ${emailRow("Salon", escapeHtml(SALON_NAME))}
    </table>
    <p>We will let you know when the salon has reviewed your request.</p>
  `)
}

export function pendingBookingOwnerReminderEmailHtml({
  customerName,
  serviceNames,
  bookingDate,
  bookingTime,
  dashboardUrl,
}: BookingReminderDetails & { dashboardUrl: string }) {
  return brandedEmail(`
    <h2 style="margin-top: 0;">Pending Booking Reminder</h2>
    <p>You have a customer booking waiting for approval. Please review the booking and approve or reject it.</p>
    <table style="width: 100%; border-collapse: collapse;">
      ${emailRow("Customer", escapeHtml(customerName))}
      ${emailRow("Service", escapeHtml(serviceNames.join(", ")))}
      ${emailRow("Appointment date", escapeHtml(bookingDate))}
      ${emailRow("Appointment time", escapeHtml(bookingTime))}
    </table>
    <p><a href="${escapeHtml(dashboardUrl)}">Open the booking dashboard</a></p>
  `)
}

export function customerAppointmentReminderEmailHtml({
  customerName,
  serviceNames,
  bookingDate,
  bookingTime,
}: BookingReminderDetails) {
  return brandedEmail(`
    <h2 style="margin-top: 0;">Appointment Reminder – Your Salon Visit</h2>
    <p>Hello ${escapeHtml(customerName)},</p>
    <p>This is a friendly reminder about your upcoming salon appointment.</p>
    <table style="width: 100%; border-collapse: collapse;">
      ${emailRow("Service", escapeHtml(serviceNames.join(", ")))}
      ${emailRow("Date", escapeHtml(bookingDate))}
      ${emailRow("Time", escapeHtml(bookingTime))}
      ${emailRow("Salon", escapeHtml(SALON_NAME))}
    </table>
    <p>We look forward to seeing you!</p>
    <p>Thank you for choosing us.</p>
  `)
}

export function bookingRejectedEmailHtml({
  customerName,
  serviceNames,
  bookingDate,
  bookingTime,
  reason,
}: BookingReminderDetails & { reason?: string }) {
  return brandedEmail(`
    <h2 style="margin-top: 0;">Update about your appointment request</h2>
    <p>Hello ${escapeHtml(customerName)}, unfortunately your appointment request could not be approved.</p>
    <table style="width: 100%; border-collapse: collapse;">
      ${emailRow("Service", escapeHtml(serviceNames.join(", ")))}
      ${emailRow("Date", escapeHtml(bookingDate))}
      ${emailRow("Time", escapeHtml(bookingTime))}
      ${reason ? emailRow("Message", escapeHtml(reason)) : ""}
    </table>
    <p>Please contact the salon if you would like to discuss another time.</p>
  `)
}
