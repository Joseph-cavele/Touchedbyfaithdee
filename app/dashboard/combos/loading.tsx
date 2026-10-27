import { CardTableSkeleton } from "@/components/ui/skeleton"

export default function CombosLoading() {
  return (
    <div className="p-4 sm:p-6">
      <CardTableSkeleton rows={5} />
    </div>
  )
}
