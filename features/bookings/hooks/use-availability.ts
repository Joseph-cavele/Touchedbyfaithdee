import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { BusyInterval } from "@/features/bookings/availability"

/** A stylist's booked time ranges on a date. Idle until both are chosen. */
export function useAvailability(stylistId: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: ["availability", stylistId, date],
    enabled: !!stylistId && !!date,
    // Slots fill up while someone is choosing; don't trust a stale minute-old copy.
    staleTime: 0,
    queryFn: async () => {
      const { data } = await apiClient.get<{ busy: BusyInterval[] }>("/bookings/availability", {
        params: { stylistId, date },
      })
      return data.busy
    },
  })
}
