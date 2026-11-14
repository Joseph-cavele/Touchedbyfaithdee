import { salonDateTime } from "@/lib/date"

export const OWNER_APPROVAL_REMINDER_DELAY_MS = 3 * 60 * 60 * 1000
export const CUSTOMER_REMINDER_LEADS = {
  "24-hour": 24 * 60 * 60 * 1000,
  "2-hour": 2 * 60 * 60 * 1000,
} as const

export type CustomerReminderLead = keyof typeof CUSTOMER_REMINDER_LEADS
export type ReminderDecision = "not-due" | "due" | "skip"

export function getCustomerReminderDecision({
  bookingDate,
  bookingTime,
  approvedAt,
  createdAt,
  now,
  lead,
}: {
  bookingDate: string
  bookingTime: string
  approvedAt?: Date
  createdAt: Date
  now: Date
  lead: CustomerReminderLead
}): ReminderDecision {
  const appointmentAt = salonDateTime(bookingDate, bookingTime)
  const dueAt = new Date(appointmentAt.getTime() - CUSTOMER_REMINDER_LEADS[lead])
  if (now < dueAt) return "not-due"
  if (now >= appointmentAt) return "skip"
  if ((approvedAt ?? createdAt) > dueAt) return "skip"
  return "due"
}
