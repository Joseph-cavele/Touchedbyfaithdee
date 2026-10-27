import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { UpdateBookingStatusValues } from "@/features/bookings/schema"

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...values
    }: UpdateBookingStatusValues & { id: string }) => {
      const { data } = await apiClient.patch(`/bookings/${id}`, values)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
    },
  })
}
