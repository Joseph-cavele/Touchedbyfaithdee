import { CardTableSkeleton } from "@/components/ui/skeleton"

export default function StylistsLoading() {
  return (
    <div className="p-4 sm:p-6">
      <CardTableSkeleton rows={6} />
    </div>
  )
}
