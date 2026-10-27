import { connectDB } from "@/lib/db"
import { BookingModel } from "@/lib/models/Booking"
import {
  MIN_BOOKING_MINUTES,
  SLOT_HOLDING_STATUSES,
  toMinutes,
  type BusyInterval,
} from "@/features/bookings/availability"

type BookingWithDurations = {
  bookingTime: string
  services: { duration?: number | null }[]
}

/**
 * The times a stylist is already booked on a date, as [start, end) minutes.
 * Each booking blocks the sum of its services' durations, so a long service
 * blocks every slot it runs through — not just its start time.
 */
export async function getBusyIntervals(stylistId: string, bookingDate: string): Promise<BusyInterval[]> {
  await connectDB()

  const bookings = await BookingModel.find({
    stylist: stylistId,
    bookingDate,
    status: { $in: SLOT_HOLDING_STATUSES },
  })
    .select("bookingTime services")
    .populate("services", "duration")
    .lean<BookingWithDurations[]>()

  return bookings.map((b) => {
    const start = toMinutes(b.bookingTime)
    const duration = b.services.reduce((sum, s) => sum + (s?.duration ?? 0), 0)
    return { start, end: start + Math.max(duration, MIN_BOOKING_MINUTES) }
  })
}
