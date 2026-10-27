import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { CustomerWithStats } from "@/types"

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await apiClient.get<CustomerWithStats[]>("/customers")
      return data
    },
  })
}
