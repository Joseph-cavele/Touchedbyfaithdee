import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { BookingListItem, BookingStatus } from "@/types"

export function useBookings(status?: BookingStatus) {
  return useQuery({
    queryKey: ["bookings", status ?? "ALL"],
    queryFn: async () => {
      const { data } = await apiClient.get<BookingListItem[]>("/bookings", {
        params: status ? { status } : undefined,
      })
      return data
    },
  })
}
