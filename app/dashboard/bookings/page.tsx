import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/get-query-client"
import { getBookings } from "@/features/bookings/server/get-bookings"
import { BookingsManagement } from "@/features/bookings/components/bookings-management"

export default async function DashboardBookingsPage() {
  const queryClient = getQueryClient()

  // Matches useBookings(undefined) -> ["bookings", "ALL"] (the default "All" tab).
  await queryClient.prefetchQuery({
    queryKey: ["bookings", "ALL"],
    queryFn: () => getBookings(),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="p-4 sm:p-6">
        <BookingsManagement />
      </div>
    </HydrationBoundary>
  )
}
