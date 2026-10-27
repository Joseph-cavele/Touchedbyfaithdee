import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/get-query-client"
import { getServices } from "@/features/services/server/get-services"
import { ServicesManagement } from "@/features/services/components/services-management"
import { COMBO_CATEGORY } from "@/features/services/schema"

/* Combos are services filed under "Combos", so this page shares the services
   query and API — it only scopes the list and the form to that category. */
export default async function DashboardCombosPage() {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["services"],
    queryFn: getServices,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="p-4 sm:p-6">
        <ServicesManagement category={COMBO_CATEGORY} />
      </div>
    </HydrationBoundary>
  )
}
