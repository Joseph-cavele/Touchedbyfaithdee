import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/get-query-client"
import { getServices } from "@/features/services/server/get-services"
import { ServicesManagement } from "@/features/services/components/services-management"

export default async function DashboardServicesPage() {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["services"],
    queryFn: getServices,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="p-4 sm:p-6">
        <ServicesManagement />
      </div>
    </HydrationBoundary>
  )
}
