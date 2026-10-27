import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/get-query-client"
import { getReports } from "@/features/reports/server/get-reports"
import { ReportsContent } from "@/features/reports/components/reports-content"

export default async function DashboardReportsPage() {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["reports"],
    queryFn: getReports,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReportsContent />
    </HydrationBoundary>
  )
}
