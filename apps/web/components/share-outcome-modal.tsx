'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/src/i18n'
import type { ShareOutcomeValue } from '@repo/contracts/feedback/submit'

interface ShareOutcomeModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  prdVersionId?: string | null
}

const OUTCOME_OPTIONS: { value: ShareOutcomeValue; labelKey: string }[] = [
  { value: 'yes', labelKey: 'feedback.outcome.yes' },
  { value: 'not_yet', labelKey: 'feedback.outcome.notYet' },
  { value: 'no', labelKey: 'feedback.outcome.no' },
]

export function ShareOutcomeModal({
  open,
  onClose,
  projectId,
  prdVersionId,
}: ShareOutcomeModalProps) {
  const { t } = useI18n()
  const [submitting, setSubmitting] = useState(false)
  const [showStars, setShowStars] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')

  const submit = async (outcomeValue: ShareOutcomeValue | null, stars?: number) => {
    setSubmitting(true)
    try {
      const body: Record<string, string | number | null> = {
        projectId,
        prdVersionId: prdVersionId ?? null,
        milestoneType: 'prd_shared',
        ratingType: outcomeValue ? 'outcome' : 'stars',
      }
      if (outcomeValue) {
        body.outcomeValue = outcomeValue
      }
      if (stars && stars > 0) {
        body.ratingValue = stars
      }
      const trimmedComment = comment.trim()
      if (trimmedComment.length > 0) {
        body.comment = trimmedComment
      }

      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      toast.success(t('feedback.thanks'))
      onClose()
    } catch {
      toast.error(t('feedback.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{t('feedback.outcome.title')}</DialogTitle>
          <DialogDescription>{t('feedback.outcome.question')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {OUTCOME_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant="outline"
              className="w-full justify-start h-auto py-3 text-left whitespace-normal"
              disabled={submitting}
              onClick={() => void submit(opt.value, rating > 0 ? rating : undefined)}
            >
              {t(opt.labelKey)}
            </Button>
          ))}

          <div className="flex items-center justify-between pt-1">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
              {t('feedback.skip')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1"
              onClick={() => setShowStars((v) => !v)}
            >
              {t('feedback.outcome.optionalStars')}
              {showStars ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {showStars ? (
            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star: number) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder={t('feedback.placeholderOptional')}
                value={comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
