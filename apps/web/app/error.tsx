'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('App error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="font-display text-xl font-bold tracking-tight">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Your work is safe — try again or go back to the dashboard.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = '/dashboard')}>
            Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
