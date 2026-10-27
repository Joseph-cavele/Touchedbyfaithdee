import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { auth } from "@/auth"
import { getQueryClient } from "@/lib/get-query-client"
import { getDashboardData } from "@/features/dashboard/server/get-dashboard-data"
import { DashboardContent } from "@/app/dashboard/dashboard-content"

export default async function DashboardPage() {
  const queryClient = getQueryClient()

  // Fetch on the server and hydrate the client cache, so DashboardContent's
  // useDashboard() query resolves on first paint — no client-side fetch waterfall.
  const [session] = await Promise.all([
    auth(),
    queryClient.prefetchQuery({
      queryKey: ["dashboard"],
      queryFn: getDashboardData,
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContent name={session?.user?.name} />
    </HydrationBoundary>
  )
}
