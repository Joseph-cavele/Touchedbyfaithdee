import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { DashboardData } from "@/types"

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardData>("/dashboard")
      return data
    },
  })
}
