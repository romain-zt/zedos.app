'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { milestonePromptSessionKey, markMilestonePromptSession } from '@/app/dashboard/projects/[id]/_components/owner-milestone-prompt-session'

interface MilestoneFeedbackModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  prdVersionId?: string | null
  milestoneType: string
  title: string
  description: string
}

export function MilestoneFeedbackModal({
  open,
  onClose,
  projectId,
  prdVersionId,
  milestoneType,
  title,
  description,
}: MilestoneFeedbackModalProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          prdVersionId: prdVersionId ?? null,
          milestoneType,
          ratingType: 'stars',
          ratingValue: rating,
          comment: comment.trim() || null,
        }),
      })
      toast.success('Thanks for your feedback!')
      markMilestonePromptSession(milestonePromptSessionKey(projectId, milestoneType, prdVersionId ?? null))
      onClose()
    } catch {
      toast.error('Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDismiss = () => {
    markMilestonePromptSession(milestonePromptSessionKey(projectId, milestoneType, prdVersionId ?? null))
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Star rating */}
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star: number) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Optional comment */}
          <Textarea
            placeholder="Any thoughts? (optional)"
            value={comment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
            rows={3}
            className="resize-none"
          />

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={handleDismiss} size="sm" className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-0">
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              size="sm"
              loading={submitting}
            >
              Submit Feedback
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
