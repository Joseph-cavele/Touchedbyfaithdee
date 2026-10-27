import { CardTableSkeleton } from "@/components/ui/skeleton"

export default function CustomersLoading() {
  return (
    <div className="p-4 sm:p-6">
      <CardTableSkeleton rows={8} />
    </div>
  )
}
