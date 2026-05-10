'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { HelpCircle, Send, MessageSquare } from 'lucide-react'

interface DecisionOption {
  id: string
  label: string
  description?: string
}

interface DecisionUI {
  type: 'single_choice' | 'multi_choice' | 'ranked' | 'modal_form'
  title: string
  description?: string
  options: DecisionOption[]
  allow_custom?: boolean
  allow_not_sure?: boolean
}

interface DecisionCardProps {
  decision: DecisionUI
  onSubmit: (response: any) => void
  disabled?: boolean
}

export function DecisionCard({ decision, onSubmit, disabled = false }: DecisionCardProps) {
  const [singleChoice, setSingleChoice] = useState('')
  const [multiChoices, setMultiChoices] = useState<string[]>([])
  const [ranked, setRanked] = useState<string[]>(
    () => (decision?.options ?? []).map((o: DecisionOption) => o.id)
  )
  const [comment, setComment] = useState('')
  const [customInput, setCustomInput] = useState('')
  const [showComment, setShowComment] = useState(false)

  const options = decision?.options ?? []
  const type = decision?.type ?? 'single_choice'

  // Simple choice: single_choice with 2-5 options, no per-option descriptions, no custom input
  const isSimpleChoice =
    type === 'single_choice' &&
    options.length >= 2 &&
    options.length <= 5 &&
    options.every((o: DecisionOption) => !o.description) &&
    !decision?.allow_custom

  const handleSubmit = () => {
    let response: any = { type }

    switch (type) {
      case 'single_choice':
        if (!singleChoice && !customInput.trim()) return
        response.selected = singleChoice || `custom: ${customInput.trim()}`
        response.label = options.find((o: DecisionOption) => o.id === singleChoice)?.label ?? customInput.trim()
        break
      case 'multi_choice':
        if ((multiChoices?.length ?? 0) === 0 && !customInput.trim()) return
        response.selected = multiChoices
        response.labels = multiChoices.map((id: string) => options.find((o: DecisionOption) => o.id === id)?.label ?? id)
        if (customInput.trim()) response.custom = customInput.trim()
        break
      case 'ranked':
        response.ranking = ranked
        response.labels = ranked.map((id: string) => options.find((o: DecisionOption) => o.id === id)?.label ?? id)
        break
      case 'modal_form':
        response.selected = singleChoice || multiChoices
        break
    }

    if (comment.trim()) response.comment = comment.trim()
    onSubmit(response)
  }

  const handleNotSure = () => {
    onSubmit({ type: 'not_sure', message: "I'm not sure about this. Can you ask differently?" })
  }

  const toggleMulti = (id: string) => {
    setMultiChoices((prev: string[]) =>
      (prev ?? []).includes(id)
        ? (prev ?? []).filter((x: string) => x !== id)
        : [...(prev ?? []), id]
    )
  }

  const moveRanked = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= (ranked?.length ?? 0)) return
    const newRanked = [...(ranked ?? [])]
    const [moved] = newRanked.splice(fromIndex, 1)
    newRanked.splice(toIndex, 0, moved)
    setRanked(newRanked)
  }

  // Compact pill buttons for simple single_choice (2-5 options, no descriptions, no custom)
  if (isSimpleChoice) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {options.map((opt: DecisionOption) => (
          <Button
            key={opt.id}
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => {
              if (disabled) return
              onSubmit({ type, selected: opt.id, label: opt.label })
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
            Not sure
          </Button>
        )}
      </div>
    )
  }

  // Full card for complex cases (multi_choice, ranked, options with descriptions, allow_custom)
  return (
    <Card className="border-border/60 bg-muted/30">
      <CardContent className="p-3 space-y-3">
        {decision?.description && (
          <p className="text-xs text-muted-foreground">{decision.description}</p>
        )}

        {/* Single Choice */}
        {type === 'single_choice' && (
          <RadioGroup value={singleChoice} onValueChange={setSingleChoice} disabled={disabled}>
            <div className="space-y-1.5">
              {options.map((opt: DecisionOption) => (
                <div
                  key={opt.id}
                  className="flex items-start gap-2.5 p-2 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => !disabled && setSingleChoice(opt.id)}
                >
                  <RadioGroupItem value={opt.id} id={opt.id} className="mt-0.5 shrink-0" />
                  <div>
                    <Label htmlFor={opt.id} className="text-sm font-medium cursor-pointer leading-tight">{opt.label}</Label>
                    {opt.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}

        {/* Multi Choice */}
        {type === 'multi_choice' && (
          <div className="space-y-1.5">
            {options.map((opt: DecisionOption) => (
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

        {/* Ranked */}
        {type === 'ranked' && (
          <div className="space-y-1">
            {(ranked ?? []).map((id: string, index: number) => {
              const opt = options.find((o: DecisionOption) => o.id === id)
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 p-2 rounded-md border bg-background"
                >
                  <span className="text-xs font-mono text-muted-foreground w-4 shrink-0">{index + 1}.</span>
                  <span className="text-sm font-medium flex-1">{opt?.label ?? id}</span>
                  <div className="flex flex-col shrink-0">
                    <button
                      onClick={() => moveRanked(index, index - 1)}
                      disabled={index === 0 || disabled}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs p-0.5"
                    >
                      ▲
                    </button>
                    <button
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

        {/* Custom input */}
        {decision?.allow_custom && type !== 'ranked' && (
          <Textarea
            placeholder="Or type your own answer..."
            value={customInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomInput(e.target.value)}
            rows={2}
            className="resize-none text-sm"
            disabled={disabled}
          />
        )}

        {/* Comment (collapsed by default) */}
        {showComment ? (
          <Textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
            rows={1}
            className="resize-none text-xs"
            disabled={disabled}
            autoFocus
          />
        ) : (
          <button
            onClick={() => setShowComment(true)}
            disabled={disabled}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-3 w-3" />
            Add a comment
          </button>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={disabled}
            className="h-7 text-xs px-3"
          >
            <Send className="mr-1.5 h-3 w-3" />
            Submit
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
              Not sure
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
