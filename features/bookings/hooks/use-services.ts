import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { Service } from "@/types"

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data } = await apiClient.get<Service[]>("/services")
      return data
    },
  })
}
