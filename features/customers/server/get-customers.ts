import { connectDB } from "@/lib/db"
import { CustomerModel } from "@/lib/models/Customer"
import { BookingModel } from "@/lib/models/Booking"
import type { CustomerWithStats } from "@/types"

export async function getCustomers(): Promise<CustomerWithStats[]> {
  await connectDB()

  const [customers, counts] = await Promise.all([
    CustomerModel.find().sort({ name: 1 }).lean(),
    BookingModel.aggregate([
      { $group: { _id: "$customer", totalBookings: { $sum: 1 } } },
    ]),
  ])

  const countByCustomer = new Map(
    counts.map((c) => [String(c._id), c.totalBookings as number])
  )

  return customers.map((c) => ({
    id: String(c._id),
    name: c.name,
    email: c.email ?? "",
    phone: c.phone ?? "",
    totalBookings: countByCustomer.get(String(c._id)) ?? 0,
  }))
}
