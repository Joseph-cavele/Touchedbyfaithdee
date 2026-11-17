import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { Service } from "@/types"

export function useServices(includeInactive = false) {
  return useQuery({
    queryKey: includeInactive ? ["services", "all"] : ["services"],
    queryFn: async () => {
      const { data } = await apiClient.get<Service[]>(
        includeInactive ? "/services?includeInactive=true" : "/services"
      )
      return data
    },
  })
}
