import { brandedEmail, emailRow } from "@/emails/layout"
import { escapeHtml } from "@/emails/escape-html"
import { formatCurrency } from "@/lib/currency"

interface NewBookingOwnerEmailProps {
  customerName: string
  customerEmail: string
  stylistName: string
  serviceNames: string[]
  bookingDate: string
  bookingTime: string
  /** Set for bookings that arrived already paid through Paystack. */
  paidAmount?: number
  /** Total as shown to the customer, e.g. "R 270" or "Price on request". */
  totalDisplay?: string
}

export function newBookingOwnerEmailHtml({
  customerName,
  customerEmail,
  stylistName,
  serviceNames,
  bookingDate,
  bookingTime,
  paidAmount,
  totalDisplay,
}: NewBookingOwnerEmailProps) {
  const isPaid = typeof paidAmount === "number"

  const row = emailRow

  return brandedEmail(`
      <h2 style="margin-top: 0;">${isPaid ? "New Booking — Paid Online" : "New Booking — Awaiting Approval"}</h2>
      <p>${
        isPaid
          ? "A new appointment request has been paid for online and is waiting for your review."
          : "A new appointment request is waiting for your review."
      }</p>
      <table style="width: 100%; border-collapse: collapse;">
        ${row("Customer", `${escapeHtml(customerName)} (${escapeHtml(customerEmail)})`)}
        ${row("Stylist", escapeHtml(stylistName))}
        ${row("Services", escapeHtml(serviceNames.join(", ")))}
        ${row("Date", escapeHtml(bookingDate))}
        ${row("Time", escapeHtml(bookingTime))}
        ${isPaid ? row("Paid", escapeHtml(formatCurrency(paidAmount))) : ""}
        ${!isPaid && totalDisplay ? row("Price", escapeHtml(totalDisplay)) : ""}
      </table>
      <p>${
        isPaid
          ? "Review the request in the dashboard before confirming the appointment."
          : "Review the request in the dashboard and approve or reject it."
      }</p>
  `)
}
