import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Compass className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="font-display text-xl font-bold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
