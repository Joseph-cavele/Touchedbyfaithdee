import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { Notification } from "@/types"

interface NotificationsResponse {
  notifications: Notification[]
  unreadCount: number
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await apiClient.get<NotificationsResponse>("/notifications")
      return data
    },
    refetchInterval: 15000,
  })
}
