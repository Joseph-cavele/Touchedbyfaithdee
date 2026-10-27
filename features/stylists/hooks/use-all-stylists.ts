import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { Stylist } from "@/types"

export function useAllStylists() {
  return useQuery({
    queryKey: ["stylists", "all"],
    queryFn: async () => {
      const { data } = await apiClient.get<Stylist[]>("/stylists?all=1")
      return data
    },
  })
}
