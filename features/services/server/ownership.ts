import { SALON_ID } from "@/lib/salon-identity"
import { ServiceModel } from "@/lib/models/Service"

export function salonServiceFilter() {
  return {
    $or: [{ salonId: SALON_ID }, { salonId: { $exists: false } }],
  }
}

export function serviceOwnershipFilter(id: string) {
  return { $and: [{ _id: id }, salonServiceFilter()] }
}

export function normalizedServiceName(name: string) {
  return name.trim().toLocaleLowerCase("en-US")
}

export async function assignLegacyServicesToSalon() {
  await ServiceModel.updateMany(
    { salonId: { $exists: false } },
    { $set: { salonId: SALON_ID, isActive: true } },
    { timestamps: false }
  )
}
