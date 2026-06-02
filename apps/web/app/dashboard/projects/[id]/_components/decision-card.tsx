'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { HelpCircle, Send, MessageSquare } from 'lucide-react'
import type {
  ClarifyDecisionUi,
  ClarifyDecisionOption,
  ClarifyDecisionResponse,
} from '@repo/contracts/ai/decision-ui'
import { useI18n } from '@/src/i18n'

interface DecisionCardProps {
  decision: ClarifyDecisionUi
  onSubmit: (response: ClarifyDecisionResponse) => void
  disabled?: boolean
}

type ClarifyDecisionResponseWithComment = Exclude<
  ClarifyDecisionResponse,
  { type: 'not_sure' }
>

function withOptionalComment(
  response: ClarifyDecisionResponseWithComment,
  comment: string,
): ClarifyDecisionResponseWithComment {
  const trimmed = comment.trim()
  if (!trimmed) {
    return response
  }

  switch (response.type) {
    case 'single_choice':
      return { ...response, comment: trimmed }
    case 'multi_choice':
      return { ...response, comment: trimmed }
    case 'ranked':
      return { ...response, comment: trimmed }
    case 'modal_form':
      return { ...response, comment: trimmed }
  }
}

export function DecisionCard({ decision, onSubmit, disabled = false }: DecisionCardProps) {
  const { t } = useI18n()
  const [singleChoice, setSingleChoice] = useState('')
  const [multiChoices, setMultiChoices] = useState<string[]>([])
  const [ranked, setRanked] = useState<string[]>(
    () => (decision?.options ?? []).map((o: ClarifyDecisionOption) => o.id),
  )
  const [comment, setComment] = useState('')
  const [customInput, setCustomInput] = useState('')
  const [showComment, setShowComment] = useState(false)

  const options = decision?.options ?? []
  const type = decision?.type ?? 'single_choice'

  const isSimpleChoice =
    type === 'single_choice' &&
    options.length >= 2 &&
    options.length <= 5 &&
    options.every((o: ClarifyDecisionOption) => !o.description) &&
    !decision?.allow_custom

  const handleSubmit = () => {
    switch (type) {
      case 'single_choice': {
        if (!singleChoice && !customInput.trim()) return
        const selected = singleChoice || `custom: ${customInput.trim()}`
        const label =
          options.find((o: ClarifyDecisionOption) => o.id === singleChoice)?.label ??
          customInput.trim()
        onSubmit(
          withOptionalComment({ type: 'single_choice', selected, label }, comment),
        )
        return
      }
      case 'multi_choice': {
        if ((multiChoices?.length ?? 0) === 0 && !customInput.trim()) return
        const response: ClarifyDecisionResponse = {
          type: 'multi_choice',
          selected: multiChoices,
          labels: multiChoices.map(
            (id: string) =>
              options.find((o: ClarifyDecisionOption) => o.id === id)?.label ?? id,
          ),
        }
        if (customInput.trim()) {
          onSubmit(
            withOptionalComment({ ...response, custom: customInput.trim() }, comment),
          )
        } else {
          onSubmit(withOptionalComment(response, comment))
        }
        return
      }
      case 'ranked': {
        onSubmit(
          withOptionalComment(
            {
              type: 'ranked',
              ranking: ranked,
              labels: ranked.map(
                (id: string) =>
                  options.find((o: ClarifyDecisionOption) => o.id === id)?.label ?? id,
              ),
            },
            comment,
          ),
        )
        return
      }
      case 'modal_form': {
        onSubmit(
          withOptionalComment(
            {
              type: 'modal_form',
              selected: singleChoice || multiChoices,
            },
            comment,
          ),
        )
      }
    }
  }

  const handleNotSure = () => {
    onSubmit({
      type: 'not_sure',
      message: t('decision.notSureMessage'),
    })
  }

  const toggleMulti = (id: string) => {
    setMultiChoices((prev: string[]) =>
      (prev ?? []).includes(id)
        ? (prev ?? []).filter((x: string) => x !== id)
        : [...(prev ?? []), id],
    )
  }

  const moveRanked = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= (ranked?.length ?? 0)) return
    const newRanked = [...(ranked ?? [])]
    const [moved] = newRanked.splice(fromIndex, 1)
    newRanked.splice(toIndex, 0, moved)
    setRanked(newRanked)
  }

  if (isSimpleChoice) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {options.map((opt: ClarifyDecisionOption) => (
          <Button
            key={opt.id}
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => {
              if (disabled) return
              onSubmit({ type: 'single_choice', selected: opt.id, label: opt.label })
            }}
            className="h-8 text-xs rounded-full px-3 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {opt.label}
          </Button>
        ))}
        {decision?.allow_not_sure && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNotSure}
            disabled={disabled}
            className="h-8 text-xs rounded-full px-3 text-muted-foreground"
          >
            {t('decision.notSure')}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className="border-border/60 bg-muted/30">
      <CardContent className="p-3 space-y-3">
        {decision?.description && (
          <p className="text-xs text-muted-foreground">{decision.description}</p>
        )}

        {type === 'single_choice' && (
          <RadioGroup value={singleChoice} onValueChange={setSingleChoice} disabled={disabled}>
            <div className="space-y-1.5">
              {options.map((opt: ClarifyDecisionOption) => (
                <div
                  key={opt.id}
                  className="flex items-start gap-2.5 p-2 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => !disabled && setSingleChoice(opt.id)}
                >
                  <RadioGroupItem value={opt.id} id={opt.id} className="mt-0.5 shrink-0" />
                  <div>
                    <Label htmlFor={opt.id} className="text-sm font-medium cursor-pointer leading-tight">
                      {opt.label}
                    </Label>
                    {opt.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}

        {type === 'multi_choice' && (
          <div className="space-y-1.5">
            {options.map((opt: ClarifyDecisionOption) => (
              <div
                key={opt.id}
                className="flex items-start gap-2.5 p-2 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => !disabled && toggleMulti(opt.id)}
              >
                <Checkbox
                  checked={(multiChoices ?? []).includes(opt.id)}
                  onCheckedChange={() => toggleMulti(opt.id)}
                  disabled={disabled}
                  className="mt-0.5 shrink-0"
                />
                <div>
                  <span className="text-sm font-medium">{opt.label}</span>
                  {opt.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {type === 'ranked' && (
          <div className="space-y-1">
            {(ranked ?? []).map((id: string, index: number) => {
              const opt = options.find((o: ClarifyDecisionOption) => o.id === id)
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 p-2 rounded-md border bg-background"
                >
                  <span className="text-xs font-mono text-muted-foreground w-4 shrink-0">
                    {index + 1}.
                  </span>
                  <span className="text-sm font-medium flex-1">{opt?.label ?? id}</span>
                  <div className="flex flex-col shrink-0">
                    <button
                      type="button"
                      onClick={() => moveRanked(index, index - 1)}
                      disabled={index === 0 || disabled}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs p-0.5"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRanked(index, index + 1)}
                      disabled={index === (ranked?.length ?? 0) - 1 || disabled}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs p-0.5"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {decision?.allow_custom && type !== 'ranked' && (
          <Textarea
            placeholder={t('decision.customAnswerPlaceholder')}
            value={customInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomInput(e.target.value)}
            rows={2}
            className="resize-none text-sm"
            disabled={disabled}
          />
        )}

        {showComment ? (
          <Textarea
            placeholder={t('decision.addCommentPlaceholder')}
            value={comment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
            rows={1}
            className="resize-none text-xs"
            disabled={disabled}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowComment(true)}
            disabled={disabled}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-3 w-3" />
            {t('decision.addComment')}
          </button>
        )}

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={disabled}
            className="h-7 text-xs px-3"
          >
            <Send className="mr-1.5 h-3 w-3" />
            {t('common.submit')}
          </Button>
          {decision?.allow_not_sure && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNotSure}
              disabled={disabled}
              className="h-7 text-xs px-2 text-muted-foreground"
            >
              <HelpCircle className="mr-1 h-3 w-3" />
              {t('decision.notSure')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
