export default function DashboardLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 rounded-lg bg-muted" />
      <div className="h-4 w-72 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl border bg-card p-4 space-y-3">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
