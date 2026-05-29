'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Construction, Lightbulb, Mail, Rocket } from 'lucide-react'
import type { DeferredRoadmapPlaceholder } from '../_lib/deferred-roadmap-placeholders'
import { ROADMAP_CONTACT_EMAIL } from '../_lib/deferred-roadmap-placeholders'

interface RoadmapItemModalProps {
  item: DeferredRoadmapPlaceholder | null
  onClose: () => void
}

export function RoadmapItemModal({ item, onClose }: RoadmapItemModalProps) {
  if (!item) return null

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-full px-2.5 py-0.5">
              <Construction className="h-3 w-3" />
              Coming in v1
            </span>
          </div>
          <DialogTitle className="text-xl">{item.title}</DialogTitle>
          <DialogDescription className="sr-only">{item.summary}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* What it is */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Rocket className="h-3.5 w-3.5" />
              What it does
            </div>
            <p className="text-sm text-foreground leading-relaxed">{item.description}</p>
          </div>

          {/* Why it matters */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Lightbulb className="h-3.5 w-3.5" />
              Why it matters
            </div>
            <p className="text-sm text-foreground leading-relaxed">{item.why}</p>
          </div>

          {/* Contact CTA */}
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-2">
            <p className="text-sm font-medium">Need this sooner?</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If you&apos;re in a hurry and want this built for your team as a custom project, reach out directly — we can scope it together.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 mt-1"
              asChild
            >
              <a
                href={`mailto:${ROADMAP_CONTACT_EMAIL}?subject=Fast-track: ${encodeURIComponent(item.title)}&body=Hi,%0A%0AI'm interested in getting "${item.title}" built faster. Here's what I need:%0A%0A`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Mail className="h-3.5 w-3.5" />
                Get in touch
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
