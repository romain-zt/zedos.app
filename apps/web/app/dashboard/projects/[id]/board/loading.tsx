export default function BoardLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading board">
      <div className="h-8 w-56 rounded-lg bg-muted" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-72 shrink-0 space-y-2">
            <div className="h-6 rounded bg-muted" />
            <div className="h-24 rounded-xl border bg-card" />
            <div className="h-24 rounded-xl border bg-card" />
          </div>
        ))}
      </div>
    </div>
  )
}
