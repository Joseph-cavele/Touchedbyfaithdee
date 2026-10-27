import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { StylistInputValues } from "@/features/stylists/schema"

export function useCreateStylist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: StylistInputValues) => {
      const { data } = await apiClient.post("/stylists", values)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stylists"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}
