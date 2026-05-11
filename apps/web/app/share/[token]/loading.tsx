import { FileText, Loader2 } from 'lucide-react'

export default function ShareTokenLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background px-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground text-center">Loading shared document…</p>
      <span className="sr-only">Loading</span>
      <div className="flex items-center gap-2 text-muted-foreground/40" aria-hidden>
        <FileText className="h-4 w-4" />
        <span className="text-xs">Read-only</span>
      </div>
    </div>
  )
}
