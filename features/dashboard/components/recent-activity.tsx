import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RecentActivityItem } from "@/types"

export function RecentActivity({ items }: { items: RecentActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No recent activity
          </p>
        ) : (
          <ul className="flex flex-col gap-3 text-sm">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex min-w-0 flex-col gap-0.5 border-b pb-3 last:border-b-0 last:pb-0"
              >
                <span className="break-words">{item.description}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
