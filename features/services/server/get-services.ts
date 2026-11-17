import { unstable_cache } from "next/cache"
import { DEFAULT_SERVICE_CATEGORY } from "@/features/services/schema"
import { connectDB } from "@/lib/db"
import { ServiceModel } from "@/lib/models/Service"
import type { Service } from "@/types"
import { assignLegacyServicesToSalon, salonServiceFilter } from "@/features/services/server/ownership"

async function fetchServices(): Promise<Service[]> {
  await connectDB()
  await assignLegacyServicesToSalon()
  const services = await ServiceModel.find({
    $and: [
      salonServiceFilter(),
      { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
    ],
  })
    .sort({ name: 1 })
    .lean()

  return services.map((s) => ({
    id: String(s._id),
    name: s.name,
    description: s.description,
    price: s.price ?? undefined,
    duration: s.duration,
    category: s.category ?? DEFAULT_SERVICE_CATEGORY,
    image: s.image,
    includes: s.includes?.length ? s.includes : undefined,
    isActive: s.isActive ?? true,
  }))
}

/**
 * Cached service list. Services rarely change, so the DB read is reused across
 * requests until a service mutation calls `revalidateTag("services")`.
 */
export const getServices = unstable_cache(fetchServices, ["services-list-v2"], {
  tags: ["services"],
  revalidate: 300,
})
