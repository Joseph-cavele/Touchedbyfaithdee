import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { StylistInputValues } from "@/features/stylists/schema"

export function useUpdateStylist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...values }: StylistInputValues & { id: string }) => {
      const { data } = await apiClient.patch(`/stylists/${id}`, values)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stylists"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}
