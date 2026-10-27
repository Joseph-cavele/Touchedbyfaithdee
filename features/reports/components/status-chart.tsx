"use client"

import { Cell, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BookingStatus } from "@/types"

/* Status colours, read from the theme's chart tokens so the chart follows
   the brand palette: gold deepens as a booking moves through the funnel.
   The two exits deliberately leave the ramp — cancelled is the destructive
   red and no-show the neutral muted grey — so they read as failures rather
   than another stage. */
const STATUS_COLORS: Record<BookingStatus, { light: string; dark: string }> = {
  PENDING_PAYMENT: { light: "var(--chart-5)", dark: "var(--chart-5)" },
  PENDING: { light: "var(--chart-2)", dark: "var(--chart-2)" },
  CONFIRMED: { light: "var(--chart-1)", dark: "var(--chart-1)" },
  COMPLETED: { light: "var(--chart-3)", dark: "var(--chart-3)" },
  CANCELLED: { light: "var(--destructive)", dark: "var(--destructive)" },
  NO_SHOW: { light: "var(--chart-4)", dark: "var(--chart-4)" },
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
}

export function StatusChart({
  data,
}: {
  data: { status: BookingStatus; count: number }[]
}) {
  const chartConfig = Object.fromEntries(
    data.map((d) => [
      d.status,
      { label: STATUS_LABEL[d.status], theme: STATUS_COLORS[d.status] },
    ])
  ) satisfies ChartConfig

  const chartData = data.map((d) => ({
    status: STATUS_LABEL[d.status],
    count: d.count,
    fill: `var(--color-${d.status})`,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings by Status</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No booking data yet</p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="count" nameKey="status" innerRadius={50} outerRadius={90} paddingAngle={2}>
                {chartData.map((d) => (
                  <Cell key={d.status} fill={d.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="status" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
