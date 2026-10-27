import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { Stylist } from "@/types"

export function useStylists() {
  return useQuery({
    queryKey: ["stylists"],
    queryFn: async () => {
      const { data } = await apiClient.get<Stylist[]>("/stylists")
      return data
    },
  })
}
