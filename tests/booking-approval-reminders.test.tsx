import assert from "node:assert/strict"
import { test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { BookingManagementRowActions } from "@/features/bookings/components/booking-management-row-actions"
import { canTransitionBookingStatus } from "@/features/bookings/server/booking-lifecycle"
import { createBookingSchema, updateBookingStatusSchema } from "@/features/bookings/schema"
import {
  getCustomerReminderDecision,
  OWNER_APPROVAL_REMINDER_DELAY_MS,
} from "@/features/notifications/lib/reminder-schedule"
import { salonDateTime } from "@/lib/date"
import type { BookingListItem, BookingStatus } from "@/types"

const appointmentAt = salonDateTime("2026-03-20", "12:00")
const dayBeforeAppointment = new Date(appointmentAt.getTime() - 24 * 60 * 60 * 1000)

test("customer reminder schedule uses the Johannesburg appointment instant and skips missed 24-hour reminders", () => {
  assert.equal(appointmentAt.toISOString(), "2026-03-20T10:00:00.000Z")

  const booking = {
    bookingDate: "2026-03-20",
    bookingTime: "12:00",
    createdAt: new Date(dayBeforeAppointment.getTime() - 60 * 60 * 1000),
    approvedAt: new Date(dayBeforeAppointment.getTime() - 1),
    lead: "24-hour" as const,
  }

  assert.equal(
    getCustomerReminderDecision({ ...booking, now: new Date(dayBeforeAppointment.getTime() - 1) }),
    "not-due"
  )
  assert.equal(
    getCustomerReminderDecision({ ...booking, now: dayBeforeAppointment }),
    "due"
  )
  assert.equal(
    getCustomerReminderDecision({
      ...booking,
      approvedAt: new Date(dayBeforeAppointment.getTime() + 1),
      now: dayBeforeAppointment,
    }),
    "skip"
  )
})

test("2-hour reminders are skipped after the appointment starts", () => {
  assert.equal(
    getCustomerReminderDecision({
      bookingDate: "2026-03-20",
      bookingTime: "12:00",
      createdAt: new Date(appointmentAt.getTime() - 3 * 60 * 60 * 1000),
      approvedAt: new Date(appointmentAt.getTime() - 3 * 60 * 60 * 1000),
      now: appointmentAt,
      lead: "2-hour",
    }),
    "skip"
  )
})

test("approval transitions require owner review and reject closed or invalid transitions", () => {
  assert.equal(OWNER_APPROVAL_REMINDER_DELAY_MS, 3 * 60 * 60 * 1000)
  assert.equal(canTransitionBookingStatus("PENDING", "CONFIRMED"), true)
  assert.equal(canTransitionBookingStatus("PENDING", "REJECTED"), true)
  assert.equal(canTransitionBookingStatus("CONFIRMED", "PENDING"), false)
  assert.equal(canTransitionBookingStatus("REJECTED", "CONFIRMED"), false)
  assert.equal(canTransitionBookingStatus("CONFIRMED", "COMPLETED"), true)
})

test("customer booking accepts in-person payment only and rescheduling requires date and time together", () => {
  const booking = {
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    customerPhone: "073 123 4567",
    serviceIds: ["service-id"],
    stylistId: "stylist-id",
    bookingDate: "2026-03-20",
    bookingTime: "12:00",
  }

  assert.equal(createBookingSchema.safeParse({ ...booking, paymentMethod: "IN_PERSON" }).success, true)
  assert.equal(createBookingSchema.safeParse({ ...booking, paymentMethod: "ONLINE" }).success, false)
  assert.equal(
    updateBookingStatusSchema.safeParse({
      bookingDate: "2026-03-21",
      bookingTime: "13:00",
    }).success,
    true
  )
  assert.equal(
    updateBookingStatusSchema.safeParse({ bookingDate: "2026-03-21" }).success,
    false
  )
})

function renderBookingActions(status: BookingStatus) {
  const booking: BookingListItem = {
    id: "booking-id",
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    stylistName: "Faith",
    serviceNames: ["Occasional makeup"],
    total: 750,
    totalDisplay: "R 750",
    bookingDate: "2026-03-20",
    bookingTime: "12:00",
    status,
    walkIn: false,
  }
  const queryClient = new QueryClient()
  return renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(BookingManagementRowActions, { booking })
    )
  )
}

test("booking management exposes approval and rejection actions only while pending", () => {
  const pendingHtml = renderBookingActions("PENDING")
  const confirmedHtml = renderBookingActions("CONFIRMED")

  assert.match(pendingHtml, /aria-label="Approve booking"/)
  assert.match(pendingHtml, /aria-label="Reject booking"/)
  assert.doesNotMatch(confirmedHtml, /aria-label="Approve booking"/)
  assert.doesNotMatch(confirmedHtml, /aria-label="Reject booking"/)
})
