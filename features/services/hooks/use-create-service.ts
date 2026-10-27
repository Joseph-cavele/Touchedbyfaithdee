import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { ServiceInputValues } from "@/features/services/schema"

export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: ServiceInputValues) => {
      const { data } = await apiClient.post("/services", values)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}
