import { connectDB } from "@/lib/db"
import { BookingModel } from "@/lib/models/Booking"
import { formatTotal } from "@/lib/currency"
import type { BookingListItem, BookingStatus } from "@/types"

interface PopulatedBooking {
  _id: unknown
  customer: { name: string; email: string } | null
  stylist: { name: string } | null
  services: { name: string; price: number }[]
  bookingDate: string
  bookingTime: string
  status: string
  source?: string
}

export async function getBookings(status?: BookingStatus): Promise<BookingListItem[]> {
  await connectDB()

  const bookings = await BookingModel.find(status ? { status } : {})
    .populate("customer", "name email")
    .populate("stylist", "name")
    .populate("services", "name price")
    .sort({ bookingDate: -1, bookingTime: -1 })
    .lean<PopulatedBooking[]>()

  return bookings.map((b) => ({
    id: String(b._id),
    customerName: b.customer?.name ?? "Unknown",
    customerEmail: b.customer?.email ?? "",
    stylistName: b.stylist?.name ?? "Unknown",
    serviceNames: b.services.map((s) => s.name),
    total: b.services.reduce((sum, s) => sum + (s.price ?? 0), 0),
    totalDisplay: formatTotal(b.services.map((s) => s.price)),
    bookingDate: b.bookingDate,
    bookingTime: b.bookingTime,
    status: b.status as BookingStatus,
    walkIn: b.source === "WALK_IN",
  }))
}
