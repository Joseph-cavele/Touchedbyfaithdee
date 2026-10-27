"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatTotal } from "@/lib/currency"
import type { Service, Stylist } from "@/types"

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export function BookingSummary({
  customerName,
  services,
  stylist,
  bookingDate,
  bookingTime,
}: {
  customerName?: string
  services: Service[]
  stylist?: Stylist
  bookingDate?: string
  bookingTime?: string
}) {
  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <SummaryRow label="Customer" value={customerName || "—"} />
        <SummaryRow
          label="Services"
          value={services.length ? services.map((s) => s.name).join(", ") : "—"}
        />
        <SummaryRow label="Stylist" value={stylist?.name || "—"} />
        <SummaryRow label="Date" value={bookingDate || "—"} />
        <SummaryRow label="Time" value={bookingTime || "—"} />
        <Separator />
        <SummaryRow
          label="Total price"
          value={services.length ? formatTotal(services.map((s) => s.price)) : "—"}
        />
        <SummaryRow
          label="Total duration"
          value={services.length ? formatDuration(totalDuration) : "—"}
        />
      </CardContent>
    </Card>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
