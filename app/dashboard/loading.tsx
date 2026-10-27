function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Block key={i} className="h-24" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Block className="h-72" />
        <Block className="h-72" />
      </div>

      {/* Tables */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Block className="h-80 lg:col-span-2" />
        <Block className="h-80" />
      </div>
    </div>
  )
}
