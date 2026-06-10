export default function ProjectWorkspaceLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-pulse" aria-busy="true" aria-label="Loading project">
      <div className="h-8 w-64 rounded-lg bg-muted" />
      <div className="h-4 w-96 max-w-full rounded bg-muted" />
      <div className="h-10 w-full max-w-md rounded-lg bg-muted" />
      <div className="h-64 rounded-xl border bg-card" />
    </div>
  )
}
