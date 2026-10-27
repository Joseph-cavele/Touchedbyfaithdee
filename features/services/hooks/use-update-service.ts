import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { ServiceInputValues } from "@/features/services/schema"

export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...values }: ServiceInputValues & { id: string }) => {
      const { data } = await apiClient.patch(`/services/${id}`, values)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}
