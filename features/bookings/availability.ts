import { SALON_HOURS } from "@/lib/salon-contact"

/* Shared by the booking wizard (to grey out taken times) and the bookings
   API (to refuse them). Pure functions only, so both sides agree exactly. */

/** Minutes between bookable start times. */
export const SLOT_STEP_MINUTES = 30

/** A booking with no known duration still holds at least one slot. */
export const MIN_BOOKING_MINUTES = SLOT_STEP_MINUTES

/** "08:30" → 510 */
export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

const toHHMM = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`

/**
 * Start times offered to customers: every half hour from opening, with the
 * last one a full slot before closing (08:30 … 17:30 for 08:30–18:00).
 */
export const TIME_SLOTS: string[] = (() => {
  const slots: string[] = []
  const close = toMinutes(SALON_HOURS.close)
  for (let t = toMinutes(SALON_HOURS.open); t + SLOT_STEP_MINUTES <= close; t += SLOT_STEP_MINUTES) {
    slots.push(toHHMM(t))
  }
  return slots
})()

/** Minutes, [start, end). */
export type BusyInterval = { start: number; end: number }

/** True when a booking starting at `start` would still be running at
    closing time — e.g. a 2-hour service at 17:30 in an 18:00 salon. */
export function runsPastClosing(start: number, duration: number) {
  return start + Math.max(duration, MIN_BOOKING_MINUTES) > toMinutes(SALON_HOURS.close)
}

/** True when [start, start + duration) overlaps any busy interval. */
export function isSlotTaken(start: number, duration: number, busy: BusyInterval[]) {
  const end = start + Math.max(duration, MIN_BOOKING_MINUTES)
  return busy.some((b) => start < b.end && b.start < end)
}

/** Statuses that keep a stylist's time blocked. Cancelled and no-show free it. */
export const SLOT_HOLDING_STATUSES = ["PENDING_PAYMENT", "PENDING", "CONFIRMED", "COMPLETED"] as const
