import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { SalonSettings } from "@/types"
import type { SettingsFormValues } from "@/features/settings/schema"

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await apiClient.get<SalonSettings>("/settings")
      return data
    },
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      const { data } = await apiClient.put<SalonSettings>("/settings", values)
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["settings"], data)
    },
  })
}
