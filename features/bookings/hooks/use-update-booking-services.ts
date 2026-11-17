import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { CustomServiceInputValues } from "@/features/services/schema"

export function useUpdateBookingServices() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      serviceIds,
      customServices,
    }: {
      id: string
      serviceIds: string[]
      customServices: CustomServiceInputValues[]
    }) => {
      const { data } = await apiClient.patch(`/bookings/${id}`, { serviceIds, customServices })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}
