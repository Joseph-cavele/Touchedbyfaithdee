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
  /**
   * Set for bookings that arrived already paid through Paystack. Adds the
   * amount row and switches the copy.
   *
   * Both variants describe a confirmed booking — bookings confirm on
   * creation now, so neither asks the owner to review anything. The only
   * difference is whether the money has already cleared or is due in the
   * chair.
   */
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
      <h2 style="margin-top: 0;">${isPaid ? "New Booking — Paid Online" : "New Booking — Confirmed"}</h2>
      <p>${
        isPaid
          ? "A new appointment has been paid for online and is already confirmed."
          : "A new appointment has been booked and confirmed automatically."
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
          ? "The slot is confirmed and the money has cleared. Log in to the dashboard to view it."
          : "The slot is confirmed and payment is due in person. Log in to the dashboard to view or cancel it."
      }</p>
  `)
}
