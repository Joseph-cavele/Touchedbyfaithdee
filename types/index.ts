export type BookingStatus =
  /** Online payment started, not yet settled. Nothing is confirmed until
      Paystack verifies the charge. */
  | "PENDING_PAYMENT"
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW"

export interface Service {
  id: string
  name: string
  description: string
  /** Rand. Absent = not confirmed yet — display with formatPrice(). */
  price?: number
  duration: number
  category?: string
  image?: string
  /** A combo's checklist of what it bundles. */
  includes?: string[]
}

export interface Stylist {
  id: string
  name: string
  email: string
  phone: string
  bio?: string
  image?: string
  workingHours?: string
  active: boolean
  services: { id: string; name: string }[]
}

export type PaymentMethod = "ONLINE" | "IN_PERSON"
export type PaymentStatus = "UNPAID" | "PAID" | "FAILED"

export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
}

export interface BookingImage {
  id: string
  bookingId: string
  imageUrl: string
}

export interface Booking {
  id: string
  customer: Customer
  stylist: Stylist
  services: Service[]
  bookingDate: string
  bookingTime: string
  description?: string
  notes?: string
  status: BookingStatus
  /** Rand, snapshotted when the booking was made. */
  amount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentReference?: string
  paidAt?: string
  images: BookingImage[]
  createdAt: string
  updatedAt: string
}

export interface CreateBookingInput {
  customerName: string
  customerEmail: string
  customerPhone?: string
  paymentMethod: PaymentMethod
  serviceIds: string[]
  stylistId: string
  bookingDate: string
  bookingTime: string
  description?: string
  notes?: string
  imageUrls: string[]
}

export interface DashboardStats {
  /** Earned + booked: everything the salon has taken or has coming in. */
  totalRevenue: number
  /** From COMPLETED appointments — money already taken. */
  earnedRevenue: number
  /** From CONFIRMED / PENDING appointments — booked, not yet done. */
  bookedRevenue: number
  totalAppointments: number
  /** Appointments dated today (not cancelled). */
  todaysAppointments: number
  /** Bookings made today, whatever date they're for (not cancelled). */
  bookedToday: number
  pendingAppointments: number
  stylistCount: number
}

export interface MonthlyBookingPoint {
  month: string
  count: number
}

export interface ServicePerformancePoint {
  name: string
  count: number
}

export interface UpcomingAppointment {
  id: string
  customerName: string
  stylistName: string
  serviceNames: string[]
  bookingDate: string
  bookingTime: string
  status: BookingStatus
}

export interface RecentActivityItem {
  id: string
  description: string
  updatedAt: string
}

export interface DashboardData {
  stats: DashboardStats
  monthlyBookings: MonthlyBookingPoint[]
  servicesPerformance: ServicePerformancePoint[]
  upcomingAppointments: UpcomingAppointment[]
  recentActivity: RecentActivityItem[]
}

export interface BookingListItem {
  id: string
  customerName: string
  customerEmail: string
  stylistName: string
  serviceNames: string[]
  /** Sum of the priced services only. */
  total: number
  /** Display string from formatTotal() — never "R 0" for unpriced services. */
  totalDisplay: string
  bookingDate: string
  bookingTime: string
  status: BookingStatus
  /** Recorded on the dashboard for a walk-in client. */
  walkIn: boolean
}

export interface CustomerWithStats {
  id: string
  name: string
  /** "" when the client gave none (common for walk-ins). */
  email: string
  phone: string
  totalBookings: number
}

export interface ReportsData {
  summary: {
    /** Earned + booked (see DashboardStats). */
    totalRevenue: number
    earnedRevenue: number
    bookedRevenue: number
    completedCount: number
    avgBookingValue: number
    cancellationRate: number
    totalBookings: number
  }
  monthlyRevenue: { month: string; revenue: number }[]
  statusBreakdown: { status: BookingStatus; count: number }[]
  topServices: { name: string; count: number; revenue: number }[]
  topStylists: { name: string; bookings: number; revenue: number }[]
}

export interface SalonSettings {
  salonName: string
  tagline: string
  email: string
  phone: string
  address: string
  openingHours: string
  notificationEmail: string
  emailNotifications: boolean
}

export interface Notification {
  id: string
  title: string
  message: string
  bookingId: string
  read: boolean
  createdAt: string
}
