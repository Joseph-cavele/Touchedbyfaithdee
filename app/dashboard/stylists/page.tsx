import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/get-query-client"
import { getStylists } from "@/features/stylists/server/get-stylists"
import { StylistsManagement } from "@/features/stylists/components/stylists-management"

export default async function DashboardStylistsPage() {
  const queryClient = getQueryClient()

  // Matches useAllStylists() -> ["stylists", "all"] (fetches all stylists).
  await queryClient.prefetchQuery({
    queryKey: ["stylists", "all"],
    queryFn: () => getStylists(true),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="p-4 sm:p-6">
        <StylistsManagement />
      </div>
    </HydrationBoundary>
  )
}
