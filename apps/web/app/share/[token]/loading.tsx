'use client'

import { FileText, Loader2 } from 'lucide-react'
import { useI18n } from '@/src/i18n'

export default function ShareTokenLoading() {
  const { tp } = useI18n()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background px-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground text-center">{tp('loadingSharedDocument', 'Loading shared document…')}</p>
      <span className="sr-only">{tp('loading', 'Loading')}</span>
      <div className="flex items-center gap-2 text-muted-foreground/40" aria-hidden>
        <FileText className="h-4 w-4" />
        <span className="text-xs">{tp('readOnly', 'Read-only')}</span>
      </div>
    </div>
  )
}
