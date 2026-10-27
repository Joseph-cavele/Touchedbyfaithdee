import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { ReportsData } from "@/types"

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data } = await apiClient.get<ReportsData>("/reports")
      return data
    },
  })
}
