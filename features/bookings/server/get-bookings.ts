import { connectDB } from "@/lib/db"
import { BookingModel } from "@/lib/models/Booking"
import { formatTotal } from "@/lib/currency"
import { getBookingServiceSnapshots } from "@/features/bookings/server/service-snapshots"
import type { BookingListItem, BookingStatus } from "@/types"

const VALID_BOOKING_STATUSES = new Set<BookingStatus>([
  "PENDING_PAYMENT",
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
])

interface PopulatedBooking {
  _id: unknown
  customer: { name: string; email: string } | null
  stylist: { name: string } | null
  services: { name: string; price: number | null | undefined }[]
  serviceItems?: {
    serviceId?: unknown
    serviceName: string
    price?: number | null
    duration: number
  }[]
  amount: number
  bookingDate: string
  bookingTime: string
  status: string
  source?: string
  rejectionReason?: string
  ownerReminderSentAt?: Date | string
  ownerReminderLastError?: string
  customer24HourReminderSentAt?: Date | string
  customer24HourReminderSkippedAt?: Date | string
  customer24HourReminderLastError?: string
  customer2HourReminderSentAt?: Date | string
  customer2HourReminderSkippedAt?: Date | string
  customer2HourReminderLastError?: string
}

function isoDate(value?: Date | string) {
  return value ? new Date(value).toISOString() : undefined
}

function normalizeStatusFilter(status?: string): BookingStatus | undefined {
  if (!status || status === "ALL") return undefined
  return VALID_BOOKING_STATUSES.has(status as BookingStatus)
    ? (status as BookingStatus)
    : undefined
}

export async function getBookings(status?: BookingStatus): Promise<BookingListItem[]> {
  await connectDB()

  const normalizedStatus = normalizeStatusFilter(status)
  const bookings = await BookingModel.find(normalizedStatus ? { status: normalizedStatus } : {})
    .populate("customer", "name email")
    .populate("stylist", "name")
    .populate("services", "name price")
    .sort({ bookingDate: -1, bookingTime: -1 })
    .lean<PopulatedBooking[]>()

  return bookings.map((b) => {
    const serviceItems = getBookingServiceSnapshots(b)
    const total = b.amount ?? serviceItems.reduce((sum, service) => sum + (service.price ?? 0), 0)

    return {
      id: String(b._id),
      customerName: b.customer?.name ?? "Unknown",
      customerEmail: b.customer?.email ?? "",
      stylistName: b.stylist?.name ?? "Unknown",
      serviceNames: serviceItems.map((s) => s.serviceName),
      serviceItems,
      total,
      totalDisplay: b.serviceItems?.length
        ? formatTotal(serviceItems.map((s) => s.price))
        : formatTotal([total]),
      bookingDate: b.bookingDate,
      bookingTime: b.bookingTime,
      status: (b.status as BookingStatus) ?? "PENDING",
      walkIn: b.source === "WALK_IN",
      rejectionReason: b.rejectionReason,
      ownerReminderSentAt: isoDate(b.ownerReminderSentAt),
      ownerReminderLastError: b.ownerReminderLastError,
      customer24HourReminderSentAt: isoDate(b.customer24HourReminderSentAt),
      customer24HourReminderSkippedAt: isoDate(b.customer24HourReminderSkippedAt),
      customer24HourReminderLastError: b.customer24HourReminderLastError,
      customer2HourReminderSentAt: isoDate(b.customer2HourReminderSentAt),
      customer2HourReminderSkippedAt: isoDate(b.customer2HourReminderSkippedAt),
      customer2HourReminderLastError: b.customer2HourReminderLastError,
    }
  })
}
