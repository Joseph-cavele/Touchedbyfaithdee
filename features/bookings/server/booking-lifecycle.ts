import type { BookingStatus } from "@/types"

export function canTransitionBookingStatus(current: string, next: BookingStatus) {
  if (current === next) return true

  if (next === "CONFIRMED" || next === "REJECTED") {
    return current === "PENDING" || current === "PENDING_PAYMENT"
  }
  if (next === "CANCELLED") {
    return current === "PENDING" || current === "PENDING_PAYMENT" || current === "CONFIRMED"
  }
  if (next === "COMPLETED" || next === "NO_SHOW") {
    return current === "CONFIRMED"
  }
  return false
}
