export interface BookingServiceSnapshot {
  serviceId: string | null
  serviceName: string
  price?: number | null
  duration: number
}

type ServiceLike = {
  _id?: unknown
  id?: unknown
  serviceId?: unknown
  name?: string
  serviceName?: string
  price?: number | null
  duration?: number | null
}

export function snapshotService(service: ServiceLike): BookingServiceSnapshot {
  const serviceId = service.serviceId ?? service._id ?? service.id
  return {
    serviceId: serviceId == null ? null : String(serviceId),
    serviceName: service.serviceName ?? service.name ?? "",
    price: service.price,
    duration: service.duration ?? 0,
  }
}

export function getBookingServiceSnapshots(booking: {
  serviceItems?: ServiceLike[] | null
  services?: ServiceLike[] | null
}): BookingServiceSnapshot[] {
  const items = booking.serviceItems?.length ? booking.serviceItems : booking.services ?? []
  return items.map(snapshotService)
}

export function totalBookingAmount(items: BookingServiceSnapshot[]) {
  return items.reduce((sum, service) => sum + (service.price ?? 0), 0)
}

export function totalBookingDuration(items: BookingServiceSnapshot[]) {
  return items.reduce((sum, service) => sum + service.duration, 0)
}
