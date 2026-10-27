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
import type { ServicePerformancePoint } from "@/types"

// Cycle through the dashboard theme's chart tokens so slices always match
// the active theme in both light and dark mode.
const SLOT_COLORS = [1, 2, 3, 4, 5].map((n) => `var(--chart-${n})`)

export function ServicesPerformanceChart({
  data,
}: {
  data: ServicePerformancePoint[]
}) {
  const chartConfig = Object.fromEntries(
    data.map((service, i) => [
      service.name,
      { label: service.name, color: SLOT_COLORS[i % SLOT_COLORS.length] },
    ])
  ) satisfies ChartConfig

  const total = data.reduce((sum, s) => sum + s.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No booking data yet
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={data}
                dataKey="count"
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                label={({ value }: { value?: number }) =>
                  total && value ? `${Math.round((value / total) * 100)}%` : ""
                }
              >
                {data.map((service, i) => (
                  <Cell
                    key={service.name}
                    fill={SLOT_COLORS[i % SLOT_COLORS.length]}
                  />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
