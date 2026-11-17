import { connectDB } from "@/lib/db"
import { BookingModel } from "@/lib/models/Booking"
import type { ReportsData } from "@/types"
import { getBookingServiceSnapshots } from "@/features/bookings/server/service-snapshots"

interface PopulatedBooking {
  _id: unknown
  stylist: { name: string } | null
  services: { name: string; price: number }[]
  serviceItems?: {
    serviceId?: unknown
    serviceName: string
    price?: number | null
    duration: number
  }[]
  bookingDate: string
  status: string
  amount?: number
}

const STATUSES = [
  "PENDING_PAYMENT",
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
] as const
const REVENUE_STATUSES = new Set(["CONFIRMED", "COMPLETED"])

function bookingTotal(b: PopulatedBooking) {
  // Unpriced ("price on request") services contribute nothing to revenue.
  const serviceTotal = getBookingServiceSnapshots(b).reduce((sum, s) => sum + (s.price ?? 0), 0)
  // Use the amount captured when booked; fall back for legacy records without one.
  return b.amount && b.amount > 0 ? b.amount : serviceTotal
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number)
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "short" })
}

export async function getReports(): Promise<ReportsData> {
  await connectDB()

  const bookings = await BookingModel.find()
    .populate("stylist", "name")
    .populate("services", "name price")
    .lean<PopulatedBooking[]>()

  const totalBookings = bookings.length
  const completed = bookings.filter((b) => b.status === "COMPLETED")
  const cancelled = bookings.filter((b) => b.status === "CANCELLED")
  const revenueBookings = bookings.filter((b) => REVENUE_STATUSES.has(b.status))
  // Earned = completed; booked = confirmed, not yet done. The
  // headline total is both, matching the dashboard's revenue card.
  const earnedRevenue = completed.reduce((sum, b) => sum + bookingTotal(b), 0)
  const bookedRevenue = bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((sum, b) => sum + bookingTotal(b), 0)
  const totalRevenue = earnedRevenue + bookedRevenue
  const completedCount = completed.length
  const avgBookingValue = completedCount ? Math.round(earnedRevenue / completedCount) : 0
  const cancellationRate = totalBookings
    ? Math.round((cancelled.length / totalBookings) * 100)
    : 0

  // Monthly revenue for the last 6 months (earned and confirmed bookings).
  const now = new Date()
  const monthKeys: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }
  const revenueByMonth = new Map(monthKeys.map((k) => [k, 0]))
  for (const b of revenueBookings) {
    const key = b.bookingDate.slice(0, 7)
    if (revenueByMonth.has(key)) {
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + bookingTotal(b))
    }
  }
  const monthlyRevenue = monthKeys.map((key) => ({
    month: monthLabel(key),
    revenue: revenueByMonth.get(key) ?? 0,
  }))

  const statusBreakdown = STATUSES.map((status) => ({
    status,
    count: bookings.filter((b) => b.status === status).length,
  })).filter((s) => s.count > 0)

  // Top services: booking count (excluding cancelled) + revenue (from completed).
  const serviceMap = new Map<string, { count: number; revenue: number }>()
  for (const b of bookings) {
    if (b.status === "CANCELLED" || b.status === "REJECTED") continue
    for (const s of getBookingServiceSnapshots(b)) {
      const entry = serviceMap.get(s.serviceName) ?? { count: 0, revenue: 0 }
      entry.count += 1
      if (b.status === "COMPLETED") entry.revenue += s.price ?? 0
      serviceMap.set(s.serviceName, entry)
    }
  }
  const topServices = Array.from(serviceMap.entries())
    .map(([name, v]) => ({ name, count: v.count, revenue: v.revenue }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  // Top stylists: bookings (excluding cancelled) + revenue (from completed).
  const stylistMap = new Map<string, { bookings: number; revenue: number }>()
  for (const b of bookings) {
    if (b.status === "CANCELLED" || b.status === "REJECTED") continue
    const name = b.stylist?.name ?? "Unknown"
    const entry = stylistMap.get(name) ?? { bookings: 0, revenue: 0 }
    entry.bookings += 1
    if (b.status === "COMPLETED") entry.revenue += bookingTotal(b)
    stylistMap.set(name, entry)
  }
  const topStylists = Array.from(stylistMap.entries())
    .map(([name, v]) => ({ name, bookings: v.bookings, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)

  return {
    summary: {
      totalRevenue,
      earnedRevenue,
      bookedRevenue,
      completedCount,
      avgBookingValue,
      cancellationRate,
      totalBookings,
    },
    monthlyRevenue,
    statusBreakdown,
    topServices,
    topStylists,
  }
}
