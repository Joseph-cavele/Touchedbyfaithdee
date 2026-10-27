import { connectDB } from "@/lib/db"
import { StylistModel } from "@/lib/models/Stylist"
import type { Stylist } from "@/types"

interface PopulatedStylist {
  _id: unknown
  name: string
  email: string
  phone: string
  bio?: string
  image?: string
  workingHours?: string
  active: boolean
  services: { _id: unknown; name: string }[]
}

export async function getStylists(all = false): Promise<Stylist[]> {
  await connectDB()
  const stylists = await StylistModel.find(all ? {} : { active: true })
    .populate("services", "name")
    .sort({ name: 1 })
    .lean<PopulatedStylist[]>()

  return stylists.map((s) => ({
    id: String(s._id),
    name: s.name,
    email: s.email ?? "",
    phone: s.phone ?? "",
    bio: s.bio,
    image: s.image,
    workingHours: s.workingHours,
    active: s.active,
    services: (s.services ?? []).map((service) => ({
      id: String(service._id),
      name: service.name,
    })),
  }))
}
