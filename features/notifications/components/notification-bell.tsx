"use client"

import { useEffect, useRef } from "react"
import { Bell, Check } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { useNotifications } from "@/features/notifications/hooks/use-notifications"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/features/notifications/hooks/use-mark-notification-read"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function NotificationBell() {
  const { data } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const seenIds = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!data) return

    if (seenIds.current === null) {
      seenIds.current = new Set(data.notifications.map((n) => n.id))
      return
    }

    const unseen = data.notifications.filter((n) => !seenIds.current!.has(n.id))
    for (const notification of unseen) {
      toast.info(notification.title, { description: notification.message })
      seenIds.current.add(notification.id)
    }
  }, [data])

  const unreadCount = data?.unreadCount ?? 0
  const notifications = data?.notifications ?? []

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className="relative inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <Check className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          )}
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => !notification.read && markRead.mutate(notification.id)}
              className={cn(
                "flex w-full flex-col gap-0.5 border-b p-3 text-left text-sm last:border-b-0 hover:bg-muted",
                !notification.read && "bg-primary/5"
              )}
            >
              <div className="flex items-center gap-1.5">
                {!notification.read && (
                  <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                )}
                <span className="font-medium">{notification.title}</span>
              </div>
              <span className="text-muted-foreground">{notification.message}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
