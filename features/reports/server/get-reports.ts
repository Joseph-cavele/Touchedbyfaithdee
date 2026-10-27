import { connectDB } from "@/lib/db"
import { BookingModel } from "@/lib/models/Booking"
import type { ReportsData } from "@/types"

interface PopulatedBooking {
  _id: unknown
  stylist: { name: string } | null
  services: { name: string; price: number }[]
  bookingDate: string
  status: string
}

const STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const

function bookingTotal(b: PopulatedBooking) {
  // Unpriced ("price on request") services contribute nothing to revenue.
  return b.services.reduce((sum, s) => sum + (s.price ?? 0), 0)
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
  // Earned = completed; booked = confirmed/pending, not yet done. The
  // headline total is both, matching the dashboard's revenue card.
  const earnedRevenue = completed.reduce((sum, b) => sum + bookingTotal(b), 0)
  const bookedRevenue = bookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "PENDING")
    .reduce((sum, b) => sum + bookingTotal(b), 0)
  const totalRevenue = earnedRevenue + bookedRevenue
  const completedCount = completed.length
  const avgBookingValue = completedCount ? Math.round(earnedRevenue / completedCount) : 0
  const cancellationRate = totalBookings
    ? Math.round((cancelled.length / totalBookings) * 100)
    : 0

  // Monthly revenue for the last 6 months (from completed bookings).
  const now = new Date()
  const monthKeys: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }
  const revenueByMonth = new Map(monthKeys.map((k) => [k, 0]))
  for (const b of completed) {
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
    if (b.status === "CANCELLED") continue
    for (const s of b.services) {
      const entry = serviceMap.get(s.name) ?? { count: 0, revenue: 0 }
      entry.count += 1
      if (b.status === "COMPLETED") entry.revenue += s.price ?? 0
      serviceMap.set(s.name, entry)
    }
  }
  const topServices = Array.from(serviceMap.entries())
    .map(([name, v]) => ({ name, count: v.count, revenue: v.revenue }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  // Top stylists: bookings (excluding cancelled) + revenue (from completed).
  const stylistMap = new Map<string, { bookings: number; revenue: number }>()
  for (const b of bookings) {
    if (b.status === "CANCELLED") continue
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
