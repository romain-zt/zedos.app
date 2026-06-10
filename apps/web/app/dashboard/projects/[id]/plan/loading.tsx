export default function PlanLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading plan">
      <div className="h-8 w-56 rounded-lg bg-muted" />
      <div className="grid gap-4 lg:grid-cols-[20rem,1fr]">
        <div className="space-y-3">
          <div className="h-24 rounded-xl border bg-card" />
          <div className="h-24 rounded-xl border bg-card" />
        </div>
        <div className="h-96 rounded-xl border bg-card hidden lg:block" />
      </div>
    </div>
  )
}
