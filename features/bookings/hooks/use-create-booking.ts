import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { CreateBookingFormValues } from "@/features/bookings/schema"

export function useCreateBooking() {
  return useMutation({
    mutationFn: async (values: CreateBookingFormValues) => {
      const { data } = await apiClient.post<{ id: string }>("/bookings", values)
      return data
    },
  })
}
